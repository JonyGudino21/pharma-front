import { nextTick, ref } from 'vue'
import type { Sale } from '~/stores/sales'
import { useCompanyStore } from '~/stores/company'
import { useToast } from '~/composables/useToast'
import { encodeReceipt } from '~/utils/encode-receipt'
import { saleToReceiptView } from '~/utils/receipt-view'
import { PHARMA_TICKET_CSS } from '~/utils/pharma-ticket-css'
import type { PrintChannel } from '~/types/receipt'

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

      printBrowser(opts?.previewEl, record.copyNumber)
    } finally {
      isPrinting.value = false
    }
  }

  return { printSale, isPrinting }
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

function printBrowser(previewEl: HTMLElement | null | undefined, copyNumber: number) {
  const markup = previewEl?.outerHTML ?? '<p>Ticket no disponible</p>'
  const win = window.open('', '_blank', 'width=420,height=740')
  if (!win) return
  win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${copyNumber > 1 ? `Copia ${copyNumber}` : 'Ticket original'}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap" />
    <style>
      ${PHARMA_TICKET_CSS}
      body { margin: 0; background: #fff; }
      @page { margin: 6mm; size: auto; }
    </style>
  </head>
  <body>${markup}</body>
</html>`)
  win.document.close()
  win.focus()
  win.print()
}
