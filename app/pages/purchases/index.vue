<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:shopping-cart-bold" class="text-primary-600" /> Órdenes de Compra
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Abastecimiento, recepción de mercancía y cuentas por pagar.</p>
      </div>
      
      <NuxtLink 
        v-if="authStore.can('canManagePurchases')" 
        to="/purchases/create"
        class="btn-primary shrink-0"
      >
        <Icon name="ph:plus-bold" class="mr-2" /> Nueva Orden
      </NuxtLink>
    </div>

    <div class="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="flex-1">
        <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Proveedor</label>
        <select v-model="store.filters.supplierId" @change="store.fetchPurchases(1)" class="input-base cursor-pointer">
          <option value="">Todos los proveedores</option>
          <option v-for="sup in supplierStore.suppliers" :key="sup.id" :value="sup.id">
            {{ sup.name }}
          </option>
        </select>
      </div>
      <div class="flex-1">
        <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Estado de Pago</label>
        <select v-model="store.filters.status" @change="store.fetchPurchases(1)" class="input-base cursor-pointer">
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="PARTIAL">Pago Parcial</option>
          <option value="PAID">Pagado Completamente</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Folio / Proveedor</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Importes</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Estado de Pago</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Recepción (Stock)</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Detalle</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            
            <tr v-if="store.isLoading" class="animate-pulse">
              <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
                Cargando historial de compras...
              </td>
            </tr>

            <tr v-else-if="store.purchases.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                <span class="flex flex-row gap-2 items-center justify-center w-full">
                  <Icon name="ph:shopping-cart-duotone" class="w-8 h-8 text-gray-400" />
                  <span>No se encontraron órdenes de compra.</span>
                </span>
              </td>
            </tr>

            <tr v-else v-for="purchase in store.purchases" :key="purchase.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-gray-900 dark:text-white">{{ purchase.invoiceNumber }}</p>
                <p class="text-sm text-gray-500 flex items-center mt-1">
                  <Icon name="ph:buildings" class="mr-1" /> {{ purchase.supplier?.name || 'Desconocido' }}
                </p>
              </td>
              
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ formatDate(purchase.createdAt) }}</p>
              </td>

              <td class="px-6 py-4 text-right">
                <p class="text-sm font-bold text-gray-900 dark:text-white">Total: {{ formatCurrency(Number(purchase.total)) }}</p>
                <p v-if="Number(purchase.balance) > 0" class="text-xs font-semibold text-error-600 dark:text-error-400 mt-1">
                  Deuda: {{ formatCurrency(Number(purchase.balance)) }}
                </p>
                <p v-else class="text-xs font-semibold text-success-600 dark:text-success-400 mt-1">
                  Sin deuda
                </p>
              </td>

              <td class="px-6 py-4 text-center">
                <span :class="getStatusBadge(purchase.status).class">
                  <Icon :name="getStatusBadge(purchase.status).icon" class="mr-1" />
                  {{ getStatusBadge(purchase.status).text }}
                </span>
              </td>

              <td class="px-6 py-4 text-center">
                <span :class="getDeliveryBadge(purchase.deliveryStatus).class">
                  <Icon :name="getDeliveryBadge(purchase.deliveryStatus).icon" class="mr-1" />
                  {{ getDeliveryBadge(purchase.deliveryStatus).text }}
                </span>
              </td>

              <td class="px-6 py-4 text-right">
                <NuxtLink 
                  :to="`/purchases/${purchase.id}`"
                  class="inline-flex items-center justify-center p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                  title="Ver Detalles y Operar"
                >
                  <Icon name="ph:arrow-right-bold" class="w-5 h-5" />
                </NuxtLink>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
      
      <div v-if="store.purchases.length > 0" class="px-6 pb-4 bg-white dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="store.fetchPurchases" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePurchaseStore, type PurchaseStatus, type PurchaseDeliveryStatus } from '~/stores/purchase'
import { useSupplierStore } from '~/stores/supplier'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import Pagination from '~/components/shared/Pagination.vue'

definePageMeta({ requiredPermission: 'canViewPurchases' })

const store = usePurchaseStore()
const supplierStore = useSupplierStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

onMounted(async () => {
  // Cargar proveedores para el filtro
  if (supplierStore.suppliers.length === 0) {
    supplierStore.filters.isActive = 'true'
    await supplierStore.fetchSuppliers(1)
  }
  await store.fetchPurchases(1)
})

// Helpers visuales para Badges
const getStatusBadge = (status: PurchaseStatus) => {
  const base = "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
  switch (status) {
    case 'PAID': return { class: `${base} bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400`, icon: 'ph:check-circle-bold', text: 'Pagado' }
    case 'PARTIAL': return { class: `${base} bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400`, icon: 'ph:clock-countdown-bold', text: 'Pago Parcial' }
    case 'PENDING': return { class: `${base} bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400`, icon: 'ph:warning-circle-bold', text: 'Pendiente' }
    case 'CANCELLED': return { class: `${base} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400`, icon: 'ph:prohibit-bold', text: 'Cancelado' }
    default: return { class: base, icon: '', text: status }
  }
}

const getDeliveryBadge = (status: PurchaseDeliveryStatus) => {
  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
  switch (status) {
    case 'RECEIVED': return { class: `${base} bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/30`, icon: 'ph:package-bold', text: 'En Almacén' }
    case 'PENDING': return { class: `${base} bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30`, icon: 'ph:truck-bold', text: 'Por Recibir' }
    case 'CANCELLED': return { class: `${base} bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700`, icon: 'ph:prohibit-bold', text: 'Anulado' }
    default: return { class: base, icon: '', text: status }
  }
}
</script>