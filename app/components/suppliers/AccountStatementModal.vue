<template>
  <div v-if="modelValue" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Estado de Cuenta" @keydown.esc="close">
    <div class="modal-panel sm:max-w-4xl">

      <div class="modal-header">
        <div class="min-w-0">
          <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="ph:receipt-bold" class="text-primary-600" />
            Estado de Cuenta
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{{ statement?.supplier.name ?? supplier?.name }}</p>
        </div>
        <button type="button" aria-label="Cerrar" @click="close" class="-mr-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <div class="modal-body bg-gray-50 dark:bg-gray-900/20">

        <div v-if="isLoading" class="py-12 text-center text-gray-500">
          <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2" /> Cargando estado de cuenta...
        </div>

        <div v-else-if="statement">
          <div class="bg-linear-to-br from-error-500 to-error-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg mb-6">
            <p class="text-sm font-bold opacity-90 uppercase tracking-wider mb-1">Deuda Pendiente</p>
            <p class="text-3xl sm:text-4xl font-black break-words">{{ formatCurrency(Number(statement.supplier.currentBalance)) }}</p>
            <p class="text-sm mt-2 font-medium opacity-80">
              <Icon name="ph:calendar-blank-bold" class="inline mb-0.5" /> Días de Crédito: {{ statement.supplier.creditDays }}
            </p>
          </div>

          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Facturas Pendientes de Pago</h3>

          <div v-if="statement.pendingInvoices.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <Icon name="ph:check-circle-duotone" class="w-16 h-16 text-success-500 mx-auto mb-3" />
            <p class="text-gray-900 dark:text-white font-semibold">¡Al día!</p>
            <p class="text-gray-500 text-sm">No hay compras pendientes de pago con este proveedor.</p>
          </div>

          <div v-else class="space-y-3">
            <div 
              v-for="invoice in statement.pendingInvoices" :key="invoice.id"
              class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div class="flex items-start justify-between gap-3 sm:block min-w-0">
                <div class="min-w-0">
                  <p class="font-bold text-gray-900 dark:text-white break-words">Factura: {{ invoice.invoiceNumber }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                    <Icon name="ph:calendar-blank" class="mr-1" /> {{ formatDate(invoice.createdAt) }}
                  </p>
                </div>
                <!-- Celular: el estado va junto al folio para no ocupar otra fila. -->
                <span class="sm:hidden shrink-0" :class="badgeEstado(invoice.status).class">{{ badgeEstado(invoice.status).text }}</span>
              </div>

              <div class="grid grid-cols-3 gap-2 text-sm sm:flex sm:items-center sm:gap-4 sm:text-right">
                <div class="min-w-0">
                  <p class="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Total</p>
                  <p class="font-semibold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(invoice.total)) }}</p>
                </div>
                <div class="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                <div class="min-w-0">
                  <p class="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Pagado</p>
                  <p class="font-semibold tabular-nums text-success-600 dark:text-success-400">{{ formatCurrency(Number(invoice.paidAmount)) }}</p>
                </div>
                <div class="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                <div class="min-w-0">
                  <p class="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Saldo</p>
                  <p class="font-black tabular-nums text-error-600 dark:text-error-400">{{ formatCurrency(Number(invoice.balance)) }}</p>
                </div>
              </div>

              <div class="hidden sm:block shrink-0 text-right">
                <span :class="badgeEstado(invoice.status).class">{{ badgeEstado(invoice.status).text }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSupplierStore } from '~/stores/supplier'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import type { Supplier, AccountStatement, PendingInvoice } from '~/stores/supplier'

const props = defineProps<{ modelValue: boolean, supplier: Supplier | null }>()
const emit = defineEmits(['update:modelValue'])

const store = useSupplierStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()

const isLoading = ref(false)
const statement = ref<AccountStatement | null>(null)

watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.supplier) {
    isLoading.value = true
    statement.value = await store.fetchAccountStatement(props.supplier.id)
    isLoading.value = false
  } else {
    statement.value = null
  }
})

const badgeEstado = (status: PendingInvoice['status']) => {
  const base = 'inline-flex px-2 py-1 rounded text-xs font-bold uppercase'
  return status === 'PARTIAL'
    ? { class: `${base} bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400`, text: 'Parcial' }
    : { class: `${base} bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400`, text: 'Pendiente' }
}

const close = () => emit('update:modelValue', false)
</script>