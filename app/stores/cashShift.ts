import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { PaginatedData, ApiResponse } from '~/types/auth'

export type ShiftStatus = 'OPEN' | 'CLOSED' | 'AUDIT_REQUIRED'
export type CashTransactionType = 'MANUAL_ADD' | 'MANUAL_WITHDRAW' | 'EXPENSE' | 'REFUND_OUT' | 'REFUND_IN' | 'PURCHASE_PAYMENT' | 'SALE_INCOME' | 'CREDIT_PAYMENT'

export interface CashTransaction {
  id: number
  shiftId: number
  type: CashTransactionType
  amount: string | number
  reason: string
  referenceId: number | null
  relatedTable: string | null
  createdAt: string
}

export interface CashShift {
  id: number
  userId: number
  initialAmount: string | number
  expectedAmount: string | number | null
  realAmount: string | number | null
  difference: string | number | null
  status: ShiftStatus
  notes: string | null
  openedAt: string
  closedAt: string | null
  // Relaciones (para cuando se consulta findOne)
  user?: { id: number, userName: string, firstName: string, lastName: string }
  transactions?: CashTransaction[]
  sales?: any[]
}

export interface CloseShiftSummary {
  initial: string | number
  salesCash: string | number
  manualIngress: string | number
  withdrawals: string | number
  expected: string | number
  real: string | number
  difference: string | number
  status: ShiftStatus
}

export const useCashShiftStore = defineStore('cashShift', () => {
  const currentShift = ref<CashShift | null>(null)
  const shifts = ref<CashShift[]>([])
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const isLoading = ref(false)
  const isActionLoading = ref(false)

  const filters = ref({
    status: '' as ShiftStatus | '',
    startDate: '',
    endDate: ''
  })

  // 1. Obtener mi turno actual
  async function fetchCurrentShift() {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<CashShift | null>>('/cash-shift/current-shift')
      currentShift.value = res.data
      return res.data
    } catch (error) {
      currentShift.value = null
      return null
    }
  }

  // 2. Abrir Turno
  async function openShift(payload: { initialAmount: number, notes?: string }) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api('/cash-shift/open', { method: 'POST', body: payload })
      await fetchCurrentShift()
    } finally {
      isActionLoading.value = false
    }
  }

  // 3. Cerrar Turno (Arqueo)
  async function closeShift(payload: { realAmount: number, notes?: string }): Promise<CloseShiftSummary | null> {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      const res = await $api<ApiResponse<{ success: boolean, summary: CloseShiftSummary }>>('/cash-shift/close', { 
        method: 'POST', body: payload 
      })
      await fetchCurrentShift() // Limpia el currentShift porque ya se cerró
      return res.data.summary
    } catch (error) {
      console.error("Error al cerrar caja")
      return null
    } finally {
      isActionLoading.value = false
    }
  }

  // 4. Registrar Operación (MANAGER)
  async function registerOperation(payload: { type: CashTransactionType, amount: number, reason: string }) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api('/cash-shift/register-operation', { method: 'POST', body: payload })
      // No afecta el initialAmount, por lo que no es estrictamente necesario recargar el currentShift, 
      // pero podríamos hacerlo si el backend devolviera el balance actual vivo.
    } finally {
      isActionLoading.value = false
    }
  }

  // 5. Historial (GET /cash-shift)
  async function fetchShifts(page = 1) {
    const { $api } = useNuxtApp()
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', pagination.value.limit.toString())
      
      if (filters.value.status) params.append('status', filters.value.status)
      if (filters.value.startDate) params.append('startDate', filters.value.startDate)
      if (filters.value.endDate) params.append('endDate', filters.value.endDate)

      const res = await $api<ApiResponse<PaginatedData<CashShift>>>(`/cash-shift?${params.toString()}`)
      
      shifts.value = res.data.shifts || res.data.data || [] 
      if (res.data.pagination) pagination.value = res.data.pagination
    } catch (error) {
      console.error('Error fetching shifts:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 6. Obtener detalle de un turno (AUDITORÍA)
  async function fetchShiftById(id: number) {
    const { $api } = useNuxtApp()
    isLoading.value = true
    try {
      const res = await $api<ApiResponse<CashShift>>(`/cash-shift/${id}`)
      return res.data
    } catch (error) {
      console.error('Error fetching shift details:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentShift,
    shifts,
    pagination,
    isLoading,
    isActionLoading,
    filters,
    fetchCurrentShift,
    openShift,
    closeShift,
    registerOperation,
    fetchShifts,
    fetchShiftById
  }
})