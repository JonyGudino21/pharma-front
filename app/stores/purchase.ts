import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { PaginatedData, ApiResponse } from '~/types/auth'
import type { Supplier } from '~/stores/supplier'
import type { Product } from '~/stores/product'

export type PurchaseStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
export type PurchaseDeliveryStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'

export interface PurchaseItem {
  id: number
  purchaseId: number
  productId: number
  quantity: number
  cost: string | number
  subtotal: string | number
  lotNumber?: string | null
  expiryDate?: string | null
  product: Product
}

export interface PurchasePayment {
  id: number
  purchaseId: number
  method: PaymentMethod
  amount: string | number
  references: string | null
  createdAt: string
}

export interface Purchase {
  id: number
  supplierId: number
  invoiceNumber: string
  total: string | number
  subtotal: string | number
  paidAmount: string | number
  balance: string | number
  status: PurchaseStatus
  deliveryStatus: PurchaseDeliveryStatus
  createdAt: string
  updatedAt: string
  supplier?: Supplier
  items?: PurchaseItem[]
  payments?: PurchasePayment[]
}

// Payloads para Creación
export interface CreatePurchaseItemPayload {
  productId: number
  quantity: number
  cost: number
  lotNumber?: string
  expiryDate?: string
}

export interface CreatePaymentPayload {
  method: PaymentMethod
  amount: number
  references?: string
}

export interface CreatePurchasePayload {
  supplierId: number
  invoiceNumber: string
  items: CreatePurchaseItemPayload[]
  payments?: CreatePaymentPayload[]
}

export const usePurchaseStore = defineStore('purchase', () => {
  const purchases = ref<Purchase[]>([])
  const currentPurchase = ref<Purchase | null>(null)
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const isLoading = ref(false)
  const isActionLoading = ref(false)

  const filters = ref({
    supplierId: '' as string | number,
    status: '' as PurchaseStatus | ''
  })

  // 1. Listar Compras
  async function fetchPurchases(page = 1) {
    const { $api } = useNuxtApp()
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', pagination.value.limit.toString())
      
      if (filters.value.supplierId) params.append('supplierId', filters.value.supplierId.toString())
      if (filters.value.status) params.append('status', filters.value.status)

      const res = await $api<ApiResponse<PaginatedData<Purchase>>>(`/purchase?${params.toString()}`)
      purchases.value = res.data.purchases || res.data.data || []
      if (res.data.pagination) pagination.value = res.data.pagination
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 2. Obtener Detalle de Compra
  async function fetchPurchaseById(id: number) {
    const { $api } = useNuxtApp()
    isLoading.value = true
    try {
      const res = await $api<ApiResponse<Purchase>>(`/purchase/${id}`)
      currentPurchase.value = res.data
      return res.data
    } catch (error) {
      console.error('Error fetching purchase:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 3. Crear Compra (Draft)
  async function createPurchase(payload: CreatePurchasePayload) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      const res = await $api<ApiResponse<Purchase>>('/purchase', { method: 'POST', body: payload })
      return res.data
    } finally {
      isActionLoading.value = false
    }
  }

  // 4. Actualizar Cabecera
  async function updatePurchase(id: number, payload: { supplierId?: number, invoiceNumber?: string }) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/purchase/${id}`, { method: 'PATCH', body: payload })
      await fetchPurchaseById(id)
    } finally {
      isActionLoading.value = false
    }
  }

  // 5. Cancelar Compra
  async function cancelPurchase(id: number) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/purchase/${id}/cancel`, { method: 'POST' })
      await fetchPurchaseById(id)
    } finally {
      isActionLoading.value = false
    }
  }

  // 6. Recibir Mercancía (KARDEX)
  async function receivePurchase(id: number) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/purchase/${id}/receive`, { method: 'POST' })
      await fetchPurchaseById(id)
    } finally {
      isActionLoading.value = false
    }
  }

  // 7, 8, 9. Gestión de Items
  async function addItem(purchaseId: number, payload: CreatePurchaseItemPayload) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/purchase/${purchaseId}/add-product`, { method: 'POST', body: payload })
      await fetchPurchaseById(purchaseId)
    } finally {
      isActionLoading.value = false
    }
  }

  async function updateItem(purchaseId: number, itemId: number, payload: { quantity: number, cost: number, lotNumber?: string, expiryDate?: string }) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/purchase/${purchaseId}/update-product/${itemId}`, { method: 'PATCH', body: payload })
      await fetchPurchaseById(purchaseId)
    } finally {
      isActionLoading.value = false
    }
  }

  async function removeItem(purchaseId: number, itemId: number) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/purchase/${purchaseId}/remove-product/${itemId}`, { method: 'DELETE' })
      await fetchPurchaseById(purchaseId)
    } finally {
      isActionLoading.value = false
    }
  }

  // 10, 11. Gestión de Pagos
  async function addPayment(purchaseId: number, payload: CreatePaymentPayload) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/purchase/${purchaseId}/add-payment`, { method: 'POST', body: payload })
      await fetchPurchaseById(purchaseId)
    } finally {
      isActionLoading.value = false
    }
  }

  async function removePayment(purchaseId: number, paymentId: number) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/purchase/${purchaseId}/remove-payment/${paymentId}`, { method: 'DELETE' })
      await fetchPurchaseById(purchaseId)
    } finally {
      isActionLoading.value = false
    }
  }

  return {
    purchases,
    currentPurchase,
    pagination,
    isLoading,
    isActionLoading,
    filters,
    fetchPurchases,
    fetchPurchaseById,
    createPurchase,
    updatePurchase,
    cancelPurchase,
    receivePurchase,
    addItem,
    updateItem,
    removeItem,
    addPayment,
    removePayment
  }
})