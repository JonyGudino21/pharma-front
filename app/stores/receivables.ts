import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ApiResponse } from '~/types/auth'
import type { Antiguedad, EstadoCobro } from '~/utils/credit-status'
import { describirFallo, type FalloPeticion } from '~/composables/useRequestState'

/**
 * COBRANZA Y CUENTAS POR PAGAR (ADR-0029). Espejo de
 * `GET /client/receivables`, `GET /purchase/payables` y
 * `GET /client/:id/credit-status`.
 */

export interface CuentaPorCobrar {
  saleId: number
  folio: string
  clientId: number
  clientName: string
  clientPhone: string | null
  saleDate: string
  ageDays: number
  dueDate: string | null
  status: EstadoCobro
  days: number
  aging: Antiguedad
  total: string
  paid: string
  balance: string
}

export interface ClientePorCobrar {
  clientId: number
  clientName: string
  clientPhone: string | null
  creditLimit: string
  creditDays: number | null
  balance: string
  overdue: string
  dueSoon: string
  salesCount: number
  overdueCount: number
  oldestSaleDate: string
  oldestAgeDays: number
  maxDaysOverdue: number
  nextDueDate: string | null
}

export interface Receivables {
  today: string
  dueSoonDays: number
  totals: {
    balance: string
    overdue: string
    dueSoon: string
    current: string
    noDate: string
    salesCount: number
    clientsCount: number
    overdueClients: number
  }
  aging: { bucket: Antiguedad; amount: string; count: number }[]
  clients: ClientePorCobrar[]
  sales: CuentaPorCobrar[]
}

export interface CuentaPorPagar {
  purchaseId: number
  folio: string
  supplierId: number
  supplierName: string
  purchaseDate: string
  dueDate: string | null
  status: EstadoCobro
  days: number
  total: string
  balance: string
}

export interface Payables {
  today: string
  dueSoonDays: number
  totals: {
    balance: string
    overdue: string
    dueSoon: string
    current: string
    noDate: string
    count: number
    suppliersCount: number
  }
  purchases: CuentaPorPagar[]
}

export interface ClientCreditStatus {
  clientId: number
  creditDays: number | null
  /** Días que se proponen en caja (0 = sin sugerencia). */
  suggestedDays: number
  overdue: string
  overdueCount: number
  maxDaysOverdue: number
  oldestOverdueFolio: string | null
  oldestOverdueDueDate: string | null
  warnAtPos: boolean
  blocksCredit: boolean
}

export const useReceivablesStore = defineStore('receivables', () => {
  const receivables = ref<Receivables | null>(null)
  const payables = ref<Payables | null>(null)
  const isLoading = ref(false)
  const loadError = ref<FalloPeticion | null>(null)

  async function fetchReceivables(): Promise<Receivables | null> {
    const { $api } = useNuxtApp()
    isLoading.value = true
    loadError.value = null
    try {
      const res = await $api<ApiResponse<Receivables>>('/client/receivables')
      receivables.value = res.data
      return res.data
    } catch (error) {
      loadError.value = describirFallo(error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /** Cuentas por pagar (para el panel). Sin permiso o sin red: null, sin ruido. */
  async function fetchPayables(): Promise<Payables | null> {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<Payables>>('/purchase/payables')
      payables.value = res.data
      return res.data
    } catch {
      return null
    }
  }

  /** Estado de crédito del cliente para la caja. Errores en silencio: no frena la venta. */
  async function fetchCreditStatus(clientId: number): Promise<ClientCreditStatus | null> {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<ClientCreditStatus>>(`/client/${clientId}/credit-status`)
      return res.data
    } catch {
      return null
    }
  }

  /** Cambia o quita (null) la fecha de pago de una venta a crédito. */
  async function setDueDate(saleId: number, dueDate: string | null): Promise<boolean> {
    const { $api } = useNuxtApp()
    try {
      await $api(`/client/receivables/${saleId}/due-date`, { method: 'PATCH', body: { dueDate } })
      return true
    } catch {
      return false
    }
  }

  return { receivables, payables, isLoading, loadError, fetchReceivables, fetchPayables, fetchCreditStatus, setDueDate }
})
