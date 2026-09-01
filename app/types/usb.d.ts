export {}

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
  opened: boolean
  configuration: UsbConfiguration | null
  open(): Promise<void>
  close(): Promise<void>
  selectConfiguration(value: number): Promise<void>
  claimInterface(interfaceNumber: number): Promise<void>
  transferOut(endpointNumber: number, data: Uint8Array): Promise<unknown>
}

interface Usb {
  getDevices(): Promise<UsbDevice[]>
  requestDevice(options: { filters: UsbDeviceFilter[] }): Promise<UsbDevice>
}

declare global {
  interface Navigator {
    usb?: Usb
  }
}
