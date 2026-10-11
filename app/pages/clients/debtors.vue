<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:gap-6">

      <div class="flex min-w-0 flex-1 flex-col justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
        <NuxtLink to="/clients" class="mb-2 flex w-fit items-center py-1 text-sm text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver a Clientes
        </NuxtLink>
        <h1 class="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          <Icon name="ph:warning-circle-bold" class="shrink-0 text-error-600" /> Cuentas por Cobrar
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestión de cartera vencida y deudores.</p>
      </div>

      <div class="rounded-2xl bg-linear-to-br from-error-500 to-error-600 p-4 text-white shadow-lg sm:p-6 lg:min-w-[350px]">
        <div class="mb-2 flex items-center justify-between">
          <p class="text-sm font-bold uppercase tracking-wider opacity-90">Deuda Global en Calle</p>
          <Icon name="ph:chart-line-down-bold" class="h-8 w-8 opacity-50" />
        </div>
        <p class="break-words text-3xl font-black sm:text-4xl">{{ formatCurrency(Number(store.totalCompanyDebt)) }}</p>
        <p class="mt-2 text-sm font-medium opacity-80">{{ store.debtorsPagination.total }} clientes con saldo pendiente</p>
      </div>

    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
        <h2 class="font-bold text-gray-900 dark:text-white">Lista de Deudores (Ordenados por monto)</h2>
      </div>

      <!-- Estados (una sola vez para tabla y tarjetas) -->
      <div v-if="store.isLoading" class="px-6 py-8 text-center text-gray-500">
        <Icon name="ph:spinner-gap-bold" class="mx-auto mb-2 h-8 w-8 animate-spin text-primary-500" />
        Cargando deudores...
      </div>
      <div v-else-if="store.debtors.length === 0" class="px-6 py-12 text-center text-gray-500">
        <Icon name="ph:check-circle-duotone" class="mx-auto mb-3 h-12 w-12 text-success-500" />
        <p class="font-bold text-gray-900 dark:text-white">¡Cartera limpia!</p>
        <p>Nadie le debe dinero a la farmacia en este momento.</p>
      </div>

      <template v-else>
        <!-- Laptop y tableta: tabla -->
        <div class="table-wrap hidden @4xl:block">
          <table class="w-full border-collapse whitespace-nowrap text-left">
            <thead>
              <tr class="bg-gray-50/50 text-xs uppercase text-gray-500 dark:bg-gray-800/50">
                <th class="px-4 lg:px-6 py-4">Cliente / Contacto</th>
                <th class="px-4 lg:px-6 py-4 text-center">Límite Otorgado</th>
                <th class="hidden lg:table-cell px-4 lg:px-6 py-4 text-center">Última Venta</th>
                <th class="px-4 lg:px-6 py-4 text-right">Deuda Actual</th>
                <th class="px-4 lg:px-6 py-4 text-right">Acciones (Cobranza)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="debtor in store.debtors" :key="debtor.id" class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-4 lg:px-6 py-4">
                  <p class="font-bold text-gray-900 dark:text-white">{{ debtor.name }}</p>
                  <p class="mt-1 flex items-center text-xs text-gray-500"><Icon name="ph:phone" class="mr-1" /> {{ debtor.phone || 'Sin teléfono' }}</p>
                </td>
                <td class="px-4 lg:px-6 py-4 text-center">
                  <span class="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {{ formatCurrency(Number(debtor.creditLimit)) }}
                  </span>
                  <p v-if="limiteExcedido(debtor)" class="mt-1 text-[10px] font-bold uppercase text-error-600 dark:text-error-400">¡Límite Excedido!</p>
                </td>
                <td class="hidden lg:table-cell px-4 lg:px-6 py-4 text-center">
                  <span v-if="debtor.sales.length > 0" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ formatDateTime(debtor.sales[0]?.createdAt || 'No hay ventas') }}
                  </span>
                  <span v-else class="text-gray-400">--</span>
                </td>
                <td class="px-4 lg:px-6 py-4 text-right">
                  <p class="text-lg font-black text-error-600 dark:text-error-400">{{ formatCurrency(Number(debtor.currentDebt)) }}</p>
                </td>
                <td class="px-4 lg:px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button v-if="authStore.can('canUpdateCreditConfig')" class="rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30" title="Configurar Crédito" @click="openCreditConfig(debtor)">
                      <Icon name="ph:identification-card-bold" class="h-5 w-5" />
                    </button>
                    <NuxtLink v-if="authStore.can('canViewAccountStatement')" :to="`/clients/${debtor.id}`" class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" title="Ver Estado de Cuenta">
                      <Icon name="ph:receipt-bold" class="h-5 w-5" />
                    </NuxtLink>
                    <button v-if="authStore.can('canRegisterClientPayment')" class="flex items-center rounded-lg bg-success-50 px-3 py-1.5 text-sm font-bold text-success-700 transition-colors hover:bg-success-100 dark:bg-success-900/30 dark:text-success-400 dark:hover:bg-success-900/50" @click="openPaymentModal(debtor)">
                      <Icon name="ph:money-bold" class="mr-1.5" /> Cobrar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Celular: tarjetas -->
        <ul class="card-list @4xl:hidden" data-testid="debtors-cards">
          <li v-for="debtor in store.debtors" :key="debtor.id" class="px-4 py-3">
            <div class="card-row">
              <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">{{ debtor.name }}</p>
              <p class="shrink-0 font-black tabular-nums text-error-600 dark:text-error-400">{{ formatCurrency(Number(debtor.currentDebt)) }}</p>
            </div>
            <div class="card-row mt-0.5">
              <p class="min-w-0 truncate text-gray-500 dark:text-gray-400">
                <Icon name="ph:phone" class="mr-1 align-[-2px]" />{{ debtor.phone || 'Sin teléfono' }}
              </p>
              <p class="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                Límite {{ formatCurrency(Number(debtor.creditLimit)) }}
              </p>
            </div>
            <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span v-if="limiteExcedido(debtor)" class="text-[11px] font-bold uppercase text-error-600 dark:text-error-400">¡Límite Excedido!</span>
              <span class="card-label ml-auto">
                Última venta: {{ debtor.sales.length > 0 ? formatDateTime(debtor.sales[0]?.createdAt || '') : '--' }}
              </span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button v-if="authStore.can('canRegisterClientPayment')" class="flex min-h-10 flex-1 items-center justify-center rounded-lg bg-success-50 px-3 text-sm font-bold text-success-700 hover:bg-success-100 dark:bg-success-900/30 dark:text-success-400 dark:hover:bg-success-900/50" @click="openPaymentModal(debtor)">
                <Icon name="ph:money-bold" class="mr-1.5" /> Cobrar
              </button>
              <NuxtLink v-if="authStore.can('canViewAccountStatement')" :to="`/clients/${debtor.id}`" class="flex min-h-10 flex-1 items-center justify-center rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                <Icon name="ph:receipt-bold" class="mr-1.5" /> Estado de cuenta
              </NuxtLink>
              <button v-if="authStore.can('canUpdateCreditConfig')" class="flex min-h-10 items-center justify-center rounded-lg bg-primary-50 p-2 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50" title="Configurar Crédito" aria-label="Configurar Crédito" @click="openCreditConfig(debtor)">
                <Icon name="ph:identification-card-bold" class="h-5 w-5" />
              </button>
            </div>
          </li>
        </ul>
      </template>

      <div v-if="store.debtors.length > 0" class="bg-white px-3 pb-4 sm:px-6 dark:bg-gray-800">
        <Pagination :pagination="store.debtorsPagination" @page-change="store.fetchDebtors" />
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
import { useAuthStore } from '~/stores/auth'

definePageMeta({ requiredPermission: 'canViewDebtors' })

const store = useClientStore()
// Cada acción con su permiso: entrar a Deudores no implica poder cambiar el
// límite de crédito (el backend también lo exige; aquí se evita ofrecer un
// botón que sólo puede terminar en 403).
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()

const showCreditModal = ref(false)
const showPaymentModal = ref(false)
const selectedDebtor = ref<Debtor | null>(null)

const limiteExcedido = (debtor: Debtor) => Number(debtor.currentDebt) > Number(debtor.creditLimit)

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
  store.fetchDebtors(store.debtorsPagination.page)
}
</script>
