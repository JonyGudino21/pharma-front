import { useTerminal, type PrinterBinding } from '~/composables/useTerminal'
import { encodeDrawerPulse } from '~/utils/escpos'

/**
 * Capa de dispositivo: encontrar la impresora de ESTA caja y mandarle bytes.
 *
 * Antes se tomaba el primer dispositivo USB autorizado: con dos impresoras en
 * la misma PC (o un lector de huella USB autorizado por error) el ticket podía
 * irse al aparato equivocado. Ahora se usa la impresora emparejada en
 * Configuración › Dispositivos, identificada por fabricante, modelo y serie.
 */

/** Filtros del selector: impresoras (clase 7) y marcas térmicas comunes. */
const USB_FILTERS = [
  { classCode: 7 },
  { vendorId: 0x04b8 }, // Epson
  { vendorId: 0x0519 }, // Star
  { vendorId: 0x0dd4 }, // Custom
  { vendorId: 0x0483 }, // STMicro (genéricas chinas)
  { vendorId: 0x0416 }, // Winbond (genéricas)
  { vendorId: 0x1fc9 }, // NXP (genéricas)
]

export const webUsbAvailable = () => import.meta.client && !!navigator.usb

/** WebUSB, o null fuera del navegador / en navegadores sin soporte. */
const usbApi = (): Usb | null => (import.meta.client ? (navigator.usb ?? null) : null)

function matches(d: UsbDevice, b: PrinterBinding) {
  return d.vendorId === b.vendorId && d.productId === b.productId && (b.serialNumber === null || d.serialNumber === b.serialNumber)
}

export function bindingOf(d: UsbDevice): PrinterBinding {
  return {
    vendorId: d.vendorId,
    productId: d.productId,
    serialNumber: d.serialNumber ?? null,
    label: [d.manufacturerName, d.productName].filter(Boolean).join(' ') || `USB ${d.vendorId.toString(16)}:${d.productId.toString(16)}`,
  }
}

export function usePrinterDevice() {
  const { profile } = useTerminal()

  /**
   * La impresora de esta caja, o null.
   * @param interactive si se puede abrir el selector del navegador (sólo con un
   *   clic del usuario: el navegador lo exige). En impresión automática, false.
   */
  async function pickPrinter(interactive: boolean): Promise<UsbDevice | null> {
    const usb = usbApi()
    if (!usb || profile.value.printMode !== 'thermal') return null
    const known = await usb.getDevices()
    const binding = profile.value.printer

    if (binding) {
      const found = known.find((d) => matches(d, binding))
      if (found) return found
    } else if (known.length === 1) {
      // Sin emparejar pero con un único dispositivo autorizado: el caso de
      // instalaciones anteriores a Configuración › Dispositivos.
      return known[0] ?? null
    }

    if (!interactive) return null
    try {
      return await usb.requestDevice({ filters: USB_FILTERS })
    } catch {
      return null // el usuario cerró el selector
    }
  }

  /** Abre el selector y devuelve la impresora elegida (para emparejar). */
  async function requestPrinter(): Promise<UsbDevice | null> {
    const usb = usbApi()
    if (!usb) return null
    try {
      return await usb.requestDevice({ filters: USB_FILTERS })
    } catch {
      return null
    }
  }

  /** Olvida el permiso del navegador sobre la impresora (Chrome 101+). */
  async function forgetPrinter(binding: PrinterBinding) {
    const usb = usbApi()
    if (!usb) return
    const d = (await usb.getDevices()).find((x) => matches(x, binding))
    await d?.forget?.()
  }

  async function send(device: UsbDevice, bytes: Uint8Array) {
    await device.open()
    try {
      if (device.configuration === null) await device.selectConfiguration(1)
      const iface = device.configuration?.interfaces.find((i) =>
        i.alternates.some((a) => a.endpoints.some((e) => e.direction === 'out')),
      )
      const endpoint = iface?.alternates
        .find((a) => a.endpoints.some((e) => e.direction === 'out'))
        ?.endpoints.find((e) => e.direction === 'out')
      if (!iface || !endpoint) throw new Error('NO_OUT_ENDPOINT')
      if (!iface.claimed) await device.claimInterface(iface.interfaceNumber)
      await device.transferOut(endpoint.endpointNumber, bytes)
    } finally {
      // Siempre se cierra: un dispositivo que queda abierto por un error
      // bloquea la siguiente impresión hasta recargar la página.
      await device.close().catch(() => undefined)
    }
  }

  /** Pulso al cajón. Devuelve false si no hay impresora térmica disponible. */
  async function kickDrawer(interactive: boolean): Promise<boolean> {
    const device = await pickPrinter(interactive)
    if (!device) return false
    await send(device, encodeDrawerPulse(profile.value.drawerPin))
    return true
  }

  return { pickPrinter, requestPrinter, forgetPrinter, send, kickDrawer }
}
