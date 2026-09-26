import { nextTick, ref } from 'vue'
import type { Sale } from '~/stores/sales'
import { useCompanyStore } from '~/stores/company'
import { useToast } from '~/composables/useToast'
import { encodeReceipt } from '~/utils/encode-receipt'
import { saleToReceiptView } from '~/utils/receipt-view'
import { PHARMA_TICKET_CSS } from '~/utils/pharma-ticket-css'
import type { Company, PrintChannel, ReceiptSaleView, ReceiptTemplate } from '~/types/receipt'

const USB_FILTERS = [
  { classCode: 7 },
  { vendorId: 0x04b8 },
  { vendorId: 0x0519 },
  { vendorId: 0x0dd4 },
  { vendorId: 0x0483 },
]

export function useReceiptPrint() {
  const companyStore = useCompanyStore()
  const toast = useToast()
  const isPrinting = ref(false)

  async function printSale(
    sale: Sale,
    opts?: {
      previewEl?: HTMLElement | null
      onRegistered?: (copyNumber: number, channel: PrintChannel) => void
    },
  ) {
    if (!sale.id || sale.flowStatus === 'DRAFT') {
      toast.warning('Cobra la venta para imprimir el ticket.')
      return
    }

    // Una venta ANULADA no se imprime. Antes sólo se bloqueaban los borradores,
    // así que se podía sacar un ticket "ORIGINAL" de una venta cancelada: un
    // comprobante de compra de algo que se reembolsó, perfecto para reclamar
    // una segunda devolución en otra caja.
    if (sale.status === 'CANCELLED' || sale.flowStatus === 'CANCELLED') {
      toast.warning('Esta venta está anulada: no se puede imprimir su ticket.')
      return
    }

    isPrinting.value = true
    try {
      const profile = await companyStore.ensureProfile()
      const template = profile.defaultTemplate
      if (!profile.company || !template) {
        toast.error('Falta configurar la ficha de la farmacia y una plantilla de ticket.')
        return
      }

      const printer = await pickPrinter()
      const channel: PrintChannel = printer ? 'THERMAL' : 'BROWSER'
      const record = await companyStore.registerPrint(sale.id, channel, template.id)
      opts?.onRegistered?.(record.copyNumber, channel)
      await nextTick()

      if (printer) {
        try {
          const view = saleToReceiptView(sale, { copyNumber: record.copyNumber })
          const bytes = encodeReceipt(view, profile.company, template)
          await sendToPrinter(printer, bytes)
          toast.success(
            record.copyNumber === 1
              ? 'Ticket original enviado a la impresora'
              : `Copia ${record.copyNumber} enviada a la impresora`,
          )
          return
        } catch {
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
    } finally {
      isPrinting.value = false
    }
  }

  /**
   * Impresión de PRUEBA desde la configuración del ticket.
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

      const printer = await pickPrinter()
      if (printer) {
        try {
          await sendToPrinter(printer, encodeReceipt(sale, input.company, input.template))
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

  return { printSale, printTest, isPrinting }
}

async function pickPrinter() {
  const usb = navigator.usb
  if (!usb) return null
  const already = await usb.getDevices()
  if (already.length > 0) return already[0]
  try {
    return await usb.requestDevice({ filters: USB_FILTERS })
  } catch {
    return null
  }
}

async function sendToPrinter(
  device: NonNullable<Awaited<ReturnType<typeof pickPrinter>>>,
  bytes: Uint8Array,
) {
  if (!device) throw new Error('NO_DEVICE')
  await device.open()
  if (device.configuration === null) {
    await device.selectConfiguration(1)
  }
  const iface = device.configuration?.interfaces.find((i) =>
    i.alternates.some((a) => a.endpoints.some((e) => e.direction === 'out')),
  )
  if (!iface) {
    await device.close()
    throw new Error('NO_OUT_ENDPOINT')
  }
  const alternate = iface.alternates.find((a) =>
    a.endpoints.some((e) => e.direction === 'out'),
  )
  const endpoint = alternate?.endpoints.find((e) => e.direction === 'out')
  if (!endpoint) {
    await device.close()
    throw new Error('NO_OUT_ENDPOINT')
  }
  if (!iface.claimed) {
    await device.claimInterface(iface.interfaceNumber)
  }
  await device.transferOut(endpoint.endpointNumber, bytes)
  await device.close()
}

/**
 * Imprime el ticket con el diálogo del navegador, desde un IFRAME oculto.
 *
 * Tres cambios respecto a la versión anterior, los tres por la farmacia real:
 *
 *   1. IFRAME en vez de `window.open`. La ventana se abría DESPUÉS de varios
 *      `await` (perfil, impresora, registro de la copia) y para entonces el
 *      navegador ya no la consideraba producto de un clic: el bloqueador de
 *      ventanas emergentes la cortaba y no salía nada. Un iframe no es una
 *      ventana emergente y no se bloquea.
 *   2. SIN Google Fonts. La hoja se pedía a fonts.googleapis.com: sin internet
 *      —requisito explícito de la farmacia— la impresión esperaba una fuente
 *      que nunca llegaba. Ahora usa la pila monoespaciada del sistema.
 *   3. Espera a que el documento y sus fuentes estén listos antes de imprimir.
 *      `print()` inmediato podía sacar el ticket con la tipografía a medio
 *      cargar o en blanco.
 *
 * @returns true si se lanzó el diálogo de impresión
 */
async function printBrowser(
  previewEl: HTMLElement | null | undefined,
  copyNumber: number,
): Promise<boolean> {
  const markup = previewEl?.outerHTML ?? '<p>Ticket no disponible</p>'

  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  document.body.appendChild(frame)

  try {
    const doc = frame.contentDocument
    const win = frame.contentWindow
    if (!doc || !win) return false

    doc.open()
    doc.write(`<!doctype html>
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
    doc.close()

    // Documento y fuentes listos. `fonts.ready` no existe en navegadores muy
    // viejos: en ese caso se sigue sin esperar.
    await new Promise<void>((resolve) => {
      if (doc.readyState === 'complete') resolve()
      else frame.addEventListener('load', () => resolve(), { once: true })
    })
    await doc.fonts?.ready

    win.focus()
    win.print()
    return true
  } catch {
    return false
  } finally {
    // Se retira después de que el diálogo se cierre. `print()` es síncrono en
    // Chrome (bloquea hasta cerrar el diálogo), pero no en todos: un margen
    // evita arrancar el documento mientras el diálogo aún lo lee.
    setTimeout(() => frame.remove(), 1000)
  }
}
