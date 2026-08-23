<template>
  <div class="space-y-6" v-if="shift">
    
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <NuxtLink to="/cash-shifts/history" class="text-sm text-gray-500 hover:text-primary-600 flex items-center mb-2 transition-colors">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver al historial
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Turno de Caja #{{ shift.id }}
        </h1>
        <p class="text-sm text-gray-500 flex items-center mt-1">
          <Icon name="ph:user-bold" class="mr-1" /> {{ shift.user?.firstName }} {{ shift.user?.lastName }} (@{{ shift.user?.userName }})
        </p>
      </div>

      <div class="text-right">
        <span class="px-4 py-2 rounded-xl text-sm font-bold border" :class="[
          shift.status === 'CLOSED' ? 'bg-success-50 text-success-700 border-success-200' :
          shift.status === 'AUDIT_REQUIRED' ? 'bg-error-50 text-error-700 border-error-200' :
          'bg-blue-50 text-blue-700 border-blue-200'
        ]">
          ESTADO: {{ shift.status }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">Monto Inicial</p>
        <p class="text-xl font-black text-gray-900 dark:text-white">{{ formatCurrency(Number(shift.initialAmount)) }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">El Sistema Esperaba</p>
        <p class="text-xl font-black text-gray-900 dark:text-white">{{ shift.expectedAmount !== null ? formatCurrency(Number(shift.expectedAmount)) : '--' }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <p class="text-xs text-gray-500 uppercase font-bold mb-1">El Cajero Declaró</p>
        <p class="text-xl font-black text-gray-900 dark:text-white">{{ shift.realAmount !== null ? formatCurrency(Number(shift.realAmount)) : '--' }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm" :class="Number(shift.difference) < 0 ? 'border-2 border-error-500 bg-error-50 dark:bg-error-900/10' : Number(shift.difference) > 0 ? 'border-2 border-warning-500 bg-warning-50 dark:bg-warning-900/10' : 'border border-gray-100 dark:border-gray-700'">
        <p class="text-xs uppercase font-bold mb-1" :class="Number(shift.difference) < 0 ? 'text-error-700' : Number(shift.difference) > 0 ? 'text-warning-700' : 'text-gray-500'">Diferencia</p>
        <p class="text-xl font-black" :class="Number(shift.difference) < 0 ? 'text-error-700' : Number(shift.difference) > 0 ? 'text-warning-700' : 'text-gray-900 dark:text-white'">
          <span v-if="shift.difference !== null">{{ Number(shift.difference) > 0 ? '+' : '' }}{{ formatCurrency(Number(shift.difference)) }}</span>
          <span v-else>--</span>
        </p>
      </div>
    </div>

    <div v-if="shift.notes" class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm">
      <span class="font-bold"><Icon name="ph:note-pencil-bold" class="inline" /> Notas del Turno:</span> {{ shift.notes }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="ph:hand-coins-bold" /> Transacciones Manuales ({{ shift.transactions?.length || 0 }})
        </h2>
        <div class="overflow-y-auto max-h-96">
          <div v-if="shift.transactions?.length === 0" class="text-sm text-gray-500 italic py-4 text-center">No hubo operaciones manuales.</div>
          <div v-else class="space-y-3">
            <div v-for="t in shift.transactions" :key="t.id" class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <p class="text-xs font-bold text-gray-500 uppercase">{{ t.type }}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">"{{ t.reason }}"</p>
              </div>
              <p class="font-black" :class="['SALE_INCOME', 'MANUAL_ADD', 'CREDIT_PAYMENT'].includes(t.type) ? 'text-success-600' : 'text-error-600'">
                {{ ['SALE_INCOME', 'MANUAL_ADD', 'CREDIT_PAYMENT'].includes(t.type) ? '+' : '-' }}{{ formatCurrency(Number(t.amount)) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="ph:receipt-bold" /> Ventas Registradas ({{ shift.sales?.length || 0 }})
        </h2>
        <div class="overflow-y-auto max-h-96">
          <div v-if="shift.sales?.length === 0" class="text-sm text-gray-500 italic py-4 text-center">No hubo ventas.</div>
          <div v-else class="space-y-3">
            <div v-for="sale in shift.sales" :key="sale.id" class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <p class="text-sm font-bold text-gray-900 dark:text-white">Venta #{{ sale.id }}</p>
                <p class="text-xs text-gray-500 flex items-center"><Icon name="ph:clock-bold" class="mr-1" /> {{ formatDateTime(sale.createdAt) }}</p>
              </div>
              <div class="text-right">
                <p class="font-black text-primary-600">{{ formatCurrency(Number(sale.total)) }}</p>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase" :class="sale.status === 'COMPLETED' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'">
                  {{ sale.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
  <div v-else class="min-h-screen flex items-center justify-center">
    <Icon name="ph:spinner-gap-bold" class="w-10 h-10 animate-spin text-primary-600" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from '#app'
import { useCashShiftStore, type CashShift } from '~/stores/cashShift'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'

definePageMeta({ requiredPermission: 'canViewAllShifts' })

const route = useRoute()
const store = useCashShiftStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()

const shift = ref<CashShift | null>(null)

onMounted(async () => {
  const id = Number(route.params.id)
  shift.value = await store.fetchShiftById(id)
})
</script>