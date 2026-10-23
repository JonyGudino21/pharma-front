import type { Company, ReceiptCharset, ReceiptSaleView, ReceiptTemplate } from '~/types/receipt'
import { DEFAULT_RECEIPT_LAYOUT } from '~/types/receipt'
import { EscPosEncoder, padLine, toPrinterText } from '~/utils/escpos'
import { formatTicketDateTime } from '~/utils/receipt-view'
import { LOGO_THERMAL_HINT } from '~/utils/receipt-blocks'

/** Columnas de texto a tamaño normal en cada ancho de rollo. */
export const COLUMNS_BY_WIDTH: Record<number, number> = { 58: 32, 80: 48 }

export type LineAlign = 'left' | 'center' | 'right'

/**
 * Una línea del ticket TÉRMICO, ya resuelta: texto final, alineación, énfasis
 * y tamaño.
 *
 * ─── POR QUÉ EXISTE ESTE MODELO ───
 * Antes el encoder ESC/POS escribía bytes directamente, y la vista previa de la
 * pantalla era un HTML aparte que "se parecía". Dos implementaciones del mismo
 * ticket: la pantalla prometía el logo, los acentos y el sello, y la térmica no
 * imprimía nada de eso.
 *
 * Ahora hay UNA sola descripción del ticket (`buildThermalReceipt`) y dos
 * consumidores: el encoder, que la convierte en bytes, y la vista previa
 * térmica, que la dibuja carácter por carácter. Lo que se ve es lo que sale.
 */
export interface ThermalLine {
  text: string
  align: LineAlign
  bold: boolean
  size: 1 | 2
  /** El contenido original no cabía y se recortó. */
  truncated: boolean
  /** Separador punteado entre secciones. */
  rule: boolean
}

export type ThermalWarningKind = 'accents' | 'truncated' | 'logo' | 'watermark'

export interface ThermalWarning {
  kind: ThermalWarningKind
  message: string
}

export interface ThermalReceipt {
  columns: number
  charset: ReceiptCharset
  lines: ThermalLine[]
  warnings: ThermalWarning[]
}

class LineBuilder {
  readonly lines: ThermalLine[] = []
  private lostAccents = false

  constructor(
    readonly columns: number,
    readonly charset: ReceiptCharset,
  ) {}

  /** Columnas efectivas: a tamaño doble cada carácter ocupa dos. */
  width(size: 1 | 2) {
    return size === 2 ? Math.floor(this.columns / 2) : this.columns
  }

  private printable(raw: string) {
    const text = toPrinterText(raw, this.charset)
    if (text !== raw) this.lostAccents = true
    return text
  }

  add(raw: string, opts: { align?: LineAlign; bold?: boolean; size?: 1 | 2 } = {}) {
    const size = opts.size ?? 1
    const max = this.width(size)
    const text = this.printable(raw)
    this.lines.push({
      text: text.length > max ? text.slice(0, max) : text,
      align: opts.align ?? 'left',
      bold: opts.bold ?? false,
      size,
      truncated: text.length > max,
      rule: false,
    })
  }

  /** Texto largo partido por palabras. Una palabra más larga que el renglón se corta. */
  wrap(raw: string, opts: { align?: LineAlign; bold?: boolean; size?: 1 | 2 } = {}) {
    const size = opts.size ?? 1
    const max = this.width(size)
    const words = this.printable(raw).split(/\s+/).filter(Boolean)
    let line = ''
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (next.length > max) {
        if (line) this.push(line, opts, size)
        line = word
      } else {
        line = next
      }
    }
    if (line) this.push(line, opts, size)
  }

  private push(text: string, opts: { align?: LineAlign; bold?: boolean }, size: 1 | 2) {
    const max = this.width(size)
    this.lines.push({
      text: text.slice(0, max),
      align: opts.align ?? 'left',
      bold: opts.bold ?? false,
      size,
      truncated: text.length > max,
      rule: false,
    })
  }

  /** Renglón con texto a la izquierda y cantidad a la derecha. */
  pair(left: string, right: string, opts: { bold?: boolean; size?: 1 | 2 } = {}) {
    const size = opts.size ?? 1
    const max = this.width(size)
    const l = this.printable(left)
    const r = this.printable(right)
    this.lines.push({
      text: padLine(l, r, max, this.charset),
      align: 'left',
      bold: opts.bold ?? false,
      size,
      truncated: l.length + r.length + 1 > max,
      rule: false,
    })
  }

  rule() {
    this.lines.push({
      text: '-'.repeat(this.columns),
      align: 'left',
      bold: false,
      size: 1,
      truncated: false,
      rule: true,
    })
  }

  get accentsLost() {
    return this.lostAccents
  }
}

/**
 * Describe el ticket tal como lo imprimirá la térmica.
 */
export function buildThermalReceipt(
  sale: ReceiptSaleView,
  company: Company,
  template: ReceiptTemplate,
): ThermalReceipt {
  const columns = COLUMNS_BY_WIDTH[template.paperWidthMm >= 80 ? 80 : 58]!
  const charset: ReceiptCharset = template.layout?.charset === 'cp850' ? 'cp850' : 'ascii'
  const blocks = template.layout?.blocks?.length ? template.layout.blocks : DEFAULT_RECEIPT_LAYOUT.blocks
  const scale: 1 | 2 = template.fontScale === 2 ? 2 : 1
  const b = new LineBuilder(columns, charset)

  blocks.forEach((block, index) => {
    if (block === 'header') writeHeader(b, company, template, scale)
    if (block === 'meta') writeMeta(b, sale)
    if (block === 'items') writeItems(b, sale)
    if (block === 'totals') writeTotals(b, sale, scale)
    if (block === 'payments') writePayments(b, sale)
    if (block === 'footer') writeFooter(b, sale, company)

    // Separador ENTRE secciones, no después de la última: el corte ya separa.
    const wrote = b.lines.length > 0 && !b.lines[b.lines.length - 1]!.rule
    if (wrote && index < blocks.length - 1) b.rule()
  })

  const warnings: ThermalWarning[] = []
  if (b.accentsLost) {
    warnings.push({
      kind: 'accents',
      message: 'Los acentos y la ñ se imprimen sin tilde. Activa "Acentos y ñ" si tu impresora lo soporta.',
    })
  }
  const truncated = b.lines.filter((l) => l.truncated).length
  if (truncated > 0) {
    warnings.push({
      kind: 'truncated',
      message: `${truncated} ${truncated === 1 ? 'renglón no cabe' : 'renglones no caben'} en ${columns} columnas y se ${truncated === 1 ? 'recorta' : 'recortan'}.`,
    })
  }
  // Con "Logo o cruz" encendido se avisa aunque no haya URL: la cruz verde
  // tampoco sale en térmica (el codificador ESC/POS no manda imágenes).
  if (template.showLogo && blocks.includes('header')) {
    warnings.push({ kind: 'logo', message: LOGO_THERMAL_HINT })
  }
  warnings.push({
    kind: 'watermark',
    message: 'ORIGINAL / COPIA se imprime como texto, no como marca de agua.',
  })

  return { columns, charset, lines: b.lines, warnings }
}

/** Bytes ESC/POS para la impresora, a partir de la misma descripción. */
export function encodeReceipt(
  sale: ReceiptSaleView,
  company: Company,
  template: ReceiptTemplate,
  /** Abrir el cajón al empezar a imprimir (cobro en efectivo). */
  opts: { openDrawerPin?: 0 | 1 } = {},
): Uint8Array {
  const receipt = buildThermalReceipt(sale, company, template)
  const enc = new EscPosEncoder(receipt.charset).init()
  // El pulso va ANTES del texto: el cajón abre mientras el ticket sale y el
  // cajero no espera al corte para dar el cambio.
  if (opts.openDrawerPin !== undefined) enc.openDrawer(opts.openDrawerPin)

  for (const line of receipt.lines) {
    enc.align(line.align).bold(line.bold).size(line.size).line(line.text)
  }

  return enc.size(1).bold(false).cut().encode()
}

// ── Secciones ──────────────────────────────────────────────────────────────

function writeHeader(b: LineBuilder, company: Company, template: ReceiptTemplate, scale: 1 | 2) {
  b.wrap(company.tradeName || company.legalName || 'Mi Farmacia', { align: 'center', bold: true, size: scale })
  if (company.legalName && company.legalName !== company.tradeName) {
    b.wrap(company.legalName, { align: 'center' })
  }
  if (template.showTaxId && company.rfc) b.add(`RFC ${company.rfc}`, { align: 'center' })
  if (template.showTaxId && company.fiscalRegime) b.wrap(company.fiscalRegime, { align: 'center' })
  if (template.showAddress && company.address) b.wrap(company.address, { align: 'center' })
  if (template.showPhone && company.phone) b.add(`Tel. ${company.phone}`, { align: 'center' })
  if (template.showPhone && company.email) b.add(company.email, { align: 'center' })
}

function writeMeta(b: LineBuilder, sale: ReceiptSaleView) {
  const folio = sale.invoiceNumber || (sale.id ? `#${sale.id}` : 'BORRADOR')
  b.pair('Folio', folio)
  b.pair('Fecha', formatTicketDateTime(sale.createdAt))
  if (sale.cashierName) b.pair('Atendió', sale.cashierName)
  b.pair('Cliente', sale.clientName || 'Público General')
  if (sale.clientRfc) b.pair('RFC', sale.clientRfc)
  if (sale.copyNumber > 1) b.add(`*** COPIA ${sale.copyNumber} ***`, { align: 'center', bold: true })
  else if (sale.copyNumber === 1) b.add('ORIGINAL', { align: 'center', bold: true })
}

function writeItems(b: LineBuilder, sale: ReceiptSaleView) {
  for (const item of sale.items) {
    b.wrap(`${item.quantity} x ${item.name}`)
    const descuento = item.discount ?? 0
    // Con descuento se imprime el bruto y el descuento aparte: SUBTOTAL −
    // DESCUENTOS = TOTAL cuadra renglón por renglón con lo que ve el cliente.
    b.pair(`  ${money(item.unitPrice)} c/u`, money(descuento > 0 ? item.subtotal + descuento : item.subtotal))
    if (descuento > 0) {
      b.pair(`  Descuento ${formatPercent(item.discountPercent ?? 0)}`, `-${money(descuento)}`)
    }
  }
}

const formatPercent = (p: number) => `${Number.isInteger(p) ? p : p.toFixed(2).replace(/0$/, '')}%`

function writeTotals(b: LineBuilder, sale: ReceiptSaleView, scale: 1 | 2) {
  b.pair('SUBTOTAL', money(sale.subtotal))
  const descuentos = sale.discountTotal ?? 0
  if (descuentos > 0) b.pair('DESCUENTOS', `-${money(descuentos)}`)
  // A tamaño doble el renglón tiene la MITAD de columnas. Antes se rellenaba al
  // ancho completo y el total —el número que más importa— se salía del papel.
  writeTotalLine(b, money(sale.total), scale)
  // Precios con IVA incluido (LFPC art. 7 Bis): el desglose es informativo.
  for (const row of sale.taxBreakdown ?? []) {
    b.pair(`IVA ${row.ratePercent}% incluido`, money(row.tax))
  }
  b.pair('PAGADO', money(sale.paidAmount))
  if (sale.balance > 0) b.pair('SALDO', money(sale.balance), { bold: true })
  if (descuentos > 0) b.add(`Usted ahorró ${money(descuentos)}`, { align: 'center' })
}

/**
 * El TOTAL nunca se recorta: es el dato que el cliente revisa.
 *
 * A letra doble en 58 mm sólo caben 16 columnas; "TOTAL $123,456.78" ya no
 * entra y `pair` recortaba la etiqueta a "TO". Cuando no cabe en un renglón se
 * parte en dos: la etiqueta a tamaño normal y el importe grande, alineado a la
 * derecha. Si ni el importe solo cabe grande, todo baja a tamaño normal.
 */
function writeTotalLine(b: LineBuilder, amount: string, scale: 1 | 2) {
  const label = 'TOTAL'
  if (label.length + 1 + amount.length <= b.width(scale)) {
    b.pair(label, amount, { bold: true, size: scale })
  } else if (amount.length <= b.width(scale)) {
    b.add(label, { bold: true })
    b.add(amount, { bold: true, size: scale, align: 'right' })
  } else {
    b.pair(label, amount, { bold: true })
  }
}

function writePayments(b: LineBuilder, sale: ReceiptSaleView) {
  for (const pay of sale.payments) b.pair(pay.method, money(pay.amount))
}

function writeFooter(b: LineBuilder, sale: ReceiptSaleView, company: Company) {
  if (sale.note) b.wrap(sale.note, { align: 'center' })
  b.wrap('Comprobante de venta. No es un CFDI.', { align: 'center' })
  if (company.ticketFooter) b.wrap(company.ticketFooter, { align: 'center' })
}

function money(value: number): string {
  return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
