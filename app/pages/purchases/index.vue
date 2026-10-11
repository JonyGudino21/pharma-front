<template>
  <div class="space-y-6">
    <div class="page-header">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:shopping-cart-bold" class="text-primary-600" /> Órdenes de Compra
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Abastecimiento, recepción de mercancía y cuentas por pagar.</p>
      </div>

      <div class="page-actions">
        <!-- Celular: los filtros se pliegan para no ocupar toda la pantalla. -->
        <button type="button" class="btn-secondary md:hidden" :aria-expanded="showFilters" @click="showFilters = !showFilters">
          <Icon name="ph:funnel-bold" class="mr-2" /> Filtros<span v-if="hayFiltros" class="ml-1 text-primary-600">•</span>
        </button>
        <NuxtLink
          v-if="authStore.can('canManagePurchases')"
          to="/purchases/create"
          class="btn-primary"
        >
          <Icon name="ph:plus-bold" class="mr-2" /> Nueva Orden
        </NuxtLink>
      </div>
    </div>

    <div class="flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700" :class="showFilters ? 'flex' : 'hidden md:flex'">
      <div class="flex-1">
        <label for="purchaseSupplier" class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Proveedor</label>
        <select id="purchaseSupplier" v-model="store.filters.supplierId" @change="store.fetchPurchases(1)" class="input-base cursor-pointer">
          <option value="">Todos los proveedores</option>
          <!-- `options` y no `suppliers`: filtrar por un proveedor que no cabe
               en la primera página era imposible. -->
          <option v-for="sup in supplierStore.options" :key="sup.id" :value="sup.id">
            {{ sup.name }}
          </option>
        </select>
      </div>
      <div class="flex-1">
        <label for="purchaseStatus" class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Estado de Pago</label>
        <select id="purchaseStatus" v-model="store.filters.status" @change="store.fetchPurchases(1)" class="input-base cursor-pointer">
          <option value="">Todos los estados</option>
          <option v-for="(meta, key) in PURCHASE_STATUS_META" :key="key" :value="key">{{ meta.label }}</option>
        </select>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <!-- Estados (una sola vez para tabla y tarjetas) -->
      <div v-if="store.isLoading" class="px-6 py-8 text-center text-gray-500">
        <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
        Cargando historial de compras...
      </div>

      <div v-else-if="store.listError" class="px-6 py-12 text-center">
        <span class="flex flex-col gap-2 items-center justify-center w-full">
          <Icon name="ph:cloud-slash-fill" class="w-10 h-10 text-error-500" />
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.listError.mensaje }}</span>
          <span class="text-xs text-gray-500 max-w-md">Esto no significa que no haya compras: no pudimos consultarlas.</span>
          <button v-if="store.listError.reintentable" type="button" class="btn-primary mt-1" @click="store.fetchPurchases(store.pagination.page)">
            <Icon name="ph:arrow-clockwise-bold" class="mr-2" /> Reintentar
          </button>
        </span>
      </div>

      <div v-else-if="store.purchases.length === 0" class="px-6 py-12 text-center text-gray-500">
        <span class="flex flex-col sm:flex-row gap-2 items-center justify-center w-full">
          <Icon name="ph:shopping-cart-duotone" class="w-8 h-8 text-gray-400" />
          <span>{{ hayFiltros ? 'Ninguna orden coincide con los filtros.' : 'No se encontraron órdenes de compra.' }}</span>
        </span>
      </div>

      <template v-else>
        <!-- Laptop y tableta: tabla -->
        <div class="table-wrap hidden @4xl:block">
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
              <tr
                v-for="purchase in store.purchases"
                :key="purchase.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                @click="navigateTo(`/purchases/${purchase.id}`)"
              >
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
                  <span :class="statusBadgeClass(purchase.status)">
                    <Icon :name="PURCHASE_STATUS_META[purchase.status]?.icon ?? ''" class="mr-1" />
                    {{ purchaseStatusLabel(purchase.status) }}
                  </span>
                </td>

                <td class="px-6 py-4 text-center">
                  <span :class="deliveryBadgeClass(purchase.deliveryStatus)">
                    <Icon :name="DELIVERY_STATUS_META[purchase.deliveryStatus]?.icon ?? ''" class="mr-1" />
                    {{ deliveryStatusLabel(purchase.deliveryStatus) }}
                  </span>
                </td>

                <td class="px-6 py-4 text-right">
                  <NuxtLink
                    :to="`/purchases/${purchase.id}`"
                    class="inline-flex items-center justify-center p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
                    title="Ver Detalles y Operar"
                    @click.stop
                  >
                    <Icon name="ph:arrow-right-bold" class="w-5 h-5" />
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Celular: tarjetas (toda la tarjeta abre el detalle) -->
        <ul class="card-list @4xl:hidden" data-testid="purchases-cards">
          <li v-for="purchase in store.purchases" :key="purchase.id">
            <NuxtLink :to="`/purchases/${purchase.id}`" class="card-item">
              <div class="card-row">
                <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">{{ purchase.invoiceNumber }}</p>
                <p class="shrink-0 font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(purchase.total)) }}</p>
              </div>
              <div class="card-row mt-0.5">
                <p class="min-w-0 truncate text-gray-500">{{ purchase.supplier?.name || 'Desconocido' }}</p>
                <p v-if="Number(purchase.balance) > 0" class="shrink-0 text-xs font-semibold text-error-600 dark:text-error-400">Deuda {{ formatCurrency(Number(purchase.balance)) }}</p>
                <p v-else class="shrink-0 text-xs font-semibold text-success-600 dark:text-success-400">Sin deuda</p>
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <span :class="statusBadgeClass(purchase.status)">
                  <Icon :name="PURCHASE_STATUS_META[purchase.status]?.icon ?? ''" class="mr-1" />
                  {{ purchaseStatusLabel(purchase.status) }}
                </span>
                <span :class="deliveryBadgeClass(purchase.deliveryStatus)">
                  <Icon :name="DELIVERY_STATUS_META[purchase.deliveryStatus]?.icon ?? ''" class="mr-1" />
                  {{ deliveryStatusLabel(purchase.deliveryStatus) }}
                </span>
                <span class="ml-auto text-xs text-gray-500">{{ formatDate(purchase.createdAt) }}</span>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </template>

      <div v-if="store.purchases.length > 0 && !store.listError" class="px-3 pb-4 sm:px-6 bg-white dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="store.fetchPurchases" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  usePurchaseStore,
  PURCHASE_STATUS_META,
  DELIVERY_STATUS_META,
  purchaseStatusLabel,
  deliveryStatusLabel,
  type PurchaseStatus,
  type PurchaseDeliveryStatus,
} from '~/stores/purchase'
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

/** Celular: filtros plegados por omisión (en laptop siempre visibles). */
const showFilters = ref(false)
const hayFiltros = computed(() => !!store.filters.supplierId || !!store.filters.status)

onMounted(async () => {
  // Opciones del filtro y listado de compras en paralelo: son independientes y
  // encadenarlos sólo sumaba la latencia de una a la de la otra.
  await Promise.all([
    supplierStore.fetchSupplierOptions(),
    store.fetchPurchases(1),
  ])
})

// Helpers visuales para Badges (etiquetas e iconos: PURCHASE_STATUS_META / DELIVERY_STATUS_META)
const statusBadgeClass = (status: PurchaseStatus) =>
  `inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${PURCHASE_STATUS_META[status]?.tone ?? ''}`

const deliveryBadgeClass = (status: PurchaseDeliveryStatus) =>
  `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${DELIVERY_STATUS_META[status]?.tone ?? ''}`
</script>
