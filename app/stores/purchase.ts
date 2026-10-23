import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { PaginatedData, ApiResponse } from '~/types/auth'
import type { Supplier } from '~/stores/supplier'
import type { Product } from '~/stores/product'
import { describirFallo, type FalloPeticion } from '~/composables/useRequestState'

export type PurchaseStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
export type PurchaseDeliveryStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'

/**
 * Vocabulario ÚNICO de compras para lista y detalle. Antes la lista decía
 * «En Almacén / Por Recibir» y el detalle «REGISTRADO / EN TRÁNSITO», y el
 * detalle mostraba los códigos crudos (PENDING, CASH…).
 */
export const PURCHASE_STATUS_META: Record<PurchaseStatus, { label: string; icon: string; tone: string }> = {
  PAID: { label: 'Pagada', icon: 'ph:check-circle-bold', tone: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400' },
  PARTIAL: { label: 'Pago parcial', icon: 'ph:clock-countdown-bold', tone: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400' },
  PENDING: { label: 'Sin pagar', icon: 'ph:warning-circle-bold', tone: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400' },
  CANCELLED: { label: 'Anulada', icon: 'ph:prohibit-bold', tone: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
}

export const DELIVERY_STATUS_META: Record<PurchaseDeliveryStatus, { label: string; icon: string; tone: string }> = {
  RECEIVED: { label: 'En almacén', icon: 'ph:package-bold', tone: 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/30' },
  PENDING: { label: 'Por recibir', icon: 'ph:truck-bold', tone: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800/30' },
  CANCELLED: { label: 'Anulada', icon: 'ph:prohibit-bold', tone: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  CREDIT: 'Crédito',
}

export const purchaseStatusLabel = (s: PurchaseStatus) => PURCHASE_STATUS_META[s]?.label ?? s
export const deliveryStatusLabel = (s: PurchaseDeliveryStatus) => DELIVERY_STATUS_META[s]?.label ?? s
export const paymentMethodLabel = (m: PaymentMethod) => PAYMENT_METHOD_LABELS[m] ?? m

/**
 * Lote y caducidad de una partida: van juntos o ninguno (regla del servidor:
 * «El número de lote y la fecha de caducidad deben ir juntos.»). Devuelve el
 * mensaje para mostrar en línea, o '' si está bien.
 */
export function lotPairError(lotNumber: string | null | undefined, expiryDate: string | null | undefined): string {
  const lot = (lotNumber ?? '').trim()
  const exp = (expiryDate ?? '').trim()
  if (lot && !exp) return 'Falta la caducidad: el lote y la caducidad van juntos (o deja ambos vacíos).'
  if (!lot && exp) return 'Falta el número de lote: el lote y la caducidad van juntos (o deja ambos vacíos).'
  return ''
}

/**
 * Costo unitario mínimo de una partida. El servidor exige costo > 0
 * (CreatePurchaseItemDto / UpdateItemDto: @IsPositive); con centavos, 0.01.
 */
export const MIN_ITEM_COST = 0.01

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
  /** Fecha límite para pagarle al proveedor (ADR-0029). */
  dueDate?: string | null
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

/** Respuesta de GET /purchase/suggest-folio. */
export interface FolioSugerido {
  folio: string
  supplierCode: string
  /** Días de crédito del proveedor (0 = de contado). */
  creditDays: number
  /** Hoy + días del proveedor (AAAA-MM-DD), o null. */
  suggestedDueDate: string | null
}

export interface CreatePurchasePayload {
  supplierId: number
  /** Vacío/ausente: el servidor asigna el folio sugerido (FAC-001-ALV-20261023). */
  invoiceNumber?: string
  /** Fecha límite de pago (AAAA-MM-DD); null = sin fecha; ausente = la de los días del proveedor. */
  dueDate?: string | null
  items: CreatePurchaseItemPayload[]
  payments?: CreatePaymentPayload[]
}

export const usePurchaseStore = defineStore('purchase', () => {
  const purchases = ref<Purchase[]>([])
  const currentPurchase = ref<Purchase | null>(null)
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const isLoading = ref(false)
  const isActionLoading = ref(false)
  // Fallo de carga, distinto de "no hay compras". Ver useRequestState.
  const listError = ref<FalloPeticion | null>(null)
  const detailError = ref<FalloPeticion | null>(null)

  const filters = ref({
    supplierId: '' as string | number,
    status: '' as PurchaseStatus | ''
  })

  // 1. Listar Compras
  async function fetchPurchases(page = 1) {
    const { $api } = useNuxtApp()
    isLoading.value = true
    listError.value = null

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
      purchases.value = []
      listError.value = describirFallo(error)
    } finally {
      isLoading.value = false
    }
  }

  // 2. Obtener Detalle de Compra
  async function fetchPurchaseById(id: number) {
    const { $api } = useNuxtApp()
    isLoading.value = true
    detailError.value = null
    try {
      const res = await $api<ApiResponse<Purchase>>(`/purchase/${id}`)
      currentPurchase.value = res.data
      return res.data
    } catch (error) {
      console.error('Error fetching purchase:', error)
      // Antes el detalle se quedaba girando para siempre si la consulta fallaba.
      detailError.value = describirFallo(error)
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

  /**
   * Folio sugerido para una compra del proveedor (FAC-001-ALV-20261023), para
   * cuando el proveedor no entrega factura o ticket con folio. No lo reserva.
   * @returns null si no se pudo obtener (la compra se guarda igual).
   */
  async function suggestFolio(supplierId: number): Promise<FolioSugerido | null> {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<FolioSugerido>>('/purchase/suggest-folio', {
        query: { supplierId },
      })
      return res.data
    } catch {
      return null
    }
  }

  // 4. Actualizar Cabecera
  async function updatePurchase(id: number, payload: { supplierId?: number, invoiceNumber?: string, dueDate?: string | null }) {
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

  async function updateItem(purchaseId: number, itemId: number, payload: { quantity: number, cost: number, lotNumber?: string | null, expiryDate?: string | null }) {
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
    listError,
    detailError,
    filters,
    fetchPurchases,
    fetchPurchaseById,
    createPurchase,
    suggestFolio,
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