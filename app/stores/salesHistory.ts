import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'
import type { Sale, PaymentMethod } from '~/stores/sales'
import type { SaleReceiptPrint } from '~/types/receipt'
import { useToast } from '~/composables/useToast'
import { useRequestState } from '~/composables/useRequestState'

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
  receiptPrints?: SaleReceiptPrint[]
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
  // Cada recurso lleva su propio estado (cargando / fallo / vacío). El listado y
  // el detalle son consultas independientes: compartir un `isLoading` hacía que
  // abrir el detalle pusiera la tabla en modo carga, y que un fallo en uno se
  // presentara como falta de datos en el otro.
  const listado = useRequestState<SaleListRow[]>([])
  const detalle = useRequestState<SaleDetail | null>(null)

  // Nombres estables para las pantallas ya escritas: `sales` y `currentSale`
  // siguen siendo los mismos refs que antes, ahora respaldados por el estado
  // de petición. Así el cambio no obliga a reescribir 6 vistas a la vez.
  const sales = listado.datos
  const currentSale = detalle.datos
  const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })

  // `isLoading` se mantiene como alias para no romper vistas antiguas, pero lo
  // nuevo debe leer `listLoading`/`listError` y `detailLoading`/`detailError`,
  // que sí distinguen "no hay datos" de "no se pudieron cargar".
  const isLoading = computed(() => listado.cargando.value || detalle.cargando.value)
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
    // reset() y no `= null`: además del dato limpia el estado y el fallo. Con
    // sólo poner null, al volver a abrir el detalle la pantalla arrancaba
    // mostrando el error de la consulta anterior.
    detalle.reset()
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

    // El estado de fallo se lleva aparte de `isLoading` a propósito.
    // Antes esta función no tenía `catch`: al fallar, `isLoading` bajaba en el
    // `finally`, la lista se quedaba como estaba y la pantalla pintaba
    // "No hay ventas registradas". El gerente concluía que no se había vendido
    // nada ese día cuando lo que pasaba era que el servidor no respondía.
    return listado.run(async () => {
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
      if (res.data.pagination) pagination.value = res.data.pagination
      return res.data.sales ?? []
    })
  }

  async function fetchSaleById(id: number) {
    const { $api } = useNuxtApp()

    // Igual que arriba: `currentSale = null` ante un fallo hacía que la pantalla
    // de detalle mostrara "venta no encontrada" para una venta que existe.
    return detalle.run(async () => {
      const res = await $api<ApiResponse<SaleDetail>>(`/sales/${id}`)
      return res.data
    })
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

    // ─────────────────────────────────────────────────────────────────
    // Estado por recurso: lo que las pantallas deben consumir para poder
    // distinguir "no hay ventas" de "no se pudieron cargar las ventas".
    //
    // PLANOS Y EN LA RAÍZ, no agrupados en un objeto `listState`. Pinia sólo
    // desenvuelve los refs que devuelve un setup store en el PRIMER nivel. Un
    // `listState: { cargando }` entregaría el ComputedRef sin desenvolver, y en
    // una plantilla `v-if="store.listState.cargando"` evalúa el objeto Ref:
    // SIEMPRE verdadero. La pantalla se quedaría cargando para siempre y sin
    // ningún error que lo delate.
    // ─────────────────────────────────────────────────────────────────
    listLoading: listado.cargando,
    listError: listado.fallo,
    listEmpty: listado.vacio,
    retryList: listado.reintentar,

    detailLoading: detalle.cargando,
    detailError: detalle.fallo,
    detailEmpty: detalle.vacio,
    retryDetail: detalle.reintentar,
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
