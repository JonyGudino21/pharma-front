import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { PaginatedData, ApiResponse } from '~/types/auth'

export interface Client {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  rfc: string | null
  curp: string | null
  currentDebt: string | number
  hasCredit: boolean
  creditLimit: string | number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    sales: number
  }
}

export interface CreateClientPayload {
  name: string
  email?: string
  phone?: string
  address?: string
  rfc?: string
  curp?: string
}

export interface Debtor {
  id: number
  name: string
  phone: string | null
  currentDebt: string | number
  creditLimit: string | number
  sales: Array<{ id: number, total: string | number, createdAt: string }>
}

export interface ClientPaymentPayload {
  method: 'CASH' | 'TRANSFER' | 'CARD'
  amount: number
  reference?: string
  notes?: string
}

export const useClientStore = defineStore('client', () => {
  const clients = ref<Client[]>([])
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const isLoading = ref(false)
  const isActionLoading = ref(false)
  const debtors = ref<Debtor[]>([])
  const totalCompanyDebt = ref<string | number>(0)

  const filters = ref({
    query: '',
    isActive: 'true' // 'true', 'false', 'all'
  })

  // 1. Listar Clientes
  async function fetchClients(page = 1) {
    const { $api } = useNuxtApp()
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', pagination.value.limit.toString())
      
      if (filters.value.isActive !== 'all') {
        params.append('active', filters.value.isActive)
      }

      const res = await $api<ApiResponse<PaginatedData<Client>>>(`/client?${params.toString()}`)
      clients.value = res.data.clients || res.data.data || []
      if (res.data.pagination) pagination.value = res.data.pagination
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 2. Buscar Clientes (Autocompletado POS o Búsqueda Directorio)
  async function searchClients(page = 1) {
    const { $api } = useNuxtApp()
    if (!filters.value.query.trim()) return

    isLoading.value = true
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', pagination.value.limit.toString())
      
      // El backend requiere name, email o phone. Le mandamos el mismo query a los 3.
      params.append('name', filters.value.query)
      params.append('email', filters.value.query)
      params.append('phone', filters.value.query)

      const res = await $api<ApiResponse<PaginatedData<Client>>>(`/client/search?${params.toString()}`)
      clients.value = res.data.clients || res.data.data || []
      if (res.data.pagination) pagination.value = res.data.pagination
    } catch (error) {
      console.error('Error searching clients:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 3. Crear Cliente
  async function createClient(payload: CreateClientPayload) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api('/client', { method: 'POST', body: payload })
      await fetchClients(1)
    } finally {
      isActionLoading.value = false
    }
  }

  // 4. Actualizar Cliente
  async function updateClient(id: number, payload: Partial<CreateClientPayload & { isActive: boolean }>) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/client/${id}`, { method: 'PATCH', body: payload })
      await fetchClients(pagination.value.page)
    } finally {
      isActionLoading.value = false
    }
  }

  // 5. Desactivar Cliente
  async function deactivateClient(id: number) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/client/${id}`, { method: 'DELETE' })
      await fetchClients(pagination.value.page)
    } finally {
      isActionLoading.value = false
    }
  }

  // 6. Obtener Deudores (Solo MANAGER)
  async function fetchDebtors(page = 1) {
    const { $api } = useNuxtApp()
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', pagination.value.limit.toString())

      const res = await $api<ApiResponse<any>>(`/client/debtors?${params.toString()}`)
      debtors.value = res.data.debtors || []
      totalCompanyDebt.value = res.data.totalCompanyDebt || 0
      if (res.data.pagination) pagination.value = res.data.pagination
    } catch (error) {
      console.error('Error fetching debtors:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 7. Registrar Abono (FIFO)
  async function registerPayment(id: number, payload: ClientPaymentPayload) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      // Retornamos la respuesta completa porque el backend manda info valiosa (ej. si sobró dinero)
      const res = await $api<ApiResponse<any>>(`/client/${id}/payment`, { 
        method: 'POST', body: payload 
      })
      return res
    } finally {
      isActionLoading.value = false
    }
  }

  // --- MÉTODOS FINANCIEROS (Se usarán en Fase B y C) ---
  // Los dejamos preparados
  async function updateCreditConfig(id: number, payload: { hasCredit: boolean, creditLimit: number }) {
    const { $api } = useNuxtApp()
    isActionLoading.value = true
    try {
      await $api(`/client/${id}/credit-config`, { method: 'PATCH', body: payload })
      await fetchClients(pagination.value.page)
    } finally {
      isActionLoading.value = false
    }
  }

  return {
    clients,
    pagination,
    isLoading,
    isActionLoading,
    filters,
    fetchClients,
    searchClients,
    createClient,
    updateClient,
    deactivateClient,
    updateCreditConfig,
    fetchDebtors,
    registerPayment,
    debtors,
    totalCompanyDebt
  }
})