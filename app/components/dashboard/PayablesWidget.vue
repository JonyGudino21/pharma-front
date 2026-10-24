<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useReceivablesStore } from '~/stores/receivables'
import { useCurrency } from '~/composables/useCurrency'
import CreditStatusChip from '~/components/credit/CreditStatusChip.vue'

/**
 * Panel: lo que le debemos a los proveedores (compras recibidas con saldo) y
 * lo próximo a pagar.
 */
const store = useReceivablesStore()
const { formatCurrency } = useCurrency()
const cargando = ref(true)

onMounted(async () => {
  await store.fetchPayables()
  cargando.value = false
})

const data = computed(() => store.payables)
const proximas = computed(() => (data.value?.purchases ?? []).slice(0, 5))
</script>

<template>
  <section class="flex min-w-0 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="wPayables" data-testid="widget-payables">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 id="wPayables" class="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <Icon name="ph:truck-bold" class="text-error-600" /> Por pagar a proveedores
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">Compras recibidas con saldo</p>
      </div>
      <NuxtLink to="/purchases" class="shrink-0 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300">Ver compras</NuxtLink>
    </div>

    <div v-if="cargando" class="mt-4 h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700/50" />
    <p v-else-if="!data" class="mt-4 text-sm text-gray-500">No pudimos consultar las cuentas por pagar.</p>

    <template v-else>
      <div class="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p class="text-2xl font-black tabular-nums text-gray-900 sm:text-3xl dark:text-white">{{ formatCurrency(Number(data.totals.balance)) }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ data.totals.suppliersCount }} {{ data.totals.suppliersCount === 1 ? 'proveedor' : 'proveedores' }}</p>
      </div>

      <dl v-if="data.totals.count > 0" class="mt-3 grid grid-cols-3 gap-2">
        <div class="rounded-xl bg-error-50 px-3 py-2 dark:bg-error-500/10">
          <dt class="text-[11px] font-semibold uppercase tracking-wide text-error-700 dark:text-error-300">Vencido</dt>
          <dd class="text-sm font-bold tabular-nums text-error-700 dark:text-error-300">{{ formatCurrency(Number(data.totals.overdue)) }}</dd>
        </div>
        <div class="rounded-xl bg-primary-50 px-3 py-2 dark:bg-primary-500/10">
          <dt class="text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">{{ data.dueSoonDays }} días</dt>
          <dd class="text-sm font-bold tabular-nums text-primary-700 dark:text-primary-300">{{ formatCurrency(Number(data.totals.dueSoon)) }}</dd>
        </div>
        <div class="rounded-xl bg-gray-100 px-3 py-2 dark:bg-gray-700/60">
          <dt class="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Sin fecha</dt>
          <dd class="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-100">{{ formatCurrency(Number(data.totals.noDate)) }}</dd>
        </div>
      </dl>

      <p v-if="data.totals.count === 0" class="mt-4 rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-900/40">No le debes nada a tus proveedores.</p>
      <div v-else class="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pagar primero</p>
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="p in proximas" :key="p.purchaseId">
            <NuxtLink :to="`/purchases/${p.purchaseId}`" class="flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ p.supplierName }}</p>
                <p class="truncate font-mono text-xs text-gray-500">{{ p.folio }}</p>
              </div>
              <CreditStatusChip :status="p.status" :days="p.days" />
              <span class="w-24 shrink-0 text-right text-sm font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(p.balance)) }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
