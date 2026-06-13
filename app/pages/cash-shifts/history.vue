<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div>
        <NuxtLink to="/cash-shifts" class="text-sm text-gray-500 hover:text-primary-600 flex items-center mb-2 transition-colors">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver a Mi Caja
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:list-dashes-bold" class="text-primary-600" /> Historial de Turnos
        </h1>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="flex-1">
        <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Estado</label>
        <select v-model="store.filters.status" @change="store.fetchShifts(1)" class="input-base cursor-pointer">
          <option value="">Todos los estados</option>
          <option value="OPEN">Abiertos</option>
          <option value="CLOSED">Cerrados (Cuadrados)</option>
          <option value="AUDIT_REQUIRED">Requieren Auditoría</option>
        </select>
      </div>
      <div class="flex-1">
        <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fecha Inicio</label>
        <input v-model="store.filters.startDate" type="date" @change="store.fetchShifts(1)" class="input-base" />
      </div>
      <div class="flex-1">
        <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fecha Fin</label>
        <input v-model="store.filters.endDate" type="date" @change="store.fetchShifts(1)" class="input-base" />
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Apertura / Cierre</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Inicial</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Declarado</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Diferencia</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Estado</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Auditar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="store.isLoading" class="animate-pulse">
              <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" /> Cargando historial...
              </td>
            </tr>
            <tr v-else-if="store.shifts.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                <div class="flex items-center justify-center gap-3">
                  <Icon name="ph:folder-open-duotone" class="w-12 h-12 text-gray-400" />
                  <span>No se encontraron turnos.</span>
                </div>
              </td>
            </tr>
            <tr v-else v-for="shift in store.shifts" :key="shift.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-gray-900 dark:text-white">{{ formatDateTime(shift.openedAt) }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ shift.closedAt ? formatDateTime(shift.closedAt) : 'Aún en turno' }}</p>
              </td>
              <td class="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(Number(shift.initialAmount)) }}
              </td>
              <td class="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                {{ shift.realAmount !== null ? formatCurrency(Number(shift.realAmount)) : '--' }}
              </td>
              <td class="px-6 py-4 text-right">
                <span v-if="shift.difference !== null" class="font-bold" :class="Number(shift.difference) < 0 ? 'text-error-600' : Number(shift.difference) > 0 ? 'text-warning-600' : 'text-success-600'">
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
                <NuxtLink v-if="authStore.can('canViewAllShifts')" :to="`/cash-shifts/${shift.id}`" class="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg inline-flex" title="Ver Detalles">
                  <Icon name="ph:magnifying-glass-bold" class="w-5 h-5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="store.shifts.length > 0" class="px-6 pb-4 bg-white dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="store.fetchShifts" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCashShiftStore, type ShiftStatus } from '~/stores/cashShift'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import Pagination from '~/components/shared/Pagination.vue'

const store = useCashShiftStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()

onMounted(() => { store.fetchShifts(1) })

const getStatusBadge = (status: ShiftStatus) => {
  const base = "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
  switch (status) {
    case 'OPEN': return { class: `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`, icon: 'ph:lock-key-open-bold', text: 'Abierto' }
    case 'CLOSED': return { class: `${base} bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400`, icon: 'ph:check-circle-bold', text: 'Cerrado' }
    case 'AUDIT_REQUIRED': return { class: `${base} bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400`, icon: 'ph:warning-circle-bold', text: 'Auditoría' }
    default: return { class: base, icon: '', text: status }
  }
}
</script>