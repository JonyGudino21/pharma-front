<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:hourglass-bold" class="text-primary-600" /> Alertas de caducidad
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Lotes vigentes y vencidos. Semáforo: rojo &lt; 30 días, amarillo 30–60, verde &gt; 60.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="option in [30, 60, 90]"
          :key="option"
          class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
          :class="days === option
            ? 'bg-primary-600 text-white border-primary-600'
            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
          @click="changeDays(option)"
        >
          {{ option }} días
        </button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div v-if="inventoryStore.isLoadingExpiring" class="py-16 text-center text-gray-400">
        <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto" />
      </div>
      <div v-else-if="inventoryStore.expiring.length === 0" class="py-16 text-center text-gray-400">
        No hay lotes por caducar en este horizonte.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left whitespace-nowrap">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
              <th class="px-4 py-3">Producto</th>
              <th class="px-4 py-3">Lote</th>
              <th class="px-4 py-3">Caducidad</th>
              <th class="px-4 py-3 text-center">Días</th>
              <th class="px-4 py-3 text-center">Cant.</th>
              <th class="px-4 py-3">Estado</th>
              <th v-if="authStore.can('canAdjustInventory')" class="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="batch in inventoryStore.expiring" :key="batch.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="px-4 py-3">
                <p class="font-bold text-sm text-gray-900 dark:text-white">{{ batch.product.name }}</p>
                <p class="text-xs font-mono text-gray-500">{{ batch.product.sku }}</p>
              </td>
              <td class="px-4 py-3 font-mono text-sm">{{ batch.lotNumber }}</td>
              <td class="px-4 py-3 text-sm">{{ formatDate(batch.expiryDate) }}</td>
              <td class="px-4 py-3 text-center font-bold tabular-nums">{{ batch.daysLeft }}</td>
              <td class="px-4 py-3 text-center font-bold">{{ batch.quantity }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold" :class="lightClass(batch.status)">
                  <span class="w-2 h-2 rounded-full" :class="dotClass(batch.status)"></span>
                  {{ lightLabel(batch.status) }}
                </span>
              </td>
              <td v-if="authStore.can('canAdjustInventory')" class="px-4 py-3 text-right">
                <button
                  class="text-sm font-bold text-error-600 hover:text-error-700"
                  @click="openDestroy(batch)"
                >
                  Merma
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 pb-4">
        <Pagination :pagination="inventoryStore.expiringPagination" @page-change="goToPage" />
      </div>
    </div>

    <DestroyBatchModal
      v-model="showDestroy"
      :batch="selectedBatch"
      @success="reload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInventoryStore, type ExpiringBatch, type ExpiryStatus } from '~/stores/inventory'
import { useAuthStore } from '~/stores/auth'
import { useDate } from '~/composables/useDate'
import Pagination from '~/components/shared/Pagination.vue'
import DestroyBatchModal from '~/components/inventory/DestroyBatchModal.vue'

definePageMeta({ requiredPermission: 'canViewExpiringBatches' })

const inventoryStore = useInventoryStore()
const authStore = useAuthStore()
const { formatDate } = useDate()

const days = ref(90)
const page = ref(1)
const showDestroy = ref(false)
const selectedBatch = ref<ExpiringBatch | null>(null)

function lightClass(status: ExpiryStatus) {
  if (status === 'EXPIRED' || status === 'CRITICAL') return 'bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-300'
  if (status === 'WARNING') return 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
  return 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300'
}

function dotClass(status: ExpiryStatus) {
  if (status === 'EXPIRED' || status === 'CRITICAL') return 'bg-error-500'
  if (status === 'WARNING') return 'bg-warning-500'
  return 'bg-success-500'
}

function lightLabel(status: ExpiryStatus) {
  if (status === 'EXPIRED') return 'Caducado'
  if (status === 'CRITICAL') return 'Crítico'
  if (status === 'WARNING') return 'Próximo'
  return 'Vigente'
}

function reload() {
  inventoryStore.fetchExpiring({ days: days.value, page: page.value })
}

function changeDays(value: number) {
  days.value = value
  page.value = 1
  reload()
}

function goToPage(next: number) {
  page.value = next
  reload()
}

function openDestroy(batch: ExpiringBatch) {
  selectedBatch.value = batch
  showDestroy.value = true
}

onMounted(reload)
</script>
