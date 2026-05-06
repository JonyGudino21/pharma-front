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

export interface ProductCategory {
  id: number
  productId: number
  isPrimary: boolean
  order: number | null
  createdAt: string
  updatedAt: string
  category: Category
}

export interface Product {
  id: number
  name: string
  description?: string
  strength?: string
  format?: string
  presentation?: string
  sku: string
  barcode?: string
  controlled: boolean
  stock: number
  minStock: number
  price: number | string // El backend Decimal suele llegar como string
  cost: number | string
  isActive: boolean
  categories: ProductCategory[]
}

export interface CreateProductPayload {
  name: string
  description?: string
  strength?: string
  format?: string
  presentation?: string
  barcode?: string
  categories?: number[] // Array de IDs numéricos
  controlled: boolean
  stock?: number
  minStock: number
  price: number
  cost: number
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const isLoading = ref(false)

  const filters = ref({
    query: '',
    isActive: 'true' // Por defecto mostramos solo activos
  })

  async function fetchProducts(page = 1) {
    const { $api } = useNuxtApp()
    isLoading.value = true

    try {
      // 1. Si NO HAY BÚSQUEDA, usamos GET /products
      if (!filters.value.query.trim()) {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit', pagination.value.limit.toString())
        if (filters.value.isActive !== 'all') {
          params.append('active', filters.value.isActive)
        }

        const res = await $api<ApiResponse<PaginatedData<Product>>>(`/products?${params.toString()}`)
        products.value = res.data.products || res.data.data || []
        if (res.data.pagination) pagination.value = res.data.pagination
      } 
      // 2. Si HAY BÚSQUEDA, usamos POST /products/search según tu contrato
      else {
        const res = await $api<ApiResponse<PaginatedData<Product>>>('/products/search', {
          method: 'POST',
          body: {
            name: filters.value.query.trim(),
            page,
            limit: pagination.value.limit
          }
        })
        products.value = res.data.products || res.data.data || []
        if (res.data.pagination) pagination.value = res.data.pagination
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createProduct(payload: CreateProductPayload) {
    const { $api } = useNuxtApp()
    // El interceptor atrapará el 400 si el Barcode o SKU generado ya existe
    await $api('/products', { method: 'POST', body: payload })
    await fetchProducts(1)
  }

  async function updateProduct(id: number, payload: Partial<CreateProductPayload & { isActive: boolean }>) {
    const { $api } = useNuxtApp()
    // Protegemos el stock. La actualización manual de stock no se recomienda aquí.
    const safePayload = { ...payload }
    delete safePayload.stock 
    
    await $api(`/products/${id}`, { method: 'PATCH', body: safePayload })
    await fetchProducts(pagination.value.page)
  }

  async function deactivateProduct(id: number) {
    const { $api } = useNuxtApp()
    await $api(`/products/${id}`, { method: 'DELETE' })
    await fetchProducts(pagination.value.page)
  }

  // Utilidad para el POS (Buscar por código de barras exacto)
  async function fetchByBarcode(barcode: string) {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<Product>>(`/products/barcode/${barcode}`)
      return res.data
    } catch (error) {
      return null
    }
  }

  return {
    products,
    pagination,
    isLoading,
    filters,
    fetchProducts,
    createProduct,
    updateProduct,
    deactivateProduct,
    fetchByBarcode
  }
})