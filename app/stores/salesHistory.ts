import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'
import type { Sale, PaymentMethod } from '~/stores/sales'
import { useToast } from '~/composables/useToast'

/**
 * Historial de ventas, devoluciones y anulaciones.
 *
 * Vive aparte del store `sales` a proposito: aquel modela UNA venta viva en el
 * mostrador (el carrito), este modela la consulta de ventas ya cerradas. Meter
 * paginacion y filtros en el store del POS obligaria a que la caja cargue
 * estado que no le sirve y a que cada pantalla adivine cual de los dos `sale`
 * esta mirando.
 */

export interface SaleReturnItem {
  id: number
  saleReturnId: number
  saleItemId: number
  productId: number
  quantity: number
  unitPrice: string | number
  subtotal: string | number
  reason: string | null
}

export interface SaleRefund {
  id: number
  saleReturnId: number
  saleId: number
  amount: string | number
  method: PaymentMethod | null
  reference: string | null
  createdAt: string
}

export interface SaleReturn {
  id: number
  saleId: number
  processedById: number | null
  note: string | null
  createdAt: string
  items: SaleReturnItem[]
  refund: SaleRefund[]
  processedBy?: { firstName: string; lastName: string } | null
}

/** Fila del listado: sin items ni pagos, solo lo que se pinta en la tabla. */
export interface SaleListRow {
  id: number
  invoiceNumber: string | null
  total: string | number
  paidAmount: string | number
  balance: string | number
  status: Sale['status']
  flowStatus: Sale['flowStatus']
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID'
  paymentMethod: PaymentMethod
  createdAt: string
  client?: { id: number; name: string } | null
  user?: { id: number; firstName: string; lastName: string } | null
  _count?: { items: number; payments: number; saleReturn: number }
}

/** Detalle completo: lo que devuelve GET /sales/:id */
export interface SaleDetail extends Sale {
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID'
  saleReturn: SaleReturn[]
}

export interface ReturnLinePayload {
  saleItemId: number
  quantity: number
  restock: boolean
  reason?: string
}

export interface CreateReturnPayload {
  items: ReturnLinePayload[]
  refundToCustomer?: boolean
  note?: string
}

const n = (v: string | number | null | undefined): number => Number(v ?? 0)

export const useSalesHistoryStore = defineStore('salesHistory', () => {
  const sales = ref<SaleListRow[]>([])
  const currentSale = ref<SaleDetail | null>(null)
  const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })

  const isLoading = ref(false)
  const isActionLoading = ref(false)

  const toast = useToast()

  const filters = ref({
    startDate: '',
    endDate: '',
    invoiceNumber: '',
    status: '' as Sale['status'] | '',
    flowStatus: '' as Sale['flowStatus'] | '',
    paymentStatus: '' as 'PENDING' | 'PARTIAL' | 'PAID' | '',
  })

  function resetFilters() {
    filters.value = {
      startDate: '',
      endDate: '',
      invoiceNumber: '',
      status: '',
      flowStatus: '',
      paymentStatus: '',
    }
  }

  function clearCurrent() {
    currentSale.value = null
  }

  /**
   * Cuantas unidades se han devuelto ya de cada linea de la venta abierta.
   *
   * El backend valida contra "lo que queda por devolver", no contra lo vendido.
   * Si la pantalla no replicara esa cuenta, ofreceria cantidades que el servidor
   * rechaza y una validacion correcta se viviria como un error de la app.
   */
  const returnedByItem = computed<Record<number, number>>(() => {
    const acc: Record<number, number> = {}
    for (const devolucion of currentSale.value?.saleReturn ?? []) {
      for (const linea of devolucion.items) {
        acc[linea.saleItemId] = (acc[linea.saleItemId] ?? 0) + linea.quantity
      }
    }
    return acc
  })

  /** Unidades que aun se pueden devolver, por linea de venta. */
  const returnableByItem = computed<Record<number, number>>(() => {
    const acc: Record<number, number> = {}
    for (const item of currentSale.value?.items ?? []) {
      acc[item.id] = Math.max(0, item.quantity - (returnedByItem.value[item.id] ?? 0))
    }
    return acc
  })

  const hasReturnableItems = computed(() =>
    Object.values(returnableByItem.value).some((qty) => qty > 0),
  )

  /** Importe total ya reembolsado sobre la venta abierta. */
  const totalRefunded = computed(() =>
    (currentSale.value?.saleReturn ?? []).reduce(
      (acc, devolucion) =>
        acc + devolucion.refund.reduce((sum, r) => sum + n(r.amount), 0),
      0,
    ),
  )

  async function fetchSales(page = 1) {
    const { $api } = useNuxtApp()
    isLoading.value = true
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', String(pagination.value.limit))

      const f = filters.value
      if (f.startDate) params.append('startDate', f.startDate)
      if (f.endDate) params.append('endDate', f.endDate)
      if (f.invoiceNumber.trim()) params.append('invoiceNumber', f.invoiceNumber.trim())
      if (f.status) params.append('status', f.status)
      if (f.flowStatus) params.append('flowStatus', f.flowStatus)
      if (f.paymentStatus) params.append('paymentStatus', f.paymentStatus)

      const res = await $api<ApiResponse<{ sales: SaleListRow[]; pagination: typeof pagination.value }>>(
        `/sales?${params.toString()}`,
      )
      sales.value = res.data.sales ?? []
      if (res.data.pagination) pagination.value = res.data.pagination
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSaleById(id: number) {
    const { $api } = useNuxtApp()
    isLoading.value = true
    try {
      const res = await $api<ApiResponse<SaleDetail>>(`/sales/${id}`)
      currentSale.value = res.data
      return res.data
    } catch {
      currentSale.value = null // el interceptor ya notifico el error
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Anula una venta cerrada: reingresa el stock y saca el dinero de la caja.
   * El backend exige rol de gerencia cuando la venta ya esta cerrada.
   */
  async function cancelSale(id: number): Promise<boolean> {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/sales/${id}/cancel`, { method: 'POST' })
      await fetchSaleById(id)
      toast.success('Venta anulada. Stock y dinero revertidos.')
      return true
    } catch {
      return false
    } finally {
      isActionLoading.value = false
    }
  }

  async function createReturn(id: number, payload: CreateReturnPayload): Promise<boolean> {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/sales/${id}/return`, { method: 'POST', body: payload })
      await fetchSaleById(id)
      toast.success('Devolución registrada correctamente.')
      return true
    } catch {
      return false
    } finally {
      isActionLoading.value = false
    }
  }

  return {
    sales,
    currentSale,
    pagination,
    filters,
    isLoading,
    isActionLoading,
    returnedByItem,
    returnableByItem,
    hasReturnableItems,
    totalRefunded,
    fetchSales,
    fetchSaleById,
    cancelSale,
    createReturn,
    resetFilters,
    clearCurrent,
  }
})
