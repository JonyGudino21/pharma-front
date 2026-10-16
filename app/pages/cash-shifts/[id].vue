<template>
  <div class="space-y-4 sm:space-y-6" v-if="shift">

    <div class="page-header">
      <div class="min-w-0">
        <NuxtLink to="/cash-shifts/history" class="mb-2 inline-flex items-center py-1 text-sm text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver al historial
        </NuxtLink>
        <h1 class="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          Turno de caja #{{ shift.id }}
        </h1>
        <p class="mt-1 flex min-w-0 items-center text-sm text-gray-500 dark:text-gray-400">
          <Icon name="ph:user-bold" class="mr-1 shrink-0" />
          <span class="truncate">{{ shift.user?.firstName }} {{ shift.user?.lastName }} (@{{ shift.user?.userName }})</span>
        </p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Abierto: {{ formatDateTime(shift.openedAt) }}
          <span class="block sm:inline"><span class="hidden sm:inline"> · </span>{{ shift.closedAt ? `Cerrado: ${formatDateTime(shift.closedAt)}` : 'Aún en turno' }}</span>
        </p>
      </div>

      <div class="sm:shrink-0">
        <span class="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold" :class="statusBadge.class" data-testid="shift-status">
          <Icon :name="statusBadge.icon" />
          {{ statusBadge.text }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="mb-1 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Monto inicial</p>
        <p class="text-lg font-black tabular-nums text-gray-900 sm:text-xl dark:text-white">{{ formatCurrency(Number(shift.initialAmount)) }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="mb-1 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">El sistema esperaba</p>
        <p class="text-lg font-black tabular-nums text-gray-900 sm:text-xl dark:text-white">{{ shift.expectedAmount !== null ? formatCurrency(Number(shift.expectedAmount)) : '--' }}</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="mb-1 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">El cajero declaró</p>
        <p class="text-lg font-black tabular-nums text-gray-900 sm:text-xl dark:text-white">{{ shift.realAmount !== null ? formatCurrency(Number(shift.realAmount)) : '--' }}</p>
      </div>
      <div class="rounded-xl p-3 shadow-sm sm:p-4" :class="Number(shift.difference) < 0 ? 'border-2 border-error-500 bg-error-50 dark:bg-error-900/10' : Number(shift.difference) > 0 ? 'border-2 border-warning-500 bg-warning-50 dark:bg-warning-900/10' : 'border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'">
        <p class="mb-1 text-xs font-bold uppercase" :class="Number(shift.difference) < 0 ? 'text-error-700 dark:text-error-300' : Number(shift.difference) > 0 ? 'text-warning-700 dark:text-warning-300' : 'text-gray-500 dark:text-gray-400'">Diferencia</p>
        <p class="text-lg font-black tabular-nums sm:text-xl" :class="Number(shift.difference) < 0 ? 'text-error-700 dark:text-error-300' : Number(shift.difference) > 0 ? 'text-warning-700 dark:text-warning-300' : 'text-gray-900 dark:text-white'">
          <span v-if="shift.difference !== null">{{ Number(shift.difference) > 0 ? '+' : '' }}{{ formatCurrency(Number(shift.difference)) }}</span>
          <span v-else>--</span>
        </p>
      </div>
    </div>

    <div v-if="shift.notes" class="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900 dark:border-warning-800/40 dark:bg-warning-900/20 dark:text-warning-200">
      <span class="font-bold"><Icon name="ph:note-pencil-bold" class="inline" /> Notas del turno:</span> {{ shift.notes }}
    </div>

    <div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">

      <!-- Todos los movimientos de efectivo del turno (no sólo los manuales:
           también ventas, abonos, devoluciones y pagos a proveedor). -->
      <section class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800" data-testid="shift-transactions">
        <h2 class="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <Icon name="ph:hand-coins-bold" /> Movimientos de efectivo ({{ transactions.length }})
        </h2>
        <p v-if="transactions.length > 0" class="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Entró <span class="font-semibold text-success-700 dark:text-success-400">+{{ formatCurrency(totalIn) }}</span>
          · salió <span class="font-semibold text-error-700 dark:text-error-400">−{{ formatCurrency(totalOut) }}</span>
        </p>
        <div class="lg:max-h-96 lg:overflow-y-auto">
          <div v-if="transactions.length === 0" class="py-4 text-center text-sm italic text-gray-500 dark:text-gray-400">No hubo movimientos de efectivo.</div>
          <ul v-else class="space-y-3">
            <li v-for="t in transactions" :key="t.id" class="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{{ cashTransactionMeta(t.type).label }}</p>
                <p v-if="t.reason" class="break-words text-sm font-medium text-gray-900 dark:text-white">"{{ t.reason }}"</p>
                <p class="mt-0.5 flex items-center text-xs text-gray-500 dark:text-gray-400"><Icon name="ph:clock-bold" class="mr-1" /> {{ formatDateTime(t.createdAt) }}</p>
              </div>
              <p class="shrink-0 font-black tabular-nums" :class="cashTransactionMeta(t.type).direction === 'in' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'">
                {{ cashTransactionMeta(t.type).direction === 'in' ? '+' : '−' }}{{ formatCurrency(Number(t.amount)) }}
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800" data-testid="shift-sales">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <Icon name="ph:receipt-bold" /> Ventas registradas ({{ shift.sales?.length || 0 }})
        </h2>
        <div class="lg:max-h-96 lg:overflow-y-auto">
          <div v-if="!shift.sales?.length" class="py-4 text-center text-sm italic text-gray-500 dark:text-gray-400">No hubo ventas.</div>
          <ul v-else class="space-y-3">
            <li v-for="sale in shift.sales" :key="sale.id">
              <NuxtLink :to="`/sales/${sale.id}`" class="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-primary-700">
                <div class="min-w-0">
                  <p class="text-sm font-bold text-gray-900 dark:text-white">Venta #{{ sale.id }}</p>
                  <p class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Icon name="ph:clock-bold" class="mr-1" /> {{ formatDateTime(sale.createdAt) }}
                    <template v-if="sale.paymentMethod"> · {{ PAYMENT_METHOD_LABEL[sale.paymentMethod] ?? 'Otro' }}</template>
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="font-black tabular-nums text-primary-600 dark:text-primary-400">{{ formatCurrency(Number(sale.total)) }}</p>
                  <span class="rounded px-2 py-0.5 text-[10px] font-bold uppercase" :class="saleBadgeClass(sale.status)">
                    {{ SALE_STATUS_LABEL[sale.status] ?? 'Desconocido' }}
                  </span>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>

    </div>

    <!-- Aperturas del cajón SIN venta: el backend las registraba pero nadie las
         veía. Se revisan junto al arqueo (quién, cuándo, desde qué caja y por qué). -->
    <section class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800" data-testid="shift-drawer-events">
      <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <Icon name="ph:vault-bold" /> Aperturas de cajón sin venta ({{ drawerEvents.length }})
      </h2>
      <div v-if="drawerEvents.length === 0" class="py-4 text-center text-sm italic text-gray-500 dark:text-gray-400">No se abrió el cajón sin venta.</div>
      <template v-else>
        <!-- Tableta y laptop: tabla -->
        <div class="table-wrap hidden @4xl:block">
          <table class="w-full border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th class="py-2 pr-4 font-semibold">Hora</th>
                <th class="py-2 pr-4 font-semibold">Quién</th>
                <th class="py-2 pr-4 font-semibold">Caja</th>
                <th class="py-2 pr-4 font-semibold">Motivo</th>
                <th class="py-2 font-semibold">Tipo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="e in drawerEvents" :key="e.id">
                <td class="whitespace-nowrap py-2 pr-4 text-gray-700 dark:text-gray-300">{{ formatDateTime(e.createdAt) }}</td>
                <td class="whitespace-nowrap py-2 pr-4 text-gray-900 dark:text-white">{{ personName(e) }}</td>
                <td class="py-2 pr-4 text-gray-700 dark:text-gray-300">{{ e.terminal || 'Sin nombre' }}</td>
                <td class="py-2 pr-4 text-gray-900 dark:text-white">{{ e.reason }}</td>
                <td class="py-2"><span :class="kindBadgeClass(e.kind)">{{ DRAWER_EVENT_KIND_LABEL[e.kind] ?? e.kind }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Celular: tarjetas -->
        <ul class="space-y-3 @4xl:hidden">
          <li v-for="e in drawerEvents" :key="e.id" class="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/50">
            <div class="card-row">
              <p class="min-w-0 truncate font-semibold text-gray-900 dark:text-white">{{ personName(e) }}</p>
              <span class="shrink-0" :class="kindBadgeClass(e.kind)">{{ DRAWER_EVENT_KIND_LABEL[e.kind] ?? e.kind }}</span>
            </div>
            <p class="mt-1 break-words text-gray-800 dark:text-gray-200">"{{ e.reason }}"</p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(e.createdAt) }} · Caja: {{ e.terminal || 'Sin nombre' }}</p>
          </li>
        </ul>
      </template>
    </section>

  </div>
  <div v-else-if="loading" class="min-h-[50vh] flex items-center justify-center" aria-busy="true">
    <Icon name="ph:spinner-gap-bold" class="w-10 h-10 animate-spin text-primary-600" />
  </div>
  <div
    v-else
    class="mx-auto mt-12 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-error-500/40 bg-white p-6 text-center sm:p-10 dark:bg-gray-800"
    role="alert"
  >
    <Icon name="ph:cloud-slash-fill" class="h-12 w-12 text-error-500" />
    <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">No pudimos cargar este turno.</p>
    <p class="text-xs text-gray-500 dark:text-gray-400">Puede que no exista o que no haya conexión con el servidor.</p>
    <div class="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
      <NuxtLink to="/cash-shifts/history" class="btn-secondary">Volver al historial</NuxtLink>
      <button type="button" class="btn-primary gap-2" @click="cargar"><Icon name="ph:arrow-clockwise-bold" /> Reintentar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from '#app'
import {
  useCashShiftStore,
  cashTransactionMeta,
  SHIFT_STATUS_LABEL,
  SALE_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  DRAWER_EVENT_KIND_LABEL,
  type CashShift,
  type CashDrawerEvent,
  type DrawerEventKind,
  type SaleStatusCode,
} from '~/stores/cashShift'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import { sumar } from '~/utils/money'

definePageMeta({ requiredPermission: 'canViewAllShifts' })

const route = useRoute()
const store = useCashShiftStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()

const shift = ref<CashShift | null>(null)
// Antes, si la carga fallaba, el spinner giraba para siempre: no había forma de
// saber que algo salió mal ni de reintentar.
const loading = ref(true)

async function cargar() {
  loading.value = true
  try {
    shift.value = await store.fetchShiftById(Number(route.params.id))
  } finally {
    loading.value = false
  }
}

onMounted(cargar)

const transactions = computed(() => shift.value?.transactions ?? [])
const drawerEvents = computed(() => shift.value?.drawerEvents ?? [])

const totalIn = computed(() =>
  transactions.value
    .filter((t) => cashTransactionMeta(t.type).direction === 'in')
    .reduce((acc, t) => sumar(acc, t.amount), 0),
)
const totalOut = computed(() =>
  transactions.value
    .filter((t) => cashTransactionMeta(t.type).direction === 'out')
    .reduce((acc, t) => sumar(acc, t.amount), 0),
)

const statusBadge = computed(() => {
  const status = shift.value?.status
  const text = status ? SHIFT_STATUS_LABEL[status] ?? 'Desconocido' : ''
  switch (status) {
    case 'CLOSED':
      return { text, icon: 'ph:check-circle-bold', class: 'border-success-200 bg-success-50 text-success-700 dark:border-success-800/40 dark:bg-success-900/20 dark:text-success-300' }
    case 'AUDIT_REQUIRED':
      return { text, icon: 'ph:warning-circle-bold', class: 'border-error-200 bg-error-50 text-error-700 dark:border-error-800/40 dark:bg-error-900/20 dark:text-error-300' }
    default:
      return { text, icon: 'ph:lock-key-open-bold', class: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800/40 dark:bg-primary-900/20 dark:text-primary-300' }
  }
})

function saleBadgeClass(status: SaleStatusCode) {
  switch (status) {
    case 'COMPLETED': return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
    case 'PARTIAL':
    case 'PENDING': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
    case 'REFUNDED': return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
    default: return 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300'
  }
}

function kindBadgeClass(kind: DrawerEventKind) {
  const base = 'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase'
  return kind === 'TEST'
    ? `${base} bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200`
    : `${base} bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300`
}

function personName(e: CashDrawerEvent) {
  const full = `${e.user?.firstName ?? ''} ${e.user?.lastName ?? ''}`.trim()
  return full || `Usuario #${e.userId}`
}
</script>
