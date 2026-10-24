<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReceivablesStore } from '~/stores/receivables'
import { useCurrency } from '~/composables/useCurrency'
import AgingThermometer from '~/components/credit/AgingThermometer.vue'
import CreditStatusChip from '~/components/credit/CreditStatusChip.vue'

/** Panel: lo que te deben los clientes y lo primero que hay que cobrar. */
const store = useReceivablesStore()
const { formatCurrency } = useCurrency()

onMounted(() => { void store.fetchReceivables() })

const data = computed(() => store.receivables)
/** Las 5 primeras en orden de cobro (lo vencido, lo que vence antes, lo más viejo sin fecha). */
const urgentes = computed(() => (data.value?.sales ?? []).slice(0, 5))
</script>

<template>
  <section class="flex min-w-0 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="wReceivables" data-testid="widget-receivables">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 id="wReceivables" class="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <Icon name="ph:hand-coins-bold" class="text-success-600" /> Por cobrar a clientes
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">Ventas a crédito con saldo</p>
      </div>
      <NuxtLink to="/clients/debtors" class="shrink-0 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300">Ver cobranza</NuxtLink>
    </div>

    <div v-if="store.isLoading && !data" class="mt-4 h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700/50" />
    <p v-else-if="store.loadError && !data" class="mt-4 text-sm text-gray-500">No pudimos consultar la cobranza.</p>

    <template v-else-if="data">
      <div class="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p class="text-2xl font-black tabular-nums text-gray-900 sm:text-3xl dark:text-white">{{ formatCurrency(Number(data.totals.balance)) }}</p>
        <p v-if="Number(data.totals.overdue) > 0" class="text-sm font-semibold text-error-600 dark:text-error-400">
          {{ formatCurrency(Number(data.totals.overdue)) }} vencido · {{ data.totals.overdueClients }} {{ data.totals.overdueClients === 1 ? 'cliente' : 'clientes' }}
        </p>
        <p v-else-if="data.totals.salesCount > 0" class="text-sm font-semibold text-success-600 dark:text-success-400">Nada vencido</p>
      </div>

      <p v-if="data.totals.salesCount === 0" class="mt-4 rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-900/40">Nadie te debe.</p>
      <template v-else>
        <AgingThermometer class="mt-4" :aging="data.aging" compact :interactive="false" />
        <div class="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Cobrar primero</p>
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="s in urgentes" :key="s.saleId">
              <NuxtLink :to="`/sales/${s.saleId}`" class="flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ s.clientName }}</p>
                  <p class="font-mono text-xs text-gray-500">{{ s.folio }}</p>
                </div>
                <CreditStatusChip :status="s.status" :days="s.days" />
                <span class="w-24 shrink-0 text-right text-sm font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(s.balance)) }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </template>
    </template>
  </section>
</template>
