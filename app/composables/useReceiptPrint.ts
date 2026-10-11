import { nextTick, ref } from 'vue'
import type { Sale } from '~/stores/sales'
import { useCompanyStore } from '~/stores/company'
import { useSettingsStore } from '~/stores/settings'
import { useToast } from '~/composables/useToast'
import { useTerminal } from '~/composables/useTerminal'
import { usePrinterDevice } from '~/composables/usePrinterDevice'
import { encodeReceipt } from '~/utils/encode-receipt'
import { saleToReceiptView } from '~/utils/receipt-view'
import { PHARMA_TICKET_CSS } from '~/utils/pharma-ticket-css'
import { printHtmlDocument } from '~/utils/print-html'
import type { Client } from '~/stores/client'
import type { Company, PrintChannel, ReceiptSaleView, ReceiptTemplate } from '~/types/receipt'
import { DEFAULT_REMISSION_SETTINGS, type RemissionSettings } from '~/types/settings'
import { saleToRemissionView } from '~/utils/remission-view'
import { renderRemissionHtml } from '~/utils/remission-html'
import { remissionFontFaces } from '~/utils/remission-fonts'

export function useReceiptPrint() {
  const companyStore = useCompanyStore()
  const settingsStore = useSettingsStore()
  const toast = useToast()
  const { profile } = useTerminal()
  const device = usePrinterDevice()
  const isPrinting = ref(false)

  /** Configuración › Impuestos › mostrar desglose (sí, si no se pudo leer). */
  async function showTaxBreakdown() {
    const taxes = await settingsStore.fetch('taxes').then((s) => s.values).catch(() => null)
    return taxes?.showBreakdownOnTicket ?? true
  }

  const paidInCash = (sale: Sale) => (sale.payments ?? []).some((p) => p.method === 'CASH' && Number(p.amount) > 0)

  /**
   * Imprime el ticket de una venta cobrada.
   *
   * @param opts.auto impresión automática al cobrar: sólo térmica y SIN abrir
   *   el selector de USB (el navegador sólo lo permite tras un clic). Si la
   *   impresora no está, se avisa y el cajero puede pulsar "Imprimir".
   * @param opts.openDrawer abrir el cajón en el mismo envío (cobro en efectivo).
   */
  async function printSale(
    sale: Sale,
    opts?: {
      previewEl?: HTMLElement | null
      onRegistered?: (copyNumber: number, channel: PrintChannel) => void
      auto?: boolean
      openDrawer?: boolean
    },
  ): Promise<boolean> {
    if (!sale.id || sale.flowStatus === 'DRAFT') {
      toast.warning('Cobra la venta para imprimir el ticket.')
      return false
    }

    // Una venta ANULADA no se imprime. Antes sólo se bloqueaban los borradores,
    // así que se podía sacar un ticket "ORIGINAL" de una venta cancelada: un
    // comprobante de compra de algo que se reembolsó, perfecto para reclamar
    // una segunda devolución en otra caja.
    if (sale.status === 'CANCELLED' || sale.flowStatus === 'CANCELLED') {
      toast.warning('Esta venta está anulada: no se puede imprimir su ticket.')
      return false
    }

    isPrinting.value = true
    try {
      const companyProfile = await companyStore.ensureProfile()
      const template = companyProfile.defaultTemplate
      if (!companyProfile.company || !template) {
        toast.error('Falta configurar la ficha de la farmacia y una plantilla de ticket.')
        return false
      }

      const printer = await device.pickPrinter(!opts?.auto)
      if (opts?.auto && !printer) {
        // Automática sin impresora: no se registra copia (no hubo emisión).
        toast.warning('No se encontró la impresora de esta caja. Pulsa "Imprimir" para elegirla.')
        return false
      }

      const channel: PrintChannel = printer ? 'THERMAL' : 'BROWSER'
      const record = await companyStore.registerPrint(sale.id, channel, template.id)
      opts?.onRegistered?.(record.copyNumber, channel)
      await nextTick()

      if (printer) {
        try {
          const view = saleToReceiptView(sale, {
            copyNumber: record.copyNumber,
            showTaxBreakdown: await showTaxBreakdown(),
          })
          const bytes = encodeReceipt(view, companyProfile.company, template, {
            openDrawerPin: opts?.openDrawer ? profile.value.drawerPin : undefined,
          })
          await device.send(printer, bytes)
          toast.success(
            record.copyNumber === 1
              ? 'Ticket original enviado a la impresora'
              : `Copia ${record.copyNumber} enviada a la impresora`,
          )
          return true
        } catch {
          if (opts?.auto) {
            // En automático no hay ticket en pantalla que mandar al navegador:
            // se avisa y el cajero reimprime (saldrá como copia: la emisión
            // quedó registrada).
            toast.warning(
              opts.openDrawer
                ? 'La impresora no respondió: no salió el ticket ni se abrió el cajón. Reimprime el ticket.'
                : 'La impresora no respondió y el ticket no salió. Reimprímelo.',
            )
            return false
          }
          toast.warning('La impresora térmica no respondió. Se abrirá el diálogo del navegador.')
        }
      }

      const impreso = await printBrowser(opts?.previewEl, record.copyNumber)
      if (!impreso) {
        // Antes esto fallaba en silencio (`if (!win) return`): el número de copia
        // ya se había registrado como emitido y el cajero no veía nada. Ahora al
        // menos se le dice, y la siguiente impresión saldrá como copia — que es
        // lo correcto para la bitácora: esa emisión sí ocurrió en el sistema.
        toast.error(
          'No se pudo abrir la impresión del navegador. Revisa la impresora predeterminada y vuelve a imprimir (saldrá como copia).',
        )
      }
      return impreso
    } finally {
      isPrinting.value = false
    }
  }

  /**
   * Lo que pasa en ESTA caja justo al cobrar, según su perfil:
   *  - impresión automática (térmica) con el cajón en el mismo envío si hubo
   *    efectivo y está activado "abrir cajón";
   *  - sin impresión automática pero con cajón: sólo el pulso.
   *
   * Nunca bloquea ni falla la venta: la venta ya está cobrada. Cualquier
   * problema de dispositivo se avisa y el cajero puede reimprimir.
   *
   * @returns true si el ticket ya salió (el modal no necesita "Imprimir").
   */
  async function afterSaleCompleted(
    sale: Sale,
    opts?: { onRegistered?: (copyNumber: number, channel: PrintChannel) => void },
  ): Promise<boolean> {
    const p = profile.value
    const drawer = p.openDrawerOnCash && paidInCash(sale)
    try {
      if (p.autoPrint && p.printMode === 'thermal') {
        return await printSale(sale, { auto: true, openDrawer: drawer, onRegistered: opts?.onRegistered })
      }
      if (drawer) {
        const ok = await device.kickDrawer(false)
        if (!ok) toast.warning('No se pudo abrir el cajón: la impresora de esta caja no está conectada.')
      }
    } catch {
      toast.warning('La impresora de esta caja no respondió. Puedes reimprimir el ticket.')
    }
    return false
  }

  /**
   * Impresión de PRUEBA desde la configuración del ticket o de dispositivos.
   *
   * Usa la plantilla y la ficha que están en pantalla, guardadas o no: sirve
   * justo para decidir si guardar. No registra copia ni consume folio, y el
   * ticket dice "IMPRESIÓN DE PRUEBA" para que nadie lo tome por un comprobante.
   */
  async function printTest(input: {
    sale: ReceiptSaleView
    company: Company
    template: ReceiptTemplate
    previewEl?: HTMLElement | null
  }) {
    isPrinting.value = true
    try {
      const sale: ReceiptSaleView = {
        ...input.sale,
        copyNumber: 0,
        note: 'IMPRESIÓN DE PRUEBA · NO ES UN COMPROBANTE',
      }

      const printer = await device.pickPrinter(true)
      if (printer) {
        try {
          await device.send(printer, encodeReceipt(sale, input.company, input.template))
          toast.success('Prueba enviada a la impresora térmica. Revisa acentos, cortes y el corte de papel.')
          return
        } catch {
          toast.warning('La impresora térmica no respondió. Se abrirá la impresión del navegador.')
        }
      }

      const ok = await printBrowser(input.previewEl, 0)
      if (!ok) toast.error('No se pudo abrir la impresión del navegador.')
    } finally {
      isPrinting.value = false
    }
  }

  // ── NOTA DE REMISIÓN (hoja completa) ─────────────────────────────────────
  // Misma venta, otro documento: se registra en la bitácora con su propia
  // numeración de copias (original, copia 2…) y sale por el diálogo del
  // navegador, que también permite "Guardar como PDF". Ver ADR-0019.

  /** Configuración › Nota de remisión; los valores de fábrica si no se pudo leer. */
  async function remissionSettings(): Promise<RemissionSettings> {
    const cfg = await settingsStore.fetch('remission').then((s) => s.values).catch(() => null)
    return cfg ?? DEFAULT_REMISSION_SETTINGS
  }

  /** HTML de la nota (vista previa y papel salen del mismo generador). */
  async function remissionHtml(
    sale: Sale,
    opts?: { copyNumber?: number; returnedTotal?: number; fallbackClient?: Client | null },
  ): Promise<string> {
    const cfg = await remissionSettings()
    const companyProfile = await companyStore.ensureProfile()
    const view = saleToRemissionView(sale, {
      copyNumber: opts?.copyNumber ?? 0,
      returnedTotal: opts?.returnedTotal,
      fallbackClient: opts?.fallbackClient,
      showTaxBreakdown: cfg.showTaxBreakdown,
    })
    return renderRemissionHtml(view, companyProfile.company, cfg, { fontFaces: remissionFontFaces() })
  }

  /** Mismas reglas que el ticket: ni borradores ni ventas anuladas. */
  function remissionBlockReason(sale: Sale): string | null {
    if (!sale.id || sale.flowStatus === 'DRAFT') return 'Cobra la venta para imprimir la nota de remisión.'
    if (sale.status === 'CANCELLED' || sale.flowStatus === 'CANCELLED') {
      return 'Esta venta está anulada: no se puede imprimir su nota de remisión.'
    }
    return null
  }

  /**
   * Imprime la nota de remisión de una venta cobrada.
   * @returns true si se lanzó el diálogo de impresión
   */
  async function printRemission(
    sale: Sale,
    opts?: {
      returnedTotal?: number
      fallbackClient?: Client | null
      onRegistered?: (copyNumber: number) => void
    },
  ): Promise<boolean> {
    const blocked = remissionBlockReason(sale)
    if (blocked) {
      toast.warning(blocked)
      return false
    }

    isPrinting.value = true
    try {
      const cfg = await remissionSettings()
      if (!cfg.enabled) {
        toast.warning('La nota de remisión está desactivada en Configuración.')
        return false
      }
      const companyProfile = await companyStore.ensureProfile()
      if (!companyProfile.company) {
        toast.error('Falta configurar la ficha de la farmacia (Configuración › Ticket).')
        return false
      }

      // El rastro se registra ANTES de imprimir: el papel debe coincidir con la
      // bitácora (si la impresión falla, la siguiente sale como copia: esa
      // emisión sí ocurrió en el sistema).
      const record = await companyStore.registerPrint(sale.id, 'BROWSER', undefined, 'REMISSION')
      opts?.onRegistered?.(record.copyNumber)

      const html = await remissionHtml(sale, {
        copyNumber: record.copyNumber,
        returnedTotal: opts?.returnedTotal,
        fallbackClient: opts?.fallbackClient,
      })
      const impreso = await printHtmlDocument(html)
      if (!impreso) {
        toast.error(
          'No se pudo abrir la impresión del navegador. Revisa la impresora predeterminada y vuelve a imprimir (saldrá como copia).',
        )
      }
      return impreso
    } finally {
      isPrinting.value = false
    }
  }

  return { printSale, printTest, afterSaleCompleted, printRemission, remissionHtml, remissionSettings, remissionBlockReason, isPrinting }
}

/**
 * Imprime el ticket con el diálogo del navegador.
 *
 * Decisiones que vienen de la farmacia real (el mecanismo de iframe, la espera
 * de fuentes y por qué no se usa `window.open` están en `printHtmlDocument`):
 *   - SIN Google Fonts: sin internet —requisito explícito— la impresión esperaba
 *     una fuente que nunca llegaba. Se usa la pila monoespaciada del sistema.
 *
 * @returns true si se lanzó el diálogo de impresión
 */
async function printBrowser(
  previewEl: HTMLElement | null | undefined,
  copyNumber: number,
): Promise<boolean> {
  const markup = previewEl?.outerHTML ?? '<p>Ticket no disponible</p>'

  return printHtmlDocument(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${copyNumber > 1 ? `Copia ${copyNumber}` : 'Ticket original'}</title>
    <style>
      ${PHARMA_TICKET_CSS}
      /* Pila local: funciona sin internet. Si la PC tiene IBM Plex Mono
         instalada se usa; si no, la monoespaciada del sistema. */
      .pharma-ticket, .pharma-ticket * {
        font-family: 'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace !important;
      }
      body { margin: 0; background: #fff; }
      @page { margin: 4mm; size: auto; }
    </style>
  </head>
  <body>${markup}</body>
</html>`)
}
