<template>
  <div class="space-y-6">
    <div class="flex flex-col lg:flex-row gap-6">
      
      <div class="flex-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
        <NuxtLink to="/clients" class="text-sm text-gray-500 hover:text-primary-600 flex items-center mb-2 transition-colors w-fit">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver a Clientes
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:warning-circle-bold" class="text-error-600" /> Cuentas por Cobrar
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de cartera vencida y deudores.</p>
      </div>

      <div class="bg-linear-to-br from-error-500 to-error-600 rounded-2xl p-6 text-white shadow-lg lg:min-w-[350px]">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-bold opacity-90 uppercase tracking-wider">Deuda Global en Calle</p>
          <Icon name="ph:chart-line-down-bold" class="w-8 h-8 opacity-50" />
        </div>
        <p class="text-4xl font-black">{{ formatCurrency(Number(store.totalCompanyDebt)) }}</p>
        <p class="text-sm mt-2 font-medium opacity-80">{{ store.pagination.total }} clientes con saldo pendiente</p>
      </div>

    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
        <h2 class="font-bold text-gray-900 dark:text-white">Lista de Deudores (Ordenados por monto)</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-gray-50/50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase">
              <th class="px-6 py-4">Cliente / Contacto</th>
              <th class="px-6 py-4 text-center">Límite Otorgado</th>
              <th class="px-6 py-4 text-center">Última Venta</th>
              <th class="px-6 py-4 text-right">Deuda Actual</th>
              <th class="px-6 py-4 text-right">Acciones (Cobranza)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="store.isLoading" class="animate-pulse">
              <td colspan="5" class="px-6 py-8 text-center text-gray-500"><Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2" /></td>
            </tr>
            <tr v-else-if="store.debtors.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                <Icon name="ph:check-circle-duotone" class="w-12 h-12 text-success-500 mx-auto mb-3" />
                <p class="font-bold text-gray-900 dark:text-white">¡Cartera limpia!</p>
                <p>Nadie le debe dinero a la farmacia en este momento.</p>
              </td>
            </tr>
            <tr v-else v-for="debtor in store.debtors" :key="debtor.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-gray-900 dark:text-white">{{ debtor.name }}</p>
                <p class="text-xs text-gray-500 flex items-center mt-1"><Icon name="ph:phone" class="mr-1" /> {{ debtor.phone || 'Sin teléfono' }}</p>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                  {{ formatCurrency(Number(debtor.creditLimit)) }}
                </span>
                <p v-if="Number(debtor.currentDebt) > Number(debtor.creditLimit)" class="text-[10px] text-error-600 font-bold uppercase mt-1">¡Límite Excedido!</p>
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="debtor.sales.length > 0" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ formatDateTime(debtor.sales[0]?.createdAt || 'No hay ventas') }}
                </span>
                <span v-else class="text-gray-400">--</span>
              </td>
              <td class="px-6 py-4 text-right">
                <p class="font-black text-error-600 dark:text-error-400 text-lg">{{ formatCurrency(Number(debtor.currentDebt)) }}</p>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openCreditConfig(debtor)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Configurar Crédito">
                    <Icon name="ph:identification-card-bold" class="w-5 h-5" />
                  </button>
                  <NuxtLink :to="`/clients/${debtor.id}`" class="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg" title="Ver Estado de Cuenta">
                    <Icon name="ph:receipt-bold" class="w-5 h-5" />
                  </NuxtLink>
                  <button @click="openPaymentModal(debtor)" class="px-3 py-1.5 bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-900/30 dark:text-success-400 dark:hover:bg-success-900/50 rounded-lg font-bold text-sm flex items-center transition-colors">
                    <Icon name="ph:money-bold" class="mr-1.5" /> Cobrar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="store.debtors.length > 0" class="px-6 pb-4 bg-white dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="store.fetchDebtors" />
      </div>
    </div>

    <CreditConfigModal v-model="showCreditModal" :client="selectedDebtor" @success="handleSuccess" />
    <ClientPaymentModal v-model="showPaymentModal" :client="selectedDebtor" @success="handleSuccess" />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useClientStore, type Debtor } from '~/stores/client'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import Pagination from '~/components/shared/Pagination.vue'
import CreditConfigModal from '~/components/clients/CreditConfigModal.vue'
import ClientPaymentModal from '~/components/clients/ClientPaymentModal.vue'

definePageMeta({ requiredPermission: 'canViewDebtors' })

const store = useClientStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()

const showCreditModal = ref(false)
const showPaymentModal = ref(false)
const selectedDebtor = ref<Debtor | null>(null)

onMounted(() => {
  store.fetchDebtors(1)
})

const openCreditConfig = (debtor: Debtor) => {
  selectedDebtor.value = debtor
  showCreditModal.value = true
}

const openPaymentModal = (debtor: Debtor) => {
  selectedDebtor.value = debtor
  showPaymentModal.value = true
}

const handleSuccess = () => {
  store.fetchDebtors(store.pagination.page)
}
</script>