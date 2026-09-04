import type { Company, ReceiptSaleView, ReceiptTemplate } from '~/types/receipt'
import { EscPosEncoder, padLine } from '~/utils/escpos'
import { formatTicketDateTime } from '~/utils/receipt-view'

const COLS_58 = 32
const COLS_80 = 48

export function encodeReceipt(
  sale: ReceiptSaleView,
  company: Company,
  template: ReceiptTemplate,
): Uint8Array {
  const cols = template.paperWidthMm >= 80 ? COLS_80 : COLS_58
  const blocks = template.layout?.blocks ?? ['header', 'meta', 'items', 'totals', 'payments', 'footer']
  const enc = new EscPosEncoder().init()
  const scale = template.fontScale === 2 ? 2 : 1

  for (const block of blocks) {
    if (block === 'header') writeHeader(enc, company, template, cols, scale)
    if (block === 'meta') writeMeta(enc, sale, cols)
    if (block === 'items') writeItems(enc, sale, cols)
    if (block === 'totals') writeTotals(enc, sale, cols, scale)
    if (block === 'payments') writePayments(enc, sale, cols)
    if (block === 'footer') writeFooter(enc, company, cols)
  }

  return enc.cut().encode()
}

function writeHeader(
  enc: EscPosEncoder,
  company: Company,
  template: ReceiptTemplate,
  cols: number,
  scale: 1 | 2,
) {
  enc.align('center').size(scale).bold(true).line(company.tradeName || company.legalName)
  enc.size(1).bold(false)
  if (company.legalName && company.legalName !== company.tradeName) {
    enc.line(company.legalName)
  }
  if (template.showTaxId && company.rfc) enc.line(`RFC ${company.rfc}`)
  if (template.showAddress && company.address) wrap(enc, company.address, cols)
  if (template.showPhone && company.phone) enc.line(`Tel. ${company.phone}`)
  enc.separator(cols)
}

function writeMeta(enc: EscPosEncoder, sale: ReceiptSaleView, cols: number) {
  enc.align('left')
  const folio = sale.invoiceNumber || (sale.id ? `#${sale.id}` : 'BORRADOR')
  enc.line(`Folio ${folio}`)
  enc.line(formatTicketDateTime(sale.createdAt))
  if (sale.cashierName) enc.line(`Le atendio ${sale.cashierName}`)
  if (sale.clientName) enc.line(`Cliente ${sale.clientName}`)
  if (sale.copyNumber > 1) {
    enc.align('center').bold(true).line(`*** COPIA ${sale.copyNumber} ***`).bold(false).align('left')
  } else if (sale.copyNumber === 1) {
    enc.align('center').line('ORIGINAL').align('left')
  }
  enc.separator(cols)
}

function writeItems(enc: EscPosEncoder, sale: ReceiptSaleView, cols: number) {
  enc.align('left')
  for (const item of sale.items) {
    enc.line(`${item.quantity} x ${item.name}`)
    enc.line(padLine(money(item.unitPrice), money(item.subtotal), cols))
  }
  enc.separator(cols)
}

function writeTotals(enc: EscPosEncoder, sale: ReceiptSaleView, cols: number, scale: 1 | 2) {
  enc.align('left')
  enc.line(padLine('SUBTOTAL', money(sale.subtotal), cols))
  enc.bold(true).size(scale)
  enc.line(padLine('TOTAL', money(sale.total), cols))
  enc.size(1).bold(false)
  enc.line(padLine('PAGADO', money(sale.paidAmount), cols))
  if (sale.balance > 0) enc.line(padLine('SALDO', money(sale.balance), cols))
  enc.separator(cols)
}

function writePayments(enc: EscPosEncoder, sale: ReceiptSaleView, cols: number) {
  if (sale.payments.length === 0) return
  enc.align('left')
  for (const pay of sale.payments) {
    enc.line(padLine(pay.method, money(pay.amount), cols))
  }
  enc.separator(cols)
}

function writeFooter(enc: EscPosEncoder, company: Company, cols: number) {
  enc.align('center')
  wrap(enc, 'Comprobante de venta. No es un CFDI.', cols)
  if (company.ticketFooter) wrap(enc, company.ticketFooter, cols)
}

function wrap(enc: EscPosEncoder, text: string, cols: number) {
  const words = text.split(/\s+/)
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > cols) {
      if (line) enc.line(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) enc.line(line)
}

function money(value: number): string {
  return `$${value.toFixed(2)}`
}
