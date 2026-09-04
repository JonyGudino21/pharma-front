import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'

export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'LOSS' | 'INITIAL' | 'RETURN' | 'RETURN_IN' | 'RETURN_OUT'

export interface InventoryMovement {
  id: number
  productId: number
  type: MovementType
  quantity: number
  unitCost: string | number
  totalCost: string | number
  reason: string | null
  balanceAfter?: number
  batchId?: number | null
  createdAt: string
}

export interface LowStockAlert {
  id: number
  name: string
  sku: string
  stock: number
  minStock: number
}

export interface ValuationData {
  totalValue: string | number
  productCount: number
}

export interface ProductStockSnapshot {
  stock: number
  sellable: number
  expired: number
  name: string
}

export type ExpiryStatus = 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK'

export interface ExpiringBatch {
  id: number
  lotNumber: string
  expiryDate: string
  quantity: number
  cost: string | number
  daysLeft: number
  status: ExpiryStatus
  product: { id: number; name: string; sku: string; controlled: boolean }
}

export type ControlledLogEntryType = 'DISPENSE' | 'RETURN' | 'DESTRUCTION'

export interface ControlledLogEntry {
  id: number
  entryType: ControlledLogEntryType
  saleId: number | null
  productId: number
  batchId: number | null
  quantity: number
  prescriptionNo: string | null
  doctorName: string | null
  doctorLicense: string | null
  patientName: string | null
  createdAt: string
  product: { id: number; name: string; sku: string }
  batch: { id: number; lotNumber: string; expiryDate: string } | null
  soldBy: { id: number; firstName: string; lastName: string }
  sale: { id: number; invoiceNumber: string | null } | null
}

export interface InventoryPage<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const useInventoryStore = defineStore('inventory', () => {
  const valuation = ref<ValuationData | null>(null)
  const lowStockAlerts = ref<LowStockAlert[]>([])
  const currentKardex = ref<InventoryMovement[]>([])
  const expiring = ref<ExpiringBatch[]>([])
  const expiringPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const controlledLog = ref<ControlledLogEntry[]>([])
  const controlledPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })

  const isLoading = ref(false)
  const isLoadingKardex = ref(false)
  const isLoadingExpiring = ref(false)
  const isLoadingControlled = ref(false)

  async function fetchValuation() {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<ValuationData>>('/inventory/valuation')
      valuation.value = res.data
    } catch (error) {
      console.error('Error obteniendo valoración:', error)
    }
  }

  async function fetchLowStockAlerts() {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<LowStockAlert[]>>('/inventory/alerts/low-stock')
      lowStockAlerts.value = res.data
    } catch (error) {
      console.error('Error obteniendo alertas:', error)
    }
  }

  async function fetchKardex(productId: number) {
    const { $api } = useNuxtApp()
    isLoadingKardex.value = true
    try {
      const res = await $api<ApiResponse<InventoryMovement[]>>(`/inventory/kardex/${productId}`)
      currentKardex.value = res.data
    } catch (error) {
      console.error('Error obteniendo kardex:', error)
    } finally {
      isLoadingKardex.value = false
    }
  }

  async function registerAdjustment(payload: { productId: number, realQuantity: number, reason: string }) {
    const { $api } = useNuxtApp()
    await $api('/inventory/adjustment', {
      method: 'POST',
      body: payload
    })
  }

  function clearKardex() {
    currentKardex.value = []
  }

  async function fetchStock(productId: number): Promise<ProductStockSnapshot | null> {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<ProductStockSnapshot>>(`/inventory/stock/${productId}`)
      return res.data
    } catch (error) {
      console.error('Error consultando stock actual:', error)
      return null
    }
  }

  async function fetchExpiring(params: { days?: number; page?: number; limit?: number } = {}) {
    const { $api } = useNuxtApp()
    isLoadingExpiring.value = true
    try {
      const query = new URLSearchParams()
      query.set('days', String(params.days ?? 90))
      query.set('page', String(params.page ?? 1))
      query.set('limit', String(params.limit ?? 20))
      const res = await $api<ApiResponse<InventoryPage<ExpiringBatch>>>(`/inventory/batches/expiring?${query}`)
      expiring.value = res.data.data
      expiringPagination.value = res.data.pagination
    } catch (error) {
      console.error('Error obteniendo caducidades:', error)
    } finally {
      isLoadingExpiring.value = false
    }
  }

  async function fetchControlledLog(params: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
    prescriptionNo?: string
    doctorLicense?: string
    patientName?: string
    entryType?: ControlledLogEntryType | ''
  } = {}) {
    const { $api } = useNuxtApp()
    isLoadingControlled.value = true
    try {
      const query = new URLSearchParams()
      query.set('page', String(params.page ?? 1))
      query.set('limit', String(params.limit ?? 20))
      if (params.startDate) query.set('startDate', params.startDate)
      if (params.endDate) query.set('endDate', params.endDate)
      if (params.prescriptionNo?.trim()) query.set('prescriptionNo', params.prescriptionNo.trim())
      if (params.doctorLicense?.trim()) query.set('doctorLicense', params.doctorLicense.trim())
      if (params.patientName?.trim()) query.set('patientName', params.patientName.trim())
      if (params.entryType) query.set('entryType', params.entryType)
      const res = await $api<ApiResponse<InventoryPage<ControlledLogEntry>>>(`/inventory/controlled-log?${query}`)
      controlledLog.value = res.data.data
      controlledPagination.value = res.data.pagination
      return res.data
    } catch (error) {
      console.error('Error obteniendo libro de controlados:', error)
      return null
    } finally {
      isLoadingControlled.value = false
    }
  }

  async function destroyBatch(payload: { batchId: number; quantity: number; reason: string }) {
    const { $api } = useNuxtApp()
    await $api('/inventory/batches/adjustment', {
      method: 'POST',
      body: payload,
    })
  }

  return {
    valuation,
    lowStockAlerts,
    currentKardex,
    expiring,
    expiringPagination,
    controlledLog,
    controlledPagination,
    isLoading,
    isLoadingKardex,
    isLoadingExpiring,
    isLoadingControlled,
    fetchValuation,
    fetchLowStockAlerts,
    fetchKardex,
    registerAdjustment,
    clearKardex,
    fetchStock,
    fetchExpiring,
    fetchControlledLog,
    destroyBatch,
  }
})
