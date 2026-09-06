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
  // CONTADOR, no booleano: con el escáner disparando ráfagas hay varias
  // operaciones en vuelo a la vez. Con un booleano, la primera que terminaba
  // ponía `false` y liberaba la UI mientras las demás seguían corriendo.
  const mutationsInFlight = ref(0)
  const isBootstrapping = ref(false)  // creando/refrescando la venta
  const isCompleting = ref(false)     // cerrando la venta
  const isMutating = computed(() => mutationsInFlight.value > 0)

  /** Envuelve una mutación llevando la cuenta de operaciones en vuelo. */
  async function withMutation<T>(fn: () => Promise<T>): Promise<T> {
    mutationsInFlight.value += 1
    try {
      return await fn()
    } finally {
      mutationsInFlight.value -= 1
    }
  }

  // TOKEN DE SECUENCIA: descarta respuestas obsoletas de refreshSale.
  // Sin esto, la respuesta de un escaneo anterior podía llegar DESPUÉS de la
  // de uno posterior y sobrescribir el estado con un total viejo: el modal de
  // cobro tomaba ese total y se cerraba la venta cobrando de menos.
  let refreshSeq = 0

  // Promesa compartida de creación: 20 escaneos simultáneos con el carrito
  // vacío creaban hasta 20 ventas DRAFT huérfanas. Ahora todos esperan la misma.
  let creatingSale: Promise<Sale> | null = null

  // Idempotencia del cobro: la clave sobrevive a los reintentos del mismo
  // intento (misma venta, método y monto) y se renueva cuando cambia alguno.
  let paymentAttemptKey = ''
  let paymentAttemptFingerprint: string | null = null

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
    const seq = ++refreshSeq
    const saleId = sale.value.id
    const res = await $api<ApiResponse<Sale>>(`/sales/${saleId}`)

    // Otra recarga se disparó después y ya llegó: esta respuesta está obsoleta.
    // También descartamos si el carrito cambió de venta mientras esperábamos.
    if (seq !== refreshSeq || sale.value?.id !== saleId) return

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
    const saleId = sale.value.id
    await withMutation(async () => {
      try {
        await $api(`/sales/${saleId}/set-client`, {
          method: 'PATCH',
          body: { clientId: client?.id ?? null },
        })
        selectedClient.value = client
        await refreshSale() // trae los items ya re-preciados y el nuevo total
        toast.info(client ? `Precios actualizados para ${client.name}` : 'Precios de público general aplicados')
      } catch {
        selectedClient.value = previous // el interceptor ya notificó el error
      }
    })
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

    // GUARDIA DE PRECIO: un producto mal capturado (precio 0 o nulo) se vendía
    // gratis sin que nadie lo advirtiera. Ninguna capa lo validaba.
    const price = Number(product.price ?? 0)
    if (!Number.isFinite(price) || price <= 0) {
      toast.error(
        `"${product.name}" no tiene un precio de venta válido. Corrígelo en el catálogo antes de venderlo.`,
      )
      return false
    }

    // GUARDIA DE PRODUCTO ACTIVO: el buscador podía listar productos dados de
    // baja o retirados del mercado.
    if (product.isActive === false) {
      toast.error(`"${product.name}" está dado de baja y no puede venderse.`)
      return false
    }

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

    return withMutation(async () => {
      try {
        if (!sale.value) {
          // CREACIÓN COMPARTIDA: si llegan 20 escaneos con el carrito vacío,
          // todos esperan la MISMA promesa en lugar de crear 20 ventas DRAFT.
          // El primer producto lo aporta quien gane la carrera; el resto se
          // agrega después con add-product.
          isBootstrapping.value = true
          creatingSale ??= $api<ApiResponse<Sale>>('/sales', {
            method: 'POST',
            body: {
              clientId: selectedClient.value?.id,
              items: [{ productId: product.id, quantity }],
            },
          }).then((res) => res.data)

          const creada = creatingSale
          try {
            const nueva = await creada
            const fuiPrimero = !sale.value
            if (fuiPrimero) {
              sale.value = nueva
              await refreshSale() // enriquece con producto/cliente
              return true
            }
            // Otro escaneo creó la venta con SU producto: el mío falta por agregar.
            await $api(`/sales/${nueva.id}/add-product`, {
              method: 'POST',
              body: { productId: product.id, quantity },
            })
            await refreshSale()
            return true
          } finally {
            // Se libera para que un carrito nuevo pueda volver a crear.
            if (creatingSale === creada) creatingSale = null
            isBootstrapping.value = false
          }
        }

        await $api(`/sales/${sale.value.id}/add-product`, {
          method: 'POST',
          body: { productId: product.id, quantity },
        })
        await refreshSale()
        return true
      } catch {
        return false // el interceptor ya muestra el toast del error del backend
      }
    })
  }

  async function removeItem(itemId: number) {
    if (!sale.value) return
    const { $api } = useNuxtApp()
    const saleId = sale.value.id
    await withMutation(async () => {
      await $api(`/sales/${saleId}/remove-product/${itemId}`, { method: 'POST' })
      await refreshSale()
    })
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
    const saleId = sale.value.id
    await withMutation(async () => {
      await $api(`/sales/${saleId}/update-item/${item.id}`, {
        method: 'PATCH',
        body: { quantity },
      })
      await refreshSale()
    })
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

    // CLAVE DE IDEMPOTENCIA ESTABLE POR INTENTO DE COBRO.
    // Se deriva de la venta, el método y el monto, y se conserva mientras esos
    // datos no cambien. Así, si la respuesta se pierde y el cajero vuelve a
    // pulsar Cobrar, viaja la MISMA clave y el backend devuelve el cobro
    // original en lugar de cobrar dos veces.
    // Una clave nueva por petición (como haría el plugin por defecto) no
    // protegería del reintento manual, que es justo el caso peligroso.
    const huella = `${sale.value.id}:${payload.method}:${payload.amount}`
    if (paymentAttemptFingerprint !== huella) {
      paymentAttemptFingerprint = huella
      paymentAttemptKey = crypto.randomUUID()
    }

    try {
      await $api(`/sales/${sale.value.id}/add-payment`, {
        method: 'POST',
        body: payload,
        headers: { 'Idempotency-Key': paymentAttemptKey },
      })
      await refreshSale()
      // Cobro confirmado: la siguiente operación de cobro usará una clave nueva.
      paymentAttemptFingerprint = null
      return true
    } catch {
      // Se CONSERVA la clave a propósito: el reintento debe reusarla.
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
