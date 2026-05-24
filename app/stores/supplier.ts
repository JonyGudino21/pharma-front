import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { PaginatedData, ApiResponse } from '~/types/auth'

export interface Supplier {
  id: number
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  creditDays: number
  balance: string | number // Viene como Decimal (string)
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    purchases: number // Compras pendientes devueltas en findAll
  }
}

export interface PendingInvoice {
  id: number
  invoiceNumber: string
  total: string | number
  paidAmount: string | number
  balance: string | number
  status: 'PENDING' | 'PARTIAL'
  createdAt: string
}

export interface AccountStatement {
  supplier: {
    id: number
    name: string
    currentBalance: string | number
    creditDays: number
  }
  pendingInvoices: PendingInvoice[]
}

export interface CreateSupplierPayload {
  name: string
  contact?: string
  phone?: string
  email?: string
  creditDays?: number
}

export const useSupplierStore = defineStore('supplier', () => {
  const suppliers = ref<Supplier[]>([])
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const isLoading = ref(false)

  const filters = ref({
    query: '',
    isActive: 'true' // 'true', 'false', 'all'
  })

  async function fetchSuppliers(page = 1) {
    const { $api } = useNuxtApp()
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      // El backend de NestJS espera el objeto anidado o los params mapeados
      params.append('pagination[page]', page.toString())
      params.append('pagination[limit]', pagination.value.limit.toString())
      
      if (filters.value.isActive !== 'all') {
        params.append('isActive', filters.value.isActive)
      }

      const res = await $api<ApiResponse<PaginatedData<Supplier>>>(`/suppliers?${params.toString()}`)
      suppliers.value = res.data.suppliers || res.data.data || []
      if (res.data.pagination) pagination.value = res.data.pagination
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function searchSuppliers(page = 1) {
    const { $api } = useNuxtApp()
    if (!filters.value.query.trim()) return

    isLoading.value = true
    try {
      const params = new URLSearchParams()
      params.append('pagination[page]', page.toString())
      params.append('pagination[limit]', pagination.value.limit.toString())
      
      // Enviamos el query a los 3 campos, el backend aplica OR
      params.append('name', filters.value.query)
      params.append('email', filters.value.query)
      params.append('phone', filters.value.query)

      const res = await $api<ApiResponse<PaginatedData<Supplier>>>(`/suppliers/search?${params.toString()}`)
      suppliers.value = res.data.suppliers || res.data.data || []
      if (res.data.pagination) pagination.value = res.data.pagination
    } catch (error) {
      console.error('Error searching suppliers:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createSupplier(payload: CreateSupplierPayload) {
    const { $api } = useNuxtApp()
    await $api('/suppliers', { method: 'POST', body: payload })
    await fetchSuppliers(1)
  }

  async function updateSupplier(id: number, payload: Partial<CreateSupplierPayload & { isActive: boolean }>) {
    const { $api } = useNuxtApp()
    await $api(`/suppliers/${id}`, { method: 'PATCH', body: payload })
    await fetchSuppliers(pagination.value.page)
  }

  async function deactivateSupplier(id: number) {
    const { $api } = useNuxtApp()
    await $api(`/suppliers/${id}`, { method: 'DELETE' })
    await fetchSuppliers(pagination.value.page)
  }

  async function fetchAccountStatement(id: number): Promise<AccountStatement | null> {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<AccountStatement>>(`/suppliers/${id}/account-statement`)
      return res.data
    } catch (error) {
      console.error('Error fetching account statement:', error)
      return null
    }
  }

  return {
    suppliers,
    pagination,
    isLoading,
    filters,
    fetchSuppliers,
    searchSuppliers,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
    fetchAccountStatement
  }
})