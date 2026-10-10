import type { Sale } from '~/stores/sales'
import type { Client } from '~/stores/client'
import type { User } from '~/types/auth'
import type { ReceiptLine, ReceiptPaymentLine, ReceiptTaxRow } from '~/types/receipt'
import { saleToReceiptView } from '~/utils/receipt-view'
import { importeConLetra } from '~/utils/amount-in-words'

/**
 * Modelo de la NOTA DE REMISIÓN: todo lo que el documento necesita, ya
 * calculado. El generador del HTML (`remission-html.ts`) sólo lo pinta; no
 * decide nada ni recalcula importes (ADR-0016: los importes de una venta
 * cobrada son los que el servidor congeló).
 */
export interface RemissionParty {
  name: string
  rfc: string | null
  address: string | null
  phone: string | null
  email: string | null
  /** "Público en general": no se imprimen domicilio ni contacto. */
  isGeneral: boolean
}

export interface RemissionView {
  /** NR-AAAAMMDD-000123. Se deriva del folio de la venta: una venta, una nota. */
  folio: string
  /** Folio original de la venta (FAC-…), para cruzarlo con el ticket. */
  saleRef: string | null
  issuedAt: string
  /** 0 = aún sin emitir (vista previa). 1 = original. 2+ = copia. */
  copyNumber: number
  client: RemissionParty
  cashierName: string | null
  items: Array<ReceiptLine & { sku?: string | null }>
  subtotal: number
  discountTotal: number
  taxBreakdown: ReceiptTaxRow[]
  total: number
  paidAmount: number
  balance: number
  payments: ReceiptPaymentLine[]
  note: string | null
  /** Importe devuelto, si la venta tiene devoluciones. 0 = ninguna. */
  returnedTotal: number
  amountInWords: string
}

export const PUBLICO_GENERAL = 'Público en general'

/**
 * Folio de la nota a partir del de la venta ("FAC-20261010-000123" →
 * "NR-20261010-000123"). Se DERIVA en lugar de numerarse aparte: no hay una
 * secuencia nueva que se pueda desfasar, y el cliente y la farmacia pueden
 * cruzar nota y ticket por el mismo sufijo. El prefijo FAC- se evita a
 * propósito: sugiere factura y esto no lo es.
 */
export function remissionFolio(invoiceNumber: string | null | undefined, saleId: number | null | undefined): string {
  const inv = (invoiceNumber ?? '').trim()
  if (/^FAC-/i.test(inv)) return `NR-${inv.slice(4)}`
  if (inv) return inv
  return saleId ? `NR-${String(saleId).padStart(6, '0')}` : 'NR-SIN-FOLIO'
}

const clean = (v: string | null | undefined) => {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}

function partyOf(client: Client | Sale['client'] | null | undefined): RemissionParty {
  const name = clean(client?.name)
  if (!client || !name) {
    return { name: PUBLICO_GENERAL, rfc: null, address: null, phone: null, email: null, isGeneral: true }
  }
  return {
    name,
    rfc: clean(client.rfc),
    address: clean(client.address),
    phone: clean(client.phone),
    email: clean(client.email),
    isGeneral: false,
  }
}

export function saleToRemissionView(
  sale: Sale,
  opts?: {
    copyNumber?: number
    /** Si la venta no trae el cliente completo (p. ej. venta recién cobrada en el POS). */
    fallbackClient?: Client | null
    fallbackCashier?: User | null
    /** Importe ya devuelto (suma de reembolsos), para advertirlo en la nota. */
    returnedTotal?: number
    /** Configuración › Nota de remisión › mostrar desglose de IVA. */
    showTaxBreakdown?: boolean
  },
): RemissionView {
  // Reutiliza el modelo del ticket: mismas partidas, mismo IVA congelado, mismos
  // pagos. Así ticket y nota NUNCA pueden contradecirse.
  const base = saleToReceiptView(sale, {
    copyNumber: opts?.copyNumber,
    fallbackClient: opts?.fallbackClient,
    fallbackCashier: opts?.fallbackCashier,
    showTaxBreakdown: opts?.showTaxBreakdown,
  })

  return {
    folio: remissionFolio(sale.invoiceNumber, sale.id),
    saleRef: sale.invoiceNumber,
    issuedAt: sale.createdAt,
    copyNumber: opts?.copyNumber ?? 0,
    client: partyOf(sale.client ?? opts?.fallbackClient),
    cashierName: base.cashierName,
    items: base.items,
    subtotal: base.subtotal,
    discountTotal: base.discountTotal ?? 0,
    taxBreakdown: base.taxBreakdown ?? [],
    total: base.total,
    paidAmount: base.paidAmount,
    balance: base.balance,
    payments: base.payments,
    note: clean(sale.note),
    returnedTotal: opts?.returnedTotal ?? 0,
    amountInWords: importeConLetra(base.total),
  }
}

/** Venta de ejemplo para la vista previa de Configuración › Nota de remisión. */
export function sampleRemissionView(): RemissionView {
  const items = [
    { quantity: 2, name: 'Paracetamol 500 mg c/20 tabletas', sku: 'MED-000123', unitPrice: 38.5, subtotal: 77, discountPercent: 0, discount: 0 },
    { quantity: 1, name: 'Suero oral sabor coco 500 ml', sku: 'MED-000456', unitPrice: 29, subtotal: 26.1, discountPercent: 10, discount: 2.9 },
    { quantity: 3, name: 'Jabón neutro 100 g', sku: 'HIG-000789', unitPrice: 18, subtotal: 54, discountPercent: 0, discount: 0 },
  ]
  const total = items.reduce((a, i) => a + i.subtotal, 0)
  return {
    folio: 'NR-20261010-000123',
    saleRef: 'FAC-20261010-000123',
    issuedAt: new Date().toISOString(),
    copyNumber: 1,
    client: {
      name: 'Clínica San Rafael',
      rfc: 'CSR010101AB1',
      address: 'Av. Juárez 120, Col. Centro, 76000',
      phone: '442 123 4567',
      email: 'compras@clinicasanrafael.mx',
      isGeneral: false,
    },
    cashierName: 'Ana López',
    items,
    subtotal: 160,
    discountTotal: 2.9,
    taxBreakdown: [{ ratePercent: 16, base: 46.55, tax: 7.45 }],
    total,
    paidAmount: 100,
    balance: total - 100,
    payments: [{ method: 'Efectivo', amount: 100 }],
    note: 'Entrega en mostrador.',
    returnedTotal: 0,
    amountInWords: importeConLetra(total),
  }
}
