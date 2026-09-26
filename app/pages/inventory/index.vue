<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Icon name="ph:archive-box-bold" class="text-primary-600" /> Centro de Control de Inventario
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitorea valoraciones, Kardex y ajustes físicos.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <div v-if="authStore.can('canViewInventoryValuation')" class="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-bold opacity-90 uppercase tracking-wider">Valoración Total</p>
          <Icon name="ph:currency-circle-dollar-duotone" class="w-8 h-8 opacity-50" />
        </div>
        <p class="text-4xl font-black">{{ formatCurrency(Number(inventoryStore.valuation?.totalValue || 0)) }}</p>
        <p class="text-sm mt-2 font-medium opacity-80">{{ inventoryStore.valuation?.productCount || 0 }} productos registrados</p>
      </div>

      <div v-if="authStore.can('canViewLowStockAlerts')" class="bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-bold opacity-90 uppercase tracking-wider">Alertas de Stock</p>
          <Icon name="ph:warning-circle-duotone" class="w-8 h-8 opacity-50" />
        </div>
        <p class="text-4xl font-black">{{ inventoryStore.lowStockAlerts.length }}</p>
        <p class="text-sm mt-2 font-medium opacity-80">Productos en nivel crítico (≤ Mínimo)</p>
      </div>

    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NuxtLink
        v-if="authStore.can('canViewExpiringBatches')"
        to="/inventory/expiring"
        class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex items-center gap-4"
      >
        <div class="w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center">
          <Icon name="ph:hourglass-bold" class="w-6 h-6 text-warning-600" />
        </div>
        <div>
          <p class="font-bold text-gray-900 dark:text-white">Caducidades FEFO</p>
          <p class="text-sm text-gray-500">Lotes por vencer y merma de caducados</p>
        </div>
      </NuxtLink>
      <NuxtLink
        v-if="authStore.can('canViewControlledLog')"
        to="/inventory/controlled"
        class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex items-center gap-4"
      >
        <div class="w-12 h-12 rounded-xl bg-error-50 dark:bg-error-900/30 flex items-center justify-center">
          <Icon name="ph:notebook-bold" class="w-6 h-6 text-error-600" />
        </div>
        <div>
          <p class="font-bold text-gray-900 dark:text-white">Libro de controlados</p>
          <p class="text-sm text-gray-500">Bitácora regulatoria COFEPRIS</p>
        </div>
      </NuxtLink>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Operaciones por Producto</h2>
        <div class="relative max-w-xl">
          <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            v-model="searchQuery" 
            @input="handleSearch"
            type="text" 
            placeholder="Escribe el nombre o SKU para ver su Kardex o ajustar..." 
            class="input-base pl-10"
          />
        </div>
      </div>

      <div class="p-6">
        <div v-if="isSearching" class="text-center py-8">
          <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto text-primary-500" />
        </div>
        <div v-else-if="searchQuery && searchResults.length === 0" class="text-center py-8 text-gray-500">
          No se encontraron productos con ese nombre.
        </div>
        <div v-else-if="!searchQuery" class="text-center py-8 text-gray-400">
          Usa el buscador para seleccionar un producto.
        </div>
        
        <div v-else class="space-y-3">
          <div v-for="product in searchResults" :key="product.id" class="flex flex-col sm:flex-row items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30">
            <div class="flex-1 mb-3 sm:mb-0 w-full text-center sm:text-left">
              <p class="font-bold text-gray-900 dark:text-white">{{ product.name }} <span class="text-xs font-normal text-gray-500">({{ product.sku }})</span></p>
              <p class="text-sm font-medium" :class="product.stock <= product.minStock ? 'text-error-600' : 'text-success-600'">
                Stock en sistema: {{ product.stock }} uds.
              </p>
            </div>
            
            <div class="flex gap-2 w-full sm:w-auto">
              <button 
                v-if="authStore.can('canViewKardex')" 
                @click="openKardex(product)" 
                class="flex-1 sm:flex-none btn-secondary border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                <Icon name="ph:clock-counter-clockwise-bold" class="mr-2" /> Kardex
              </button>
              <button 
                v-if="authStore.can('canAdjustInventory')" 
                @click="openAdjustment(product)" 
                class="flex-1 sm:flex-none btn-secondary border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/30"
              >
                <Icon name="ph:sliders-horizontal-bold" class="mr-2" /> Ajustar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <KardexModal v-model="showKardexModal" :product="selectedProduct" />
    <AdjustmentModal v-model="showAdjustmentModal" :product="selectedProduct" @success="handleAdjustmentSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useProductStore } from '~/stores/product'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import type { Product, SearchProductPayload } from '~/stores/product'

import KardexModal from '~/components/inventory/KardexModal.vue'
import AdjustmentModal from '~/components/inventory/AdjustmentModal.vue'

definePageMeta({
  requiredPermission: 'canViewKardex' // Protegemos la ruta entera.
})

const inventoryStore = useInventoryStore()
const productStore = useProductStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()

const searchQuery = ref('')
const searchResults = ref<Product[]>([])
const isSearching = ref(false)
let searchTimeout: any = null

const showKardexModal = ref(false)
const showAdjustmentModal = ref(false)
const selectedProduct = ref<Product | null>(null)

onMounted(() => {
  if (authStore.can('canViewInventoryValuation')) inventoryStore.fetchValuation()
  if (authStore.can('canViewLowStockAlerts')) inventoryStore.fetchLowStockAlerts()
})

const handleSearch = () => {
  clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    isSearching.value = false
    return
  }
  
  isSearching.value = true
  searchTimeout = setTimeout(async () => {
    searchResults.value = await productStore.searchProductsLocally({ 
      name: searchQuery.value, 
      limit: 10 
    })
    isSearching.value = false
  }, 500)
}

const openKardex = (product: Product) => {
  selectedProduct.value = product
  showKardexModal.value = true
}

const openAdjustment = async (product: Product) => {
  // Antes de abrir el modal de ajuste, consultamos 
  // el stock real en este milisegundo por si alguien acaba de vender uno en el POS.
  const liveStockData = await inventoryStore.fetchStock(product.id)
  
  if (liveStockData) {
    // Actualizamos el producto con el stock más fresco
    selectedProduct.value = { ...product, stock: liveStockData.stock }
    showAdjustmentModal.value = true
  } else {
    // Si falla (ej. producto borrado), usamos el que teníamos
    selectedProduct.value = product
    showAdjustmentModal.value = true
  }
}

const handleAdjustmentSuccess = () => {
  // Al hacer un ajuste exitoso, actualizamos los KPIs y refrescamos la búsqueda para ver el nuevo stock
  if (authStore.can('canViewInventoryValuation')) inventoryStore.fetchValuation()
  if (authStore.can('canViewLowStockAlerts')) inventoryStore.fetchLowStockAlerts()
  handleSearch() 
}
</script>