export {}

/**
 * Subconjunto de WebUSB que usa el punto de venta (impresora térmica y cajón).
 * Declarado a mano para no depender de @types/w3c-web-usb.
 */
declare global {
  type UsbDirection = 'in' | 'out'

  interface UsbDeviceFilter {
    classCode?: number
    vendorId?: number
    productId?: number
  }

  interface UsbEndpoint {
    endpointNumber: number
    direction: UsbDirection
    type: string
  }

  interface UsbAlternateInterface {
    interfaceClass: number
    endpoints: UsbEndpoint[]
  }

  interface UsbInterface {
    interfaceNumber: number
    claimed: boolean
    alternates: UsbAlternateInterface[]
  }

  interface UsbConfiguration {
    interfaces: UsbInterface[]
  }

  interface UsbDevice {
    /** Identifican el modelo y, con la serie, la unidad física exacta. */
    vendorId: number
    productId: number
    serialNumber?: string
    manufacturerName?: string
    productName?: string
    opened: boolean
    configuration: UsbConfiguration | null
    open(): Promise<void>
    close(): Promise<void>
    selectConfiguration(value: number): Promise<void>
    claimInterface(interfaceNumber: number): Promise<void>
    transferOut(endpointNumber: number, data: Uint8Array): Promise<unknown>
    /** Chrome 101+: revoca el permiso del sitio sobre el dispositivo. */
    forget?(): Promise<void>
  }

  interface Usb {
    getDevices(): Promise<UsbDevice[]>
    requestDevice(options: { filters: UsbDeviceFilter[] }): Promise<UsbDevice>
  }

  interface Navigator {
    usb?: Usb
  }
}
