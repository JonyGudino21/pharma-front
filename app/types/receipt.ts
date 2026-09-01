export type PrintChannel = 'THERMAL' | 'BROWSER'

export type ReceiptBlock =
  | 'header'
  | 'meta'
  | 'items'
  | 'totals'
  | 'payments'
  | 'footer'

export interface ReceiptLayout {
  blocks: ReceiptBlock[]
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
  subtotal: number
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
  subtotal: number
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
  copyNumber: number
  channel: PrintChannel
  printedAt: string
  printedBy?: { firstName: string; lastName: string } | null
  template?: { id: number; name: string; paperWidthMm: number } | null
}

export const DEFAULT_RECEIPT_LAYOUT: ReceiptLayout = {
  blocks: ['header', 'meta', 'items', 'totals', 'payments', 'footer'],
}

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
