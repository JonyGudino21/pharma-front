import type { Sale, SaleItem } from '~/stores/sales'
import type { Client } from '~/stores/client'
import type { User } from '~/types/auth'
import {
  paymentMethodLabel,
  type ReceiptLine,
  type ReceiptSaleView,
  type ReceiptTaxRow,
} from '~/types/receipt'

const n = (v: string | number | null | undefined) => Number(v ?? 0)
const cents = (v: number) => Math.round(v * 100) / 100

function toLine(item: SaleItem): ReceiptLine {
  return {
    quantity: item.quantity,
    name: item.product?.name ?? `Producto #${item.productId}`,
    sku: item.product?.sku,
    unitPrice: n(item.price),
    subtotal: n(item.subtotal),
    discountPercent: n(item.discountPercent),
    discount: n(item.discount),
  }
}

/**
 * IVA contenido por tasa, sumando lo que el servidor CONGELÓ en cada línea
 * (taxRate, taxAmount). No se recalcula aquí: el ticket debe decir lo mismo
 * que la venta guardada.
 */
export function taxBreakdownOf(items: SaleItem[]): ReceiptTaxRow[] {
  const porTasa = new Map<number, { total: number; tax: number }>()
  for (const i of items) {
    const rate = Math.round(n(i.taxRate) * 10000) / 100 // 0.16 → 16
    if (rate <= 0) continue
    const row = porTasa.get(rate) ?? { total: 0, tax: 0 }
    row.total += n(i.subtotal)
    row.tax += n(i.taxAmount)
    porTasa.set(rate, row)
  }
  return [...porTasa.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([ratePercent, r]) => ({ ratePercent, tax: cents(r.tax), base: cents(r.total - r.tax) }))
}

function cashierName(user?: { firstName?: string; lastName?: string } | User | null) {
  if (!user) return null
  const first = 'firstName' in user ? user.firstName : ''
  const last = 'lastName' in user ? user.lastName : ''
  const full = `${first} ${last}`.trim()
  return full || null
}

export function saleToReceiptView(
  sale: Sale,
  opts?: {
    copyNumber?: number
    fallbackClient?: Client | null
    fallbackCashier?: User | null
    /** Configuración › Impuestos › mostrar desglose. Por defecto sí. */
    showTaxBreakdown?: boolean
  },
): ReceiptSaleView {
  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    createdAt: sale.createdAt,
    flowStatus: sale.flowStatus,
    items: (sale.items ?? []).map(toLine),
    subtotal: n(sale.subtotal),
    discountTotal: n(sale.discountTotal),
    taxBreakdown: opts?.showTaxBreakdown === false ? [] : taxBreakdownOf(sale.items ?? []),
    total: n(sale.total),
    paidAmount: n(sale.paidAmount),
    balance: n(sale.balance),
    payments: (sale.payments ?? []).map((p) => ({
      method: paymentMethodLabel(p.method),
      amount: n(p.amount),
    })),
    clientName: sale.client?.name ?? opts?.fallbackClient?.name ?? 'Público General',
    clientRfc: sale.client?.rfc ?? opts?.fallbackClient?.rfc ?? null,
    cashierName: cashierName(sale.user) ?? cashierName(opts?.fallbackCashier),
    note: sale.note,
    copyNumber: opts?.copyNumber ?? 0,
  }
}

export function cartToReceiptView(input: {
  sale?: Sale | null
  items: SaleItem[]
  subtotal: number
  total: number
  client?: Client | null
  cashier?: User | null
  showTaxBreakdown?: boolean
}): ReceiptSaleView {
  if (input.sale && input.sale.flowStatus !== 'DRAFT') {
    return saleToReceiptView(input.sale, {
      fallbackClient: input.client,
      fallbackCashier: input.cashier,
      showTaxBreakdown: input.showTaxBreakdown,
    })
  }

  return {
    id: input.sale?.id ?? null,
    invoiceNumber: input.sale?.invoiceNumber ?? null,
    createdAt: input.sale?.createdAt ?? new Date().toISOString(),
    flowStatus: 'DRAFT',
    items: input.items.map(toLine),
    subtotal: input.subtotal,
    discountTotal: n(input.sale?.discountTotal),
    taxBreakdown: input.showTaxBreakdown === false ? [] : taxBreakdownOf(input.items),
    total: input.total,
    paidAmount: n(input.sale?.paidAmount),
    balance: n(input.sale?.balance ?? input.total),
    payments: (input.sale?.payments ?? []).map((p) => ({
      method: paymentMethodLabel(p.method),
      amount: n(p.amount),
    })),
    clientName: input.client?.name ?? input.sale?.client?.name ?? 'Público General',
    clientRfc: input.client?.rfc ?? input.sale?.client?.rfc ?? null,
    cashierName: cashierName(input.sale?.user) ?? cashierName(input.cashier),
    note: input.sale?.note ?? null,
    copyNumber: 0,
  }
}

export function formatTicketDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
