<template>
  <div class="space-y-6">
    <div class="page-header">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:archive-box-bold" class="text-primary-600" /> Centro de Control de Inventario
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitorea valoraciones, Kardex y ajustes físicos.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

      <div v-if="authStore.can('canViewInventoryValuation')" class="bg-linear-to-br from-primary-500 to-primary-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-bold opacity-90 uppercase tracking-wider">Valoración Total</p>
          <Icon name="ph:currency-circle-dollar-duotone" class="w-8 h-8 opacity-50" />
        </div>
        <p class="text-3xl sm:text-4xl font-black break-all">{{ formatCurrency(Number(inventoryStore.valuation?.totalValue || 0)) }}</p>
        <p class="text-sm mt-2 font-medium opacity-80">{{ inventoryStore.valuation?.productCount || 0 }} productos registrados</p>
      </div>

      <div v-if="authStore.can('canViewLowStockAlerts')" class="bg-linear-to-br from-warning-500 to-warning-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-bold opacity-90 uppercase tracking-wider">Alertas de Stock</p>
          <Icon name="ph:warning-circle-duotone" class="w-8 h-8 opacity-50" />
        </div>
        <p class="text-3xl sm:text-4xl font-black">{{ inventoryStore.lowStockAlerts.length }}</p>
        <p class="text-sm mt-2 font-medium opacity-80">Productos en nivel crítico (≤ Mínimo)</p>
      </div>

    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <NuxtLink
        v-if="authStore.can('canViewExpiringBatches')"
        to="/inventory/expiring"
        class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex items-center gap-4"
      >
        <div class="w-12 h-12 shrink-0 rounded-xl bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center">
          <Icon name="ph:hourglass-bold" class="w-6 h-6 text-warning-600" />
        </div>
        <div class="min-w-0">
          <p class="font-bold text-gray-900 dark:text-white">Caducidades FEFO</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Lotes por vencer y merma de caducados</p>
        </div>
        <Icon name="ph:caret-right-bold" class="ml-auto shrink-0 text-gray-400" />
      </NuxtLink>
      <NuxtLink
        v-if="authStore.can('canViewControlledLog')"
        to="/inventory/controlled"
        class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex items-center gap-4"
      >
        <div class="w-12 h-12 shrink-0 rounded-xl bg-error-50 dark:bg-error-900/30 flex items-center justify-center">
          <Icon name="ph:notebook-bold" class="w-6 h-6 text-error-600" />
        </div>
        <div class="min-w-0">
          <p class="font-bold text-gray-900 dark:text-white">Libro de controlados</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Bitácora regulatoria COFEPRIS</p>
        </div>
        <Icon name="ph:caret-right-bold" class="ml-auto shrink-0 text-gray-400" />
      </NuxtLink>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-2xl">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Operaciones por Producto</h2>
        <div class="relative max-w-xl">
          <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="search"
            placeholder="Nombre o SKU del producto..."
            aria-label="Buscar producto por nombre o SKU"
            class="input-base pl-10"
          />
        </div>
        <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Para ver su Kardex, ajustar existencias o asignar lote.</p>
      </div>

      <div class="p-4 sm:p-6">
        <div v-if="isSearching" class="text-center py-8">
          <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto text-primary-500" />
        </div>
        <!-- Un fallo NO es "no hay productos": antes se leía igual. -->
        <div v-else-if="searchError" class="py-8 text-center" role="alert">
          <span class="flex flex-col gap-2 items-center justify-center w-full">
            <Icon name="ph:cloud-slash-fill" class="w-10 h-10 text-error-500" />
            <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ searchError.mensaje }}</span>
            <span class="text-xs text-gray-500 max-w-md">No pudimos buscar: esto no significa que el producto no exista.</span>
            <button v-if="searchError.reintentable" type="button" class="btn-primary mt-1" @click="runSearch">
              <Icon name="ph:arrow-clockwise-bold" class="mr-2" /> Reintentar
            </button>
          </span>
        </div>
        <div v-else-if="searchQuery.trim() && searchResults.length === 0" class="text-center py-8 text-gray-500">
          No se encontraron productos con ese nombre o SKU.
        </div>
        <div v-else-if="!searchQuery.trim()" class="text-center py-8 text-gray-400">
          Usa el buscador para seleccionar un producto.
        </div>

        <ul v-else class="space-y-3">
          <li v-for="product in searchResults" :key="product.id" class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30">
            <div class="min-w-0 flex-1">
              <p class="font-bold text-gray-900 dark:text-white break-words">{{ product.name }} <span class="text-xs font-normal font-mono text-gray-500 dark:text-gray-400">({{ product.sku }})</span></p>
              <p class="text-sm font-medium" :class="product.stock <= product.minStock ? 'text-error-600 dark:text-error-400' : 'text-success-600 dark:text-success-400'">
                Stock en sistema: {{ product.stock }} uds.
              </p>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 md:flex md:shrink-0">
              <button
                v-if="authStore.can('canViewKardex')"
                @click="openKardex(product)"
                class="btn-secondary"
              >
                <Icon name="ph:clock-counter-clockwise-bold" class="mr-2" /> Kardex
              </button>
              <button
                v-if="authStore.can('canAdjustInventory')"
                @click="openAdjustment(product)"
                class="btn-secondary text-warning-700 dark:text-warning-400"
              >
                <Icon name="ph:sliders-horizontal-bold" class="mr-2" /> Ajustar
              </button>
              <button
                v-if="authStore.can('canAdjustInventory')"
                class="btn-secondary text-primary-700 dark:text-primary-300"
                title="Registrar lote y caducidad de la existencia que no los tiene"
                @click="openAssignLot(product)"
              >
                <Icon name="ph:barcode-bold" class="mr-2" /> Asignar lote
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <KardexModal v-model="showKardexModal" :product="selectedProduct" />
    <AdjustmentModal v-model="showAdjustmentModal" :product="selectedProduct" @success="handleAdjustmentSuccess" />
    <AssignLotModal v-model="showAssignLot" :product="selectedProduct" @success="handleAdjustmentSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useProductStore } from '~/stores/product'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { describirFallo, type FalloPeticion } from '~/composables/useRequestState'
import type { Product } from '~/stores/product'

import KardexModal from '~/components/inventory/KardexModal.vue'
import AdjustmentModal from '~/components/inventory/AdjustmentModal.vue'
import AssignLotModal from '~/components/inventory/AssignLotModal.vue'

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
const searchError = ref<FalloPeticion | null>(null)
let searchTimeout: any = null
/** Descarta respuestas de búsquedas viejas que lleguen después de una nueva. */
let searchSeq = 0

const showKardexModal = ref(false)
const showAdjustmentModal = ref(false)
const selectedProduct = ref<Product | null>(null)

onMounted(() => {
  if (authStore.can('canViewInventoryValuation')) inventoryStore.fetchValuation()
  if (authStore.can('canViewLowStockAlerts')) inventoryStore.fetchLowStockAlerts()
})

const runSearch = async () => {
  const term = searchQuery.value.trim()
  const seq = ++searchSeq
  if (!term) {
    searchResults.value = []
    searchError.value = null
    isSearching.value = false
    return
  }
  isSearching.value = true
  searchError.value = null
  try {
    // Nombre o SKU (parcial): el servidor busca en ambos.
    const results = await productStore.searchByNameOrSku(term, 10)
    if (seq === searchSeq) searchResults.value = results
  } catch (error) {
    if (seq === searchSeq) {
      searchResults.value = []
      searchError.value = describirFallo(error)
    }
  } finally {
    if (seq === searchSeq) isSearching.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    runSearch()
    return
  }
  isSearching.value = true
  searchTimeout = setTimeout(runSearch, 500)
}

const showAssignLot = ref(false)
const openAssignLot = (product: Product) => {
  selectedProduct.value = product
  showAssignLot.value = true
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
  runSearch()
}
</script>
