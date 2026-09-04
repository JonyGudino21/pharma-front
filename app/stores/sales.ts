import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'
import type { Client } from '~/stores/client'
import { useProductStore, type Product } from '~/stores/product'
import { useInventoryStore } from '~/stores/inventory'
import { useToast } from '~/composables/useToast'

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER'
export type SaleFlowStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED'
export type SaleStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'

export interface SaleItem {
  id: number
  productId: number
  quantity: number
  price: string | number
  discount: string | number
  subtotal: string | number
  costAtSale: string | number
  product?: { id: number; name: string; sku: string; controlled?: boolean }
}

export interface SalePayment {
  id: number
  method: PaymentMethod
  amount: string | number
  references: string | null
  createdAt: string
}

export interface Sale {
  id: number
  clientId: number | null
  userId: number | null
  total: string | number
  subtotal: string | number
  paidAmount: string | number
  balance: string | number
  flowStatus: SaleFlowStatus
  status: SaleStatus
  paymentMethod: PaymentMethod
  invoiceNumber: string | null
  note: string | null
  createdAt: string
  items: SaleItem[]
  payments?: SalePayment[]
  client?: { id: number; name: string; rfc: string | null; address: string | null; email: string | null; phone: string | null } | null
  user?: { firstName: string; lastName: string }
}

export interface ControlledPrescription {
  prescriptionNo: string
  doctorName: string
  doctorLicense: string
  patientName: string
}

const n = (v: string | number | null | undefined): number => Number(v ?? 0)

export const useSalesStore = defineStore('sales', () => {
  // --- Estado del carrito / venta viva ---
  const sale = ref<Sale | null>(null)          // Venta DRAFT viva en el servidor (fuente de verdad)
  const selectedClient = ref<Client | null>(null)
  const lastCompletedSale = ref<Sale | null>(null) // Para el ticket tras cerrar
  const prescription = ref<ControlledPrescription | null>(null)

  // --- Banderas ---
  const isBootstrapping = ref(false)  // creando/refrescando la venta
  const isMutating = ref(false)       // agregando/quitando/cambiando cantidad
  const isCompleting = ref(false)     // cerrando la venta

  const toast = useToast()

  // --- Getters ---
  const items = computed<SaleItem[]>(() => sale.value?.items ?? [])
  const itemCount = computed(() => items.value.reduce((acc, i) => acc + i.quantity, 0))
  const total = computed(() => n(sale.value?.total))
  const balance = computed(() => n(sale.value?.balance))
  const paidAmount = computed(() => n(sale.value?.paidAmount))
  const isEmpty = computed(() => !sale.value || items.value.length === 0)
  const hasDraft = computed(() => !!sale.value && sale.value.flowStatus === 'DRAFT')
  // El cliente se puede cambiar en cualquier momento mientras la venta siga en borrador:
  // el backend re-precia los items con los precios especiales del cliente (PATCH set-client).
  const canChangeClient = computed(() => !sale.value || sale.value.flowStatus === 'DRAFT')
  const hasControlledItems = computed(() =>
    items.value.some((i) => i.product?.controlled === true),
  )

  // --- Helpers de API ---
  async function refreshSale() {
    if (!sale.value) return
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<Sale>>(`/sales/${sale.value.id}`)
    sale.value = res.data
  }

  /**
   * Asigna el cliente. Si ya existe una venta viva, lo persiste en el backend
   * (PATCH set-client), que RE-PRECIA los items con los precios especiales del cliente.
   */
  async function setClient(client: Client | null) {
    if (!canChangeClient.value) {
      toast.warning('La venta ya no es editable.')
      return
    }

    // Sin venta viva: solo memorizamos la elección; se enviará al crear la venta.
    if (!sale.value) {
      selectedClient.value = client
      return
    }

    const { $api } = useNuxtApp()
    const previous = selectedClient.value
    isMutating.value = true
    try {
      await $api(`/sales/${sale.value.id}/set-client`, {
        method: 'PATCH',
        body: { clientId: client?.id ?? null },
      })
      selectedClient.value = client
      await refreshSale() // trae los items ya re-preciados y el nuevo total
      toast.info(client ? `Precios actualizados para ${client.name}` : 'Precios de público general aplicados')
    } catch {
      selectedClient.value = previous // el interceptor ya notificó el error
    } finally {
      isMutating.value = false
    }
  }

  /**
   * Escanea/agrega un producto por código de barras.
   * Crea la venta DRAFT en el primer producto (con el cliente seleccionado, si hay).
   */
  async function scanBarcode(barcode: string, quantity = 1): Promise<boolean> {
    const code = barcode.trim()
    if (!code) return false
    const productStore = useProductStore()
    const product = await productStore.fetchByBarcode(code)
    if (!product) {
      toast.error(`No se encontró un producto con el código ${code}`)
      return false
    }
    return addProduct(product, quantity > 0 ? quantity : 1)
  }

  /**
   * Agrega un producto (objeto ya resuelto) a la venta viva.
   */
  async function addProduct(product: Product, quantity = 1): Promise<boolean> {
    const { $api } = useNuxtApp()
    const inventoryStore = useInventoryStore()
    const live = await inventoryStore.fetchStock(product.id)
    const available = live?.sellable ?? product.stock
    if (available <= 0) {
      toast.warning(
        live && live.expired > 0
          ? `"${product.name}" no tiene lotes vigentes (${live.expired} uds. caducadas).`
          : `"${product.name}" no tiene existencias disponibles.`,
      )
      return false
    }
    try {
      if (!sale.value) {
        isBootstrapping.value = true
        const res = await $api<ApiResponse<Sale>>('/sales', {
          method: 'POST',
          body: {
            clientId: selectedClient.value?.id,
            items: [{ productId: product.id, quantity }],
          },
        })
        sale.value = res.data
        await refreshSale() // enriquece con producto/cliente
      } else {
        isMutating.value = true
        await $api(`/sales/${sale.value.id}/add-product`, {
          method: 'POST',
          body: { productId: product.id, quantity },
        })
        await refreshSale()
      }
      return true
    } catch {
      return false // el interceptor ya muestra el toast del error del backend
    } finally {
      isBootstrapping.value = false
      isMutating.value = false
    }
  }

  async function removeItem(itemId: number) {
    if (!sale.value) return
    const { $api } = useNuxtApp()
    isMutating.value = true
    try {
      await $api(`/sales/${sale.value.id}/remove-product/${itemId}`, { method: 'POST' })
      await refreshSale()
    } finally {
      isMutating.value = false
    }
  }

  function incrementItem(item: SaleItem) {
    return setQuantity(item, item.quantity + 1)
  }

  /**
   * Fija la cantidad exacta de una línea (PATCH update-item).
   * Conserva el precio ya aplicado en la línea (no re-precia) y valida stock en el backend.
   * Si la cantidad llega a 0, se elimina la línea.
   */
  async function setQuantity(item: SaleItem, quantity: number) {
    if (!sale.value) return
    if (quantity <= 0) return removeItem(item.id)

    const { $api } = useNuxtApp()
    isMutating.value = true
    try {
      await $api(`/sales/${sale.value.id}/update-item/${item.id}`, {
        method: 'PATCH',
        body: { quantity },
      })
      await refreshSale()
    } finally {
      isMutating.value = false
    }
  }

  function decrementItem(item: SaleItem) {
    return setQuantity(item, item.quantity - 1)
  }

  /**
   * Registra un pago sobre la venta viva (efectivo requiere caja abierta en el backend).
   * Devuelve true si el pago se registró.
   */
  async function registerPayment(payload: { method: PaymentMethod; amount: number; references?: string }): Promise<boolean> {
    if (!sale.value) return false
    const { $api } = useNuxtApp()
    try {
      await $api(`/sales/${sale.value.id}/add-payment`, { method: 'POST', body: payload })
      await refreshSale()
      return true
    } catch {
      return false
    }
  }

  /**
   * Cierra la venta (descuenta stock oficial). Guarda el ticket en lastCompletedSale y limpia el carrito.
   * Devuelve la venta cerrada (enriquecida) o null.
   */
  async function completeSale(): Promise<Sale | null> {
    if (!sale.value) return null
    const { $api } = useNuxtApp()
    isCompleting.value = true
    try {
      await $api(`/sales/${sale.value.id}/complete`, {
        method: 'POST',
        body: prescription.value ? { prescription: prescription.value } : {},
      })
      // Reconsultamos la venta enriquecida para el ticket antes de limpiar
      const res = await $api<ApiResponse<Sale>>(`/sales/${sale.value.id}`)
      lastCompletedSale.value = res.data
      toast.success(`Venta ${res.data.invoiceNumber ?? '#' + res.data.id} completada`)
      reset()
      return lastCompletedSale.value
    } catch {
      return null
    } finally {
      isCompleting.value = false
    }
  }

  /**
   * Descarta la venta viva (marca CANCELLED en el backend) y limpia el carrito.
   */
  async function discardSale() {
    const { $api } = useNuxtApp()
    if (sale.value) {
      try {
        await $api(`/sales/${sale.value.id}/cancel`, { method: 'POST' })
      } catch {
        // si falla la cancelación, igual limpiamos el estado local
      }
    }
    reset()
  }

  function setPrescription(data: ControlledPrescription | null) {
    prescription.value = data
  }

  function reset() {
    sale.value = null
    selectedClient.value = null
    prescription.value = null
  }

  return {
    // estado
    sale, selectedClient, lastCompletedSale, prescription,
    isBootstrapping, isMutating, isCompleting,
    // getters
    items, itemCount, total, balance, paidAmount, isEmpty, hasDraft, canChangeClient, hasControlledItems,
    // acciones
    refreshSale, setClient, scanBarcode, addProduct, removeItem,
    incrementItem, decrementItem, setQuantity, registerPayment,
    completeSale, discardSale, reset, setPrescription,
  }
})
