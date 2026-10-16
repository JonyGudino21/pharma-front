<template>
  <div class="space-y-4 sm:space-y-6">
    <div class="page-header">
      <div class="min-w-0">
        <NuxtLink to="/cash-shifts" class="mb-2 inline-flex items-center py-1 text-sm text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver a Mi Caja
        </NuxtLink>
        <h1 class="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          <Icon name="ph:list-dashes-bold" class="text-primary-600" /> Historial de Turnos
        </h1>
      </div>

      <div class="page-actions md:hidden">
        <!-- Celular: los filtros se pliegan para no ocupar toda la pantalla. -->
        <button type="button" class="btn-secondary" :aria-expanded="showFilters" @click="showFilters = !showFilters">
          <Icon name="ph:funnel-bold" class="mr-2" /> Filtros<span v-if="hayFiltros" class="ml-1 text-primary-600">•</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-3 dark:border-gray-700 dark:bg-gray-800" :class="{ 'hidden md:grid': !showFilters }">
      <div>
        <label class="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Estado</label>
        <select v-model="store.filters.status" @change="store.fetchShifts(1)" class="input-base cursor-pointer">
          <option value="">Todos los estados</option>
          <option value="OPEN">Abiertos</option>
          <option value="CLOSED">Cerrados (Cuadrados)</option>
          <option value="AUDIT_REQUIRED">Requieren Auditoría</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fecha Inicio</label>
        <input v-model="store.filters.startDate" type="date" @change="store.fetchShifts(1)" class="input-base" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fecha Fin</label>
        <input v-model="store.filters.endDate" type="date" @change="store.fetchShifts(1)" class="input-base" />
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <!-- Estados (una sola vez para tabla y tarjetas) -->
      <div v-if="store.isLoading" class="animate-pulse px-6 py-8 text-center text-gray-500">
        <Icon name="ph:spinner-gap-bold" class="mx-auto mb-2 h-8 w-8 animate-spin text-primary-500" /> Cargando historial...
      </div>
      <div v-else-if="store.listError" class="px-6 py-12 text-center" role="alert" data-testid="shifts-error">
        <span class="flex w-full flex-col items-center justify-center gap-2">
          <Icon name="ph:cloud-slash-fill" class="h-10 w-10 text-error-500" />
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.listError.mensaje }}</span>
          <span class="max-w-md text-xs text-gray-500 dark:text-gray-400">Esto no significa que no haya turnos: no pudimos consultarlos.</span>
          <button
            v-if="store.listError.reintentable"
            type="button"
            class="mt-1 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            @click="store.retryList()"
          >
            <Icon name="ph:arrow-clockwise-bold" /> Reintentar
          </button>
          <code
            v-if="store.listError.requestId"
            class="mt-1 select-all rounded bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-600 dark:bg-gray-900 dark:text-gray-300"
          >{{ store.listError.requestId }}</code>
        </span>
      </div>
      <div v-else-if="store.shifts.length === 0" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
        <div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Icon name="ph:folder-open-duotone" class="h-12 w-12 text-gray-400" />
          <span>{{ hayFiltros ? 'Ningún turno coincide con los filtros.' : 'No se encontraron turnos.' }}</span>
        </div>
      </div>

      <template v-else>
        <!-- Tableta y laptop: tabla -->
        <div class="table-wrap hidden @4xl:block">
          <table class="w-full border-collapse whitespace-nowrap text-left">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <th class="px-6 py-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Apertura / Cierre</th>
                <th class="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Inicial</th>
                <th class="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Declarado</th>
                <th class="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Diferencia</th>
                <th class="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Estado</th>
                <th class="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Auditar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="shift in store.shifts" :key="shift.id" class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-6 py-4">
                  <p class="font-bold text-gray-900 dark:text-white">{{ formatDateTime(shift.openedAt) }}</p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ shift.closedAt ? formatDateTime(shift.closedAt) : 'Aún en turno' }}</p>
                </td>
                <td class="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                  {{ formatCurrency(Number(shift.initialAmount)) }}
                </td>
                <td class="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                  {{ shift.realAmount !== null ? formatCurrency(Number(shift.realAmount)) : '--' }}
                </td>
                <td class="px-6 py-4 text-right">
                  <span v-if="shift.difference !== null" class="font-bold" :class="differenceClass(shift.difference)">
                    {{ Number(shift.difference) > 0 ? '+' : '' }}{{ formatCurrency(Number(shift.difference)) }}
                  </span>
                  <span v-else class="text-gray-400">--</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span :class="getStatusBadge(shift.status).class">
                    <Icon :name="getStatusBadge(shift.status).icon" class="mr-1" /> {{ getStatusBadge(shift.status).text }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <NuxtLink v-if="authStore.can('canViewAllShifts')" :to="`/cash-shifts/${shift.id}`" class="inline-flex rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30" title="Ver Detalles">
                    <Icon name="ph:magnifying-glass-bold" class="h-5 w-5" />
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Celular: tarjetas (todo tocable) -->
        <ul class="card-list @4xl:hidden" data-testid="shift-cards">
          <li v-for="shift in store.shifts" :key="shift.id">
            <component
              :is="authStore.can('canViewAllShifts') ? NuxtLink : 'div'"
              :to="authStore.can('canViewAllShifts') ? `/cash-shifts/${shift.id}` : undefined"
              class="card-item"
            >
              <div class="card-row">
                <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">{{ formatDateTime(shift.openedAt) }}</p>
                <span class="shrink-0" :class="getStatusBadge(shift.status).class">
                  <Icon :name="getStatusBadge(shift.status).icon" class="mr-1" /> {{ getStatusBadge(shift.status).text }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ shift.closedAt ? `Cierre: ${formatDateTime(shift.closedAt)}` : 'Aún en turno' }}</p>
              <div class="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p class="card-label">Inicial</p>
                  <p class="font-medium tabular-nums text-gray-800 dark:text-gray-200">{{ formatCurrency(Number(shift.initialAmount)) }}</p>
                </div>
                <div>
                  <p class="card-label">Declarado</p>
                  <p class="font-medium tabular-nums text-gray-800 dark:text-gray-200">{{ shift.realAmount !== null ? formatCurrency(Number(shift.realAmount)) : '--' }}</p>
                </div>
                <div class="text-right">
                  <p class="card-label">Diferencia</p>
                  <p v-if="shift.difference !== null" class="font-bold tabular-nums" :class="differenceClass(shift.difference)">
                    {{ Number(shift.difference) > 0 ? '+' : '' }}{{ formatCurrency(Number(shift.difference)) }}
                  </p>
                  <p v-else class="text-gray-400">--</p>
                </div>
              </div>
            </component>
          </li>
        </ul>
      </template>

      <div v-if="store.shifts.length > 0 && !store.listError" class="bg-white px-3 pb-4 sm:px-6 dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="store.fetchShifts" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// La pantalla no tenía permiso de ruta: sólo se ocultaba el enlace. El backend
// ya filtra los turnos de cajeros y farmacéuticos a los propios, pero esta
// vista (con acceso al detalle de cada turno) es gerencial.
definePageMeta({ requiredPermission: 'canViewAllShifts' })

import { computed, onMounted, ref } from 'vue'
import { NuxtLink } from '#components'
import { useCashShiftStore, SHIFT_STATUS_LABEL, type ShiftStatus } from '~/stores/cashShift'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import Pagination from '~/components/shared/Pagination.vue'

const store = useCashShiftStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()
/** Celular: filtros plegados por omisión (en laptop siempre visibles). */
const showFilters = ref(false)
const hayFiltros = computed(() => Object.values(store.filters).some((v) => v !== ''))

onMounted(() => { store.fetchShifts(1) })

const differenceClass = (d: string | number) =>
  Number(d) < 0 ? 'text-error-600 dark:text-error-400' : Number(d) > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-400'

const getStatusBadge = (status: ShiftStatus) => {
  const base = "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
  switch (status) {
    case 'OPEN': return { class: `${base} bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400`, icon: 'ph:lock-key-open-bold', text: 'Abierto' }
    case 'CLOSED': return { class: `${base} bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400`, icon: 'ph:check-circle-bold', text: 'Cerrado' }
    case 'AUDIT_REQUIRED': return { class: `${base} bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400`, icon: 'ph:warning-circle-bold', text: 'Auditoría' }
    default: return { class: `${base} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200`, icon: 'ph:question-bold', text: SHIFT_STATUS_LABEL[status] ?? 'Desconocido' }
  }
}
</script>
