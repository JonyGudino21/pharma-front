import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'

// Interfaces exactas según el Payload del Backend
export interface KPIs {
  totalSales: number
  totalCost: number
  grossProfit: number
  marginPercentage: number
  averageTicket: number
  totalTransactions: number
}

export interface Liquidity {
  accountsReceivable: number
  accountsPayable: number
  inventoryValue: number
}

export interface PaymentMethodSales {
  method: string
  totalAmount: number
  count: number
}

export interface TopProduct {
  name: string
  sku: string
  totalQuantity: number
  totalRevenue: number
}

export interface DashboardData {
  period: { startDate: string; endDate: string }
  kpis: KPIs
  liquidity: Liquidity
  trends: {
    salesByPaymentMethod: PaymentMethodSales[]
    topSellingProducts: TopProduct[]
  }
}

export const useAnalyticsStore = defineStore('analytics', () => {
  const data = ref<DashboardData | null>(null)
  const isLoading = ref(false)
  const filters = ref({ startDate: '', endDate: '' })

  async function fetchDashboard(startDate?: string, endDate?: string) {
    const { $api } = useNuxtApp()
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const url = `/analytics/dashboard?${params.toString()}`
      
      // La API responde con { success, message, data: DashboardData }
      const response = await $api<ApiResponse<DashboardData>>(url)
      data.value = response.data
    } catch (error) {
      console.error('Error fetching analytics:', error)
      data.value = null // Limpiamos si hay error (ej. 403 Sin permisos)
    } finally {
      isLoading.value = false
    }
  }

  function setCurrentMonthFilters() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
    
    filters.value.startDate = `${year}-${month}-01`
    filters.value.endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
  }

  function setLastMonthFilters() {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const year = lastMonth.getFullYear()
    const month = String(lastMonth.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(year, lastMonth.getMonth() + 1, 0).getDate()

    filters.value.startDate = `${year}-${month}-01`
    filters.value.endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
  }

  return {
    data,
    isLoading,
    filters,
    fetchDashboard,
    setCurrentMonthFilters,
    setLastMonthFilters
  }
})