import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'

export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'LOSS' | 'INITIAL' | 'RETURN'

export interface InventoryMovement {
  id: number
  productId: number
  type: MovementType
  quantity: number
  unitCost: string | number
  totalCost: string | number
  reason: string | null
  balanceAfter: number // Muy importante para el Kardex
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

export const useInventoryStore = defineStore('inventory', () => {
  const valuation = ref<ValuationData | null>(null)
  const lowStockAlerts = ref<LowStockAlert[]>([])
  const currentKardex = ref<InventoryMovement[]>([])
  
  const isLoading = ref(false)
  const isLoadingKardex = ref(false)

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
    // El Interceptor atrapará el 400 si realQuantity == stock o si intenta dejarlo negativo
    await $api('/inventory/adjustment', {
      method: 'POST',
      body: payload
    })
  }

  function clearKardex() {
    currentKardex.value = []
  }

  async function fetchStock(productId: number) {
    const { $api } = useNuxtApp()
    try {
      // Retorna: { id, stock, minStock, name }
      const res = await $api<ApiResponse<{ id: number, stock: number, minStock: number, name: string }>>(`/inventory/stock/${productId}`)
      return res.data
    } catch (error) {
      console.error('Error consultando stock actual:', error)
      return null
    }
  }

  return {
    valuation,
    lowStockAlerts,
    currentKardex,
    isLoading,
    isLoadingKardex,
    fetchValuation,
    fetchLowStockAlerts,
    fetchKardex,
    registerAdjustment,
    clearKardex,
    fetchStock,
  }
})