import { defineStore } from 'pinia'
import type { TaxCategory } from '~/types/settings'
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
  taxCategory?: TaxCategory
}

export type { TaxCategory }

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
  /** Lote y caducidad (YYYY-MM-DD) del inventario inicial. Sólo en el alta. */
  lotNumber?: string
  expiryDate?: string
  minStock: number
  price: number
  cost: number
  isActive?: boolean
  /** Tratamiento de IVA. Sin valor, el de Configuración › Impuestos. */
  taxCategory?: TaxCategory
}

export interface SearchProductPayload {
  name?: string;
  letters?: string[];
  page?: number;
  limit?: number;
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
    delete safePayload.lotNumber
    delete safePayload.expiryDate
    
    await $api(`/products/${id}`, { method: 'PATCH', body: safePayload })
    await fetchProducts(pagination.value.page)
  }

  /**
   * Tratamiento de IVA en bloque (gerencia). Una categoría O una lista de ids.
   * @returns cuántos productos cambiaron
   */
  async function setTaxCategory(payload: { taxCategory: TaxCategory; categoryId?: number; productIds?: number[] }): Promise<number> {
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<{ updated: number }>>('/products/tax-category', { method: 'PATCH', body: payload })
    return res.data.updated
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
      // encodeURIComponent: un código con "/", "#" o "?" (lectores mal configurados,
      // códigos internos) cambiaba la ruta y buscaba otra cosa o daba 404.
      const res = await $api<ApiResponse<Product>>(`/products/barcode/${encodeURIComponent(barcode)}`)
      return res.data
    } catch (error) {
      return null
    }
  }

  // --- BÚSQUEDA INDEPENDIENTE (Para Inventario y POS) ---
  async function searchProductsLocally(payload: SearchProductPayload): Promise<Product[]> {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<PaginatedData<Product>>>('/products/search', {
        method: 'POST',
        body: {
          name: payload.name,
          letters: payload.letters,
          page: payload.page || 1,
          limit: payload.limit || 10
        }
      })
      return res.data.products || res.data.data || []
    } catch (error) {
      console.error('Error buscando productos:', error)
      return []
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
    setTaxCategory,
    fetchByBarcode,
    searchProductsLocally
  }
})