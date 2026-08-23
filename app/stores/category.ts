import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { PaginatedData, ApiResponse } from '~/types/auth'

export interface Category {
  id: number
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const isLoading = ref(false)

  const filters = ref({
    query: '',
    isActive: 'all' // 'all', 'true', 'false'
  })

  async function fetchCategories(page = 1) {
    const { $api } = useNuxtApp()
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', pagination.value.limit.toString())
      
      if (filters.value.isActive !== 'all') {
        params.append('active', filters.value.isActive)
      }

      let url = '/category'
      if (filters.value.query.trim()) {
        url = '/category/search'
        params.append('name', filters.value.query.trim())
      }

      const res = await $api<ApiResponse<PaginatedData<Category>>>(`${url}?${params.toString()}`)
      categories.value = res.data.categories || res.data.data || []
      if (res.data.pagination) {
        pagination.value = res.data.pagination
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createCategory(payload: { name: string, description?: string, isActive: boolean }) {
    const { $api } = useNuxtApp()
    // No usamos try-catch aquí para que el Modal atrape el error 400 y no se cierre
    await $api('/category', { method: 'POST', body: payload })
    await fetchCategories(1) // Recargamos y volvemos a la página 1
  }

  async function updateCategory(id: number, payload: Partial<Category>) {
    const { $api } = useNuxtApp()
    await $api(`/category/${id}`, { method: 'PATCH', body: payload })
    await fetchCategories(pagination.value.page)
  }

  async function deactivateCategory(id: number) {
    const { $api } = useNuxtApp()
    await $api(`/category/${id}`, { method: 'DELETE' })
    await fetchCategories(pagination.value.page)
  }

  return {
    categories,
    pagination,
    isLoading,
    filters,
    fetchCategories,
    createCategory,
    updateCategory,
    deactivateCategory
  }
})