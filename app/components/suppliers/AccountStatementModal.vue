<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      
      <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="ph:receipt-bold" class="text-primary-600" />
            Estado de Cuenta
          </h2>
          <p class="text-sm text-gray-500 mt-1">{{ statement?.supplier.name }}</p>
        </div>
        <button @click="close" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900/20">
        
        <div v-if="isLoading" class="py-12 text-center text-gray-500">
          <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2" /> Cargando estado de cuenta...
        </div>

        <div v-else-if="statement">
          <div class="bg-linear-to-br from-error-500 to-error-600 rounded-2xl p-6 text-white shadow-lg mb-6">
            <p class="text-sm font-bold opacity-90 uppercase tracking-wider mb-1">Deuda Pendiente</p>
            <p class="text-4xl font-black">{{ formatCurrency(Number(statement.supplier.currentBalance)) }}</p>
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
              <div>
                <p class="font-bold text-gray-900 dark:text-white">Factura: {{ invoice.invoiceNumber }}</p>
                <p class="text-xs text-gray-500 flex items-center mt-1">
                  <Icon name="ph:calendar-blank" class="mr-1" /> {{ formatDate(invoice.createdAt) }}
                </p>
              </div>
              
              <div class="flex items-center gap-4 text-sm text-right">
                <div>
                  <p class="text-gray-500 text-xs uppercase tracking-wide">Total</p>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(Number(invoice.total)) }}</p>
                </div>
                <div class="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                <div>
                  <p class="text-gray-500 text-xs uppercase tracking-wide">Pagado</p>
                  <p class="font-semibold text-success-600">{{ formatCurrency(Number(invoice.paidAmount)) }}</p>
                </div>
                <div class="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                <div>
                  <p class="text-gray-500 text-xs uppercase tracking-wide">Saldo</p>
                  <p class="font-black text-error-600">{{ formatCurrency(Number(invoice.balance)) }}</p>
                </div>
              </div>

              <div class="shrink-0 text-center sm:text-right">
                <span v-if="invoice.status === 'PARTIAL'" class="inline-flex px-2 py-1 bg-warning-100 text-warning-700 rounded text-xs font-bold">PAGO PARCIAL</span>
                <span v-else class="inline-flex px-2 py-1 bg-error-100 text-error-700 rounded text-xs font-bold">PENDIENTE</span>
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
import type { Supplier, AccountStatement } from '~/stores/supplier'

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

const close = () => emit('update:modelValue', false)
</script>