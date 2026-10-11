<template>
  <div class="space-y-6">
    <div class="page-header">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:package-bold" class="text-primary-600" />
          Catálogo de Productos
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Inventario maestro y precios de venta.</p>
      </div>

      <div v-if="authStore.can('canManageProducts')" class="page-actions">
        <button
          @click="openCreateModal"
          class="btn-primary"
        >
          <Icon name="ph:plus-bold" class="mr-2" /> Nuevo Producto
        </button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-3 md:gap-4">
      <div class="relative flex-1">
        <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="store.filters.query"
          @input="handleSearch"
          type="search"
          placeholder="Nombre o SKU (Ej. Paracetamol)..."
          aria-label="Buscar producto por nombre"
          class="input-base pl-10"
        />
      </div>
      <select v-model="store.filters.isActive" @change="store.fetchProducts(1)" aria-label="Estado del producto" class="input-base md:w-48 cursor-pointer">
        <option value="true">Solo Activos</option>
        <option value="false">Inactivos</option>
        <option value="all">Todos los productos</option>
      </select>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <!-- Estados (una sola vez para tabla y tarjetas) -->
      <div v-if="store.isLoading" class="px-6 py-8 text-center text-gray-500">
        <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
        Cargando catálogo...
      </div>

      <div v-else-if="store.listError" class="px-6 py-12 text-center">
        <span class="flex flex-col gap-2 items-center justify-center w-full">
          <Icon name="ph:cloud-slash-fill" class="w-10 h-10 text-error-500" />
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.listError.mensaje }}</span>
          <span class="text-xs text-gray-500 max-w-md">Esto no significa que no haya productos: no pudimos consultarlos.</span>
          <button
            v-if="store.listError.reintentable"
            type="button"
            class="btn-primary mt-1"
            @click="store.retryList()"
          >
            <Icon name="ph:arrow-clockwise-bold" class="mr-2" /> Reintentar
          </button>
        </span>
      </div>

      <div v-else-if="store.products.length === 0" class="px-6 py-12 text-center text-gray-500">
        <Icon name="ph:package-x-duotone" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
        No se encontraron productos.
      </div>

      <template v-else>

        <!-- Laptop y tableta: tabla -->
        <div class="table-wrap hidden @4xl:block">
          <table class="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase">Producto / SKU</th>
                <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase">Categorías</th>
                <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Precio Venta</th>
                <th v-if="authStore.can('canManageProducts')" class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Costo (Privado)</th>
                <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Físico (Stock)</th>
                <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Estado</th>
                <th v-if="authStore.can('canManageProducts')" class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="product in store.products" :key="product.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div v-if="product.controlled" class="w-2 h-10 bg-error-500 rounded-full" title="Medicamento Controlado"></div>
                    <div>
                      <p class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {{ product.name }}
                        <span v-if="product.strength" class="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 rounded">{{ product.strength }}</span>
                      </p>
                      <p class="text-xs font-mono text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                        <Icon name="ph:barcode" class="mr-1" />
                        {{ product.sku }} <span v-if="product.barcode">| {{ product.barcode }}</span>
                      </p>
                    </div>
                  </div>
                </td>

                <td class="px-4 py-4">
                  <div class="flex flex-wrap gap-1 max-w-[200px]">
                    <span v-for="cat in product.categories" :key="cat.id" class="text-[10px] font-medium px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded border border-primary-100 dark:border-primary-800">
                      {{ cat.category.name }}
                    </span>
                    <span v-if="product.categories.length === 0" class="text-xs text-gray-400 italic">Sin categoría</span>
                  </div>
                </td>

                <td class="px-4 py-4 text-right">
                  <p class="font-black text-success-600 dark:text-success-400 text-base">
                    {{ formatCurrency(Number(product.price)) }}
                  </p>
                </td>

                <td v-if="authStore.can('canManageProducts')" class="px-4 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(Number(product.cost)) }}
                </td>

                <td class="px-4 py-4 text-center">
                  <div class="flex flex-col items-center">
                    <span
                      class="font-black text-lg px-3 py-1 rounded-lg"
                      :class="product.stock <= product.minStock ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'"
                    >
                      {{ product.stock }}
                    </span>
                    <span v-if="product.stock <= product.minStock" class="text-[10px] text-error-600 dark:text-error-400 font-bold uppercase mt-1 flex items-center">
                      <Icon name="ph:warning-bold" class="mr-0.5" /> Stock Bajo
                    </span>
                  </div>
                </td>

                <td class="px-4 py-4 text-center">
                  <span v-if="product.isActive" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">
                    Activo
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    Inactivo
                  </span>
                </td>

                <td v-if="authStore.can('canManageProducts')" class="px-4 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button @click="openEditModal(product)" class="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Editar" :aria-label="`Editar ${product.name}`">
                      <Icon name="ph:pencil-simple-bold" class="w-5 h-5" />
                    </button>
                    <!-- Desactivar NO borra: el producto se oculta del POS y puede reactivarse. -->
                    <button
                      v-if="product.isActive"
                      @click="confirmDeactivate(product)"
                      class="p-2 text-warning-600 hover:bg-warning-50 dark:text-warning-400 dark:hover:bg-warning-900/30 rounded-lg transition-colors"
                      title="Desactivar"
                      :aria-label="`Desactivar ${product.name}`"
                    >
                      <Icon name="ph:prohibit-bold" class="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Celular: tarjetas -->
        <ul class="card-list @4xl:hidden" data-testid="products-cards">
          <li v-for="product in store.products" :key="product.id" class="px-4 py-3">
            <div class="flex items-start gap-3">
              <div v-if="product.controlled" class="mt-1 w-1.5 self-stretch bg-error-500 rounded-full" title="Medicamento Controlado"></div>
              <div class="min-w-0 flex-1">
                <div class="card-row">
                  <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">
                    {{ product.name }}<span v-if="product.strength" class="font-normal text-gray-500"> · {{ product.strength }}</span>
                  </p>
                  <p class="shrink-0 font-black tabular-nums text-success-600 dark:text-success-400">{{ formatCurrency(Number(product.price)) }}</p>
                </div>
                <div class="card-row mt-0.5">
                  <p class="min-w-0 truncate font-mono text-xs text-gray-500 dark:text-gray-400">{{ product.sku }}<span v-if="product.barcode"> | {{ product.barcode }}</span></p>
                  <p v-if="authStore.can('canManageProducts')" class="shrink-0 text-xs text-gray-500 dark:text-gray-400">Costo {{ formatCurrency(Number(product.cost)) }}</p>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
                    :class="product.stock <= product.minStock ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'"
                  >
                    <Icon v-if="product.stock <= product.minStock" name="ph:warning-bold" class="mr-1" />
                    {{ product.stock }} en stock
                  </span>
                  <span v-if="product.isActive" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Activo</span>
                  <span v-else class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactivo</span>
                  <span v-for="cat in product.categories" :key="cat.id" class="text-[10px] font-medium px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded border border-primary-100 dark:border-primary-800">
                    {{ cat.category.name }}
                  </span>
                </div>
                <div v-if="authStore.can('canManageProducts')" class="mt-3 flex gap-2">
                  <button type="button" class="btn-secondary flex-1" @click="openEditModal(product)">
                    <Icon name="ph:pencil-simple-bold" class="mr-2" /> Editar
                  </button>
                  <button
                    v-if="product.isActive"
                    type="button"
                    class="btn-secondary flex-1 text-warning-700 dark:text-warning-400"
                    @click="confirmDeactivate(product)"
                  >
                    <Icon name="ph:prohibit-bold" class="mr-2" /> Desactivar
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </template>

      <div v-if="store.products.length > 0 && !store.listError" class="px-3 pb-4 sm:px-6 bg-white dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="handlePageChange" />
      </div>
    </div>

    <ProductFormModal v-if="showModal" :product-to-edit="selectedProduct" @close="closeModal" />

    <ConfirmModal
      v-if="productToDeactivate"
      title="Desactivar Producto"
      :message="`¿Estás seguro que deseas desactivar '${productToDeactivate.name}'? Ya no podrá ser vendido en el Punto de Venta.`"
      confirmText="Desactivar"
      cancelText="Cancelar"
      type="warning"
      :isLoading="isDeactivating"
      @confirm="executeDeactivate"
      @cancel="productToDeactivate = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProductStore } from '~/stores/product'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
import ProductFormModal from '~/components/catalog/ProductFormModal.vue'
import Pagination from '~/components/shared/Pagination.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import type { Product } from '~/stores/product'

const store = useProductStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const showModal = ref(false)
const selectedProduct = ref<Product | null>(null)
const productToDeactivate = ref<Product | null>(null)
const isDeactivating = ref(false)

let searchTimeout: any = null

onMounted(() => {
  store.fetchProducts()
})

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.fetchProducts(1) // Vuelve a pag 1 al buscar
  }, 500)
}

const handlePageChange = (newPage: number) => {
  store.fetchProducts(newPage)
}

const openCreateModal = () => {
  selectedProduct.value = null
  showModal.value = true
}

const openEditModal = (product: Product) => {
  selectedProduct.value = product
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedProduct.value = null
}

const confirmDeactivate = (product: Product) => {
  productToDeactivate.value = product
}

const executeDeactivate = async () => {
  if (!productToDeactivate.value || isDeactivating.value) return
  isDeactivating.value = true

  try {
    await store.deactivateProduct(productToDeactivate.value.id)
    toast.success('Producto desactivado correctamente.')
    productToDeactivate.value = null
  } catch (error) {
    console.error("Error", error)
  } finally {
    isDeactivating.value = false
  }
}
</script>
