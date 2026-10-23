import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'
import { describirFallo, type FalloPeticion } from '~/composables/useRequestState'

/** Un precio especial vigente del cliente (GET /client/:id/prices). */
export interface ClientPrice {
  productId: number
  product: {
    id: number
    name: string
    sku: string
    strength: string | null
    presentation: string | null
    price: string
    cost: string
    isActive: boolean
  }
  price: string
  listPrice: string
  difference: string
  margin: 'BAJO_COSTO' | 'SIN_GANANCIA' | 'OK'
  updatedAt: string
  changedBy: string | null
  reason: string | null
  previousPrice: string | null
  sale: { id: number; invoiceNumber: string | null } | null
}

export interface ClientPriceHistoryItem {
  id: number
  price: string
  previousPrice: string | null
  reason: string | null
  startDate: string
  endDate: string | null
  changedBy: string
  sale: { id: number; invoiceNumber: string | null } | null
}

/**
 * Precios especiales de un cliente (ADR-0025): listar, capturar, quitar e
 * historial. Las escrituras lanzan el error para que el modal lo muestre; el
 * interceptor ya avisó con el mensaje del servidor.
 */
export function useClientPrices(clientId: number) {
  const prices = ref<ClientPrice[]>([])
  const loading = ref(false)
  const loadError = ref<FalloPeticion | null>(null)

  async function load() {
    const { $api } = useNuxtApp()
    loading.value = true
    loadError.value = null
    try {
      const res = await $api<ApiResponse<ClientPrice[]>>(`/client/${clientId}/prices`)
      prices.value = res.data ?? []
    } catch (e) {
      loadError.value = describirFallo(e)
    } finally {
      loading.value = false
    }
  }

  async function save(productId: number, price: number, reason?: string) {
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<{ message: string; margin: ClientPrice['margin'] }>>(
      `/client/${clientId}/prices/${productId}`,
      { method: 'PUT', body: { price, ...(reason ? { reason } : {}) } },
    )
    await load()
    return res.data
  }

  async function remove(productId: number, reason?: string) {
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<{ message: string }>>(`/client/${clientId}/prices/${productId}`, {
      method: 'DELETE',
      body: reason ? { reason } : {},
    })
    await load()
    return res.data
  }

  async function history(productId: number) {
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<ClientPriceHistoryItem[]>>(`/client/${clientId}/prices/${productId}/history`)
    return res.data ?? []
  }

  return { prices, loading, loadError, load, save, remove, history }
}
