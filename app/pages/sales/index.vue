<template>
  <div class="space-y-6">
    <div class="page-header">
      <div class="min-w-0">
        <h1 class="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          <Icon name="ph:receipt-bold" class="text-primary-600" /> Historial de Ventas
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Consulta de tickets, devoluciones y anulaciones.
        </p>
      </div>

      <div class="page-actions">
        <!-- Celular: los filtros se pliegan para no ocupar toda la pantalla. -->
        <button type="button" class="btn-secondary md:hidden" :aria-expanded="showFilters" @click="showFilters = !showFilters">
          <Icon name="ph:funnel-bold" class="mr-2" /> Filtros<span v-if="hayFiltros" class="ml-1 text-primary-600">•</span>
        </button>
        <NuxtLink v-if="authStore.can('canSell')" to="/pos" class="btn-primary">
          <Icon name="ph:plus-bold" class="mr-2" /> Nueva Venta
        </NuxtLink>
      </div>
    </div>

    <div class="space-y-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800" :class="{ 'hidden md:block': !showFilters }">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Folio</label>
          <div class="relative">
            <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="store.filters.invoiceNumber"
              type="text"
              placeholder="Ej: FAC-2025..."
              class="input-base pl-10"
              @keyup.enter="buscar"
            />
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Desde</label>
          <input v-model="store.filters.startDate" type="date" class="input-base" @change="buscar" />
        </div>

        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Hasta</label>
          <input v-model="store.filters.endDate" type="date" class="input-base" @change="buscar" />
        </div>

        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Estado de la venta</label>
          <select v-model="store.filters.status" class="input-base cursor-pointer" @change="buscar">
            <option value="">Todos</option>
            <option value="COMPLETED">Completada</option>
            <option value="PARTIAL">Parcial</option>
            <option value="PENDING">Pendiente</option>
            <option value="REFUNDED">Devuelta por completo</option>
            <option value="CANCELLED">Anulada</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Etapa</label>
          <select v-model="store.filters.flowStatus" class="input-base cursor-pointer" @change="buscar">
            <option value="">Cerradas (sin borradores)</option>
            <option value="COMPLETED">Cerrada</option>
            <option value="DRAFT">Borrador en mostrador</option>
            <option value="CANCELLED">Anulada</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Cobro</label>
          <select v-model="store.filters.paymentStatus" class="input-base cursor-pointer" @change="buscar">
            <option value="">Todos</option>
            <option value="PAID">Pagada</option>
            <option value="PARTIAL">Parcial</option>
            <option value="PENDING">Sin pagar</option>
          </select>
        </div>

        <div class="flex items-end gap-2 xl:col-span-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          <button class="btn-primary" @click="buscar">
            <Icon name="ph:funnel-bold" class="mr-2" /> Aplicar
          </button>
          <button v-if="hayFiltros" class="btn-secondary" @click="limpiar">
            <Icon name="ph:x-bold" class="mr-2" /> Limpiar
          </button>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <!-- Estados (una sola vez para tabla y tarjetas) -->
            <div v-if="store.listLoading" class="animate-pulse">
              <div class="px-6 py-8 text-center text-gray-500">
                <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
                Cargando historial de ventas...
              </div>
            </div>
            <div v-else-if="store.listError">
              <div class="px-6 py-12 text-center">
                <span class="flex flex-col gap-2 items-center justify-center w-full">
                  <Icon name="ph:cloud-slash-fill" class="w-10 h-10 text-error-500" />
                  <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {{ store.listError.mensaje }}
                  </span>
                  <span class="text-xs text-gray-500 max-w-md">
                    Esto no significa que no haya ventas: no pudimos consultarlas.
                  </span>
                  <button
                    v-if="store.listError.reintentable"
                    type="button"
                    class="mt-1 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    @click="store.retryList()"
                  >
                    <Icon name="ph:arrow-clockwise-bold" />
                    Reintentar
                  </button>
                  <code
                    v-if="store.listError.requestId"
                    class="mt-1 rounded bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-600 select-all dark:bg-gray-900 dark:text-gray-300"
                  >
                    {{ store.listError.requestId }}
                  </code>
                </span>
              </div>
            </div>
            <div v-else-if="store.sales.length === 0">
              <div class="px-6 py-12 text-center text-gray-500">
                <span class="flex flex-col gap-2 items-center justify-center w-full">
                  <Icon name="ph:receipt-duotone" class="w-10 h-10 text-gray-400" />
                  <span>{{ hayFiltros ? 'Ninguna venta coincide con los filtros.' : 'Todavía no hay ventas registradas.' }}</span>
                </span>
              </div>
            </div>

      <template v-else>
      <!-- Laptop y tableta: tabla -->
      <div class="table-wrap hidden @4xl:block">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase">Folio / Cliente</th>
              <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
              <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase">Vendió</th>
              <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Importes</th>
              <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Estado</th>
              <th class="px-4 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Detalle</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="venta in store.sales"
              :key="venta.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              @click="navigateTo(`/sales/${venta.id}`)"
            >
              <td class="px-4 py-4">
                <p class="font-bold text-gray-900 dark:text-white">
                  {{ venta.invoiceNumber || `Sin folio (#${venta.id})` }}
                </p>
                <p class="text-sm text-gray-500 flex items-center mt-1">
                  <Icon name="ph:user" class="mr-1" /> {{ venta.client?.name || 'Público General' }}
                </p>
              </td>

              <td class="px-4 py-4">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ formatDateTime(venta.createdAt) }}
                </p>
              </td>

              <td class="px-4 py-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ venta.user ? `${venta.user.firstName} ${venta.user.lastName}` : '—' }}
                </p>
              </td>

              <td class="px-4 py-4 text-right">
                <p class="text-sm font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(Number(venta.total)) }}
                </p>
                <p
                  v-if="Number(venta.balance) > 0"
                  class="text-xs font-semibold text-error-600 dark:text-error-400 mt-1"
                >
                  Debe: {{ formatCurrency(Number(venta.balance)) }}
                </p>
                <p v-else class="text-xs font-semibold text-success-600 dark:text-success-400 mt-1">
                  Liquidada
                </p>
              </td>

              <td class="px-4 py-4 text-center">
                <div class="flex flex-col items-center gap-1.5">
                  <span :class="badgeEstado(venta.status).class">
                    <Icon :name="badgeEstado(venta.status).icon" class="mr-1" />
                    {{ badgeEstado(venta.status).text }}
                  </span>

                  <span
                    v-if="venta._count && venta._count.saleReturn > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/30"
                  >
                    <Icon name="ph:arrow-u-up-left-bold" class="mr-1" />
                    {{ venta._count.saleReturn }} devolución{{ venta._count.saleReturn > 1 ? 'es' : '' }}
                  </span>

                  <span
                    v-if="venta.flowStatus === 'DRAFT'"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30"
                  >
                    <Icon name="ph:hourglass-bold" class="mr-1" /> En mostrador
                  </span>
                </div>
              </td>

              <td class="px-4 py-4 text-right">
                <NuxtLink
                  :to="`/sales/${venta.id}`"
                  class="inline-flex items-center justify-center p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                  title="Ver detalle del ticket"
                >
                  <Icon name="ph:arrow-right-bold" class="w-5 h-5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Celular: tarjetas (lo esencial de cada venta, todo tocable) -->
      <ul class="card-list @4xl:hidden" data-testid="sales-cards">
        <li v-for="venta in store.sales" :key="venta.id">
          <NuxtLink :to="`/sales/${venta.id}`" class="card-item">
            <div class="card-row">
              <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">{{ venta.invoiceNumber || `Sin folio (#${venta.id})` }}</p>
              <p class="shrink-0 font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(venta.total)) }}</p>
            </div>
            <div class="card-row mt-0.5">
              <p class="min-w-0 truncate text-gray-500">{{ venta.client?.name || 'Público General' }}</p>
              <p v-if="Number(venta.balance) > 0" class="shrink-0 text-xs font-semibold text-error-600 dark:text-error-400">Debe {{ formatCurrency(Number(venta.balance)) }}</p>
              <p v-else class="shrink-0 text-xs font-semibold text-success-600 dark:text-success-400">Liquidada</p>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span :class="badgeEstado(venta.status).class">
                <Icon :name="badgeEstado(venta.status).icon" class="mr-1" />
                {{ badgeEstado(venta.status).text }}
              </span>
              <span v-if="venta._count && venta._count.saleReturn > 0" class="inline-flex items-center rounded-full border border-warning-200 bg-warning-50 px-2 py-0.5 text-[11px] font-bold text-warning-700 dark:border-warning-800/30 dark:bg-warning-900/20 dark:text-warning-400">
                <Icon name="ph:arrow-u-up-left-bold" class="mr-1" /> {{ venta._count.saleReturn }} dev.
              </span>
              <span v-if="venta.flowStatus === 'DRAFT'" class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-400">
                <Icon name="ph:hourglass-bold" class="mr-1" /> En mostrador
              </span>
              <span class="ml-auto text-xs text-gray-500">{{ formatDateTime(venta.createdAt) }}</span>
            </div>
          </NuxtLink>
        </li>
      </ul>
      </template>

      <div v-if="store.sales.length > 0" class="bg-white px-3 pb-4 sm:px-6 dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="store.fetchSales" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSalesHistoryStore } from '~/stores/salesHistory'
import type { Sale } from '~/stores/sales'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import Pagination from '~/components/shared/Pagination.vue'

definePageMeta({ requiredPermission: 'canViewSalesHistory' })

const store = useSalesHistoryStore()
/** Celular: filtros plegados por omisión (en laptop siempre visibles). */
const showFilters = ref(false)
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()

const hayFiltros = computed(() => Object.values(store.filters).some((v) => v !== ''))

const buscar = () => store.fetchSales(1)

const limpiar = () => {
  store.resetFilters()
  store.fetchSales(1)
}

onMounted(() => store.fetchSales(1))

const badgeEstado = (status: Sale['status']) => {
  const base = 'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider'
  switch (status) {
    case 'COMPLETED':
      return { class: `${base} bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400`, icon: 'ph:check-circle-bold', text: 'Completada' }
    case 'PARTIAL':
      return { class: `${base} bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400`, icon: 'ph:clock-countdown-bold', text: 'Parcial' }
    case 'PENDING':
      return { class: `${base} bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400`, icon: 'ph:warning-circle-bold', text: 'Pendiente' }
    case 'REFUNDED':
      return { class: `${base} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400`, icon: 'ph:arrow-u-up-left-bold', text: 'Devuelta' }
    case 'CANCELLED':
      return { class: `${base} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400`, icon: 'ph:prohibit-bold', text: 'Anulada' }
    default:
      return { class: base, icon: '', text: status }
  }
}
</script>
