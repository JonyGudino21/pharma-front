export type PrintChannel = 'THERMAL' | 'BROWSER'

/** Documento emitido: ticket térmico o nota de remisión (hoja completa). */
export type PrintDocument = 'TICKET' | 'REMISSION'

export type ReceiptBlock =
  | 'header'
  | 'meta'
  | 'items'
  | 'totals'
  | 'payments'
  | 'footer'

/**
 * Juego de caracteres de la térmica. `ascii` funciona en cualquier impresora
 * pero pierde acentos y eñes; `cp850` los imprime en casi todas las térmicas
 * Epson-compatibles. Se confirma con "Imprimir prueba".
 */
export type ReceiptCharset = 'ascii' | 'cp850'

export interface ReceiptLayout {
  blocks: ReceiptBlock[]
  charset?: ReceiptCharset
}

export interface Company {
  id: number
  legalName: string
  tradeName: string
  rfc: string
  fiscalRegime: string | null
  address: string
  phone: string | null
  email: string | null
  logoUrl: string | null
  ticketFooter: string | null
}

export interface ReceiptTemplate {
  id: number
  companyId: number
  name: string
  paperWidthMm: 58 | 80 | number
  showLogo: boolean
  showTaxId: boolean
  showAddress: boolean
  showPhone: boolean
  fontScale: 1 | 2 | number
  layout: ReceiptLayout
  isDefault: boolean
  isActive: boolean
}

export interface CompanyProfile {
  company: Company
  templates: ReceiptTemplate[]
  defaultTemplate: ReceiptTemplate | null
}

export interface ReceiptLine {
  quantity: number
  name: string
  sku?: string | null
  unitPrice: number
  /** Neto de la línea (con descuento, IVA incluido). */
  subtotal: number
  /** 0 si no hay descuento. */
  discountPercent?: number
  /** Importe descontado de la línea. */
  discount?: number
}

/** IVA contenido en el total, por tasa. Sólo tasas con impuesto (> 0). */
export interface ReceiptTaxRow {
  /** 16, 8 */
  ratePercent: number
  base: number
  tax: number
}

export interface ReceiptPaymentLine {
  method: string
  amount: number
}

export interface ReceiptSaleView {
  id: number | null
  invoiceNumber: string | null
  createdAt: string
  flowStatus: 'DRAFT' | 'COMPLETED' | 'CANCELLED'
  items: ReceiptLine[]
  /** Suma bruta, antes de descuentos. */
  subtotal: number
  discountTotal?: number
  /** Vacío = no se imprime desglose (Configuración › Impuestos). */
  taxBreakdown?: ReceiptTaxRow[]
  total: number
  paidAmount: number
  balance: number
  payments: ReceiptPaymentLine[]
  clientName: string | null
  clientRfc: string | null
  cashierName: string | null
  note: string | null
  copyNumber: number
}

export interface SaleReceiptPrint {
  id: number
  saleId: number
  /** Registros anteriores a la nota de remisión no lo traen: son TICKET. */
  document?: PrintDocument
  copyNumber: number
  channel: PrintChannel
  printedAt: string
  printedBy?: { firstName: string; lastName: string } | null
  template?: { id: number; name: string; paperWidthMm: number } | null
}

export const DEFAULT_RECEIPT_LAYOUT: Required<ReceiptLayout> = {
  blocks: ['header', 'meta', 'items', 'totals', 'payments', 'footer'],
  charset: 'ascii',
}

/** Bloques que un ticket no puede omitir (el backend también lo exige). */
export const REQUIRED_RECEIPT_BLOCKS: readonly ReceiptBlock[] = ['items', 'totals']

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'CASH':
      return 'Efectivo'
    case 'CARD':
      return 'Tarjeta'
    case 'TRANSFER':
      return 'Transferencia'
    default:
      return method
  }
}
