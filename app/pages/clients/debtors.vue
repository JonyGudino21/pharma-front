<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <NuxtLink to="/clients" class="mb-1 inline-flex items-center py-1 text-sm text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Clientes
        </NuxtLink>
        <h1 class="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">Cobranza</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Quién te debe, desde cuándo y qué cobrar primero.</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink v-if="authStore.can('canManageSettings')" to="/settings/credit" class="btn-secondary gap-2 text-sm">
          <Icon name="ph:gear-six-bold" /> <span class="hidden sm:inline">Configurar crédito</span>
        </NuxtLink>
        <button type="button" class="btn-secondary gap-2 text-sm" :disabled="store.isLoading" @click="cargar">
          <Icon name="ph:arrow-clockwise-bold" :class="{ 'animate-spin': store.isLoading }" /> <span class="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Cargando / error -->
    <div v-if="store.isLoading && !data" class="space-y-4" aria-busy="true">
      <div class="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div class="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    </div>
    <div v-else-if="store.loadError && !data" class="rounded-2xl border border-error-500/40 bg-white p-8 text-center dark:bg-gray-800" role="alert">
      <Icon name="ph:cloud-slash-fill" class="mx-auto h-10 w-10 text-error-500" />
      <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.loadError.mensaje }}</p>
      <p class="text-xs text-gray-500">Esto no significa que nadie te deba: no pudimos consultarlo.</p>
      <button type="button" class="btn-primary mx-auto mt-4 gap-2" @click="cargar"><Icon name="ph:arrow-clockwise-bold" /> Reintentar</button>
    </div>

    <!-- Cartera limpia -->
    <div v-else-if="data && data.totals.salesCount === 0" class="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <Icon name="ph:check-circle-duotone" class="mx-auto mb-3 h-12 w-12 text-success-500" />
      <p class="text-lg font-bold text-gray-900 dark:text-white">Nadie te debe</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">Cuando cargues una venta a crédito aparecerá aquí, con su fecha de pago.</p>
    </div>

    <template v-else-if="data">
      <!-- Cartera: total + termómetro de antigüedad -->
      <section class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="carteraTitulo">
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p id="carteraTitulo" class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Por cobrar</p>
            <p class="text-3xl font-black tabular-nums text-gray-900 sm:text-4xl dark:text-white" data-testid="receivables-total">{{ formatCurrency(Number(data.totals.balance)) }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ data.totals.clientsCount }} {{ data.totals.clientsCount === 1 ? 'cliente' : 'clientes' }} · {{ data.totals.salesCount }} {{ data.totals.salesCount === 1 ? 'venta' : 'ventas' }} con saldo
            </p>
          </div>
          <dl class="grid grid-cols-3 gap-2 sm:gap-3">
            <div class="rounded-xl bg-error-50 px-3 py-2 dark:bg-error-500/10">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-error-700 dark:text-error-300">Vencido</dt>
              <dd class="font-bold tabular-nums text-error-700 dark:text-error-300">{{ formatCurrency(Number(data.totals.overdue)) }}</dd>
            </div>
            <div class="rounded-xl bg-primary-50 px-3 py-2 dark:bg-primary-500/10">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">Vence en {{ data.dueSoonDays }} días</dt>
              <dd class="font-bold tabular-nums text-primary-700 dark:text-primary-300">{{ formatCurrency(Number(data.totals.dueSoon)) }}</dd>
            </div>
            <div class="rounded-xl bg-gray-100 px-3 py-2 dark:bg-gray-700/60">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Sin fecha</dt>
              <dd class="font-bold tabular-nums text-gray-800 dark:text-gray-100">{{ formatCurrency(Number(data.totals.noDate)) }}</dd>
            </div>
          </dl>
        </div>
        <div class="mt-5">
          <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Antigüedad de lo que te deben · toca una columna para ver sus ventas</p>
          <AgingThermometer :aging="data.aging" :active="filtroAntiguedad" @select="filtrarPorAntiguedad" />
        </div>
      </section>

      <!-- Pestañas -->
      <section class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex flex-wrap items-center gap-2 border-b border-gray-100 px-3 pt-3 sm:px-5 dark:border-gray-700" role="tablist" aria-label="Vista de cobranza">
          <button
            v-for="t in TABS"
            :key="t.id"
            type="button"
            role="tab"
            :aria-selected="tab === t.id"
            class="-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors"
            :class="tab === t.id ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
            :data-testid="`receivables-tab-${t.id}`"
            @click="tab = t.id"
          >
            <Icon :name="t.icon" />
            {{ t.label }}
            <span class="rounded-full bg-gray-100 px-2 text-xs tabular-nums text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ t.id === 'clientes' ? data.clients.length : ventasFiltradas.length }}</span>
          </button>
        </div>

        <!-- ═══ Por cliente ═══ -->
        <div v-if="tab === 'clientes'" role="tabpanel">
          <p class="px-4 pt-3 text-xs text-gray-500 sm:px-6 dark:text-gray-400">Ordenados por urgencia: primero quien tiene la deuda más vencida.</p>
          <div class="table-wrap hidden @4xl:block">
            <table class="w-full border-collapse text-left">
              <thead>
                <tr class="text-xs uppercase text-gray-500">
                  <th class="px-4 py-3 lg:px-6">Cliente</th>
                  <th class="px-4 py-3 text-right">Debe</th>
                  <th class="px-4 py-3 text-right">Vencido</th>
                  <th class="px-4 py-3">Deuda más vieja</th>
                  <th class="px-4 py-3">Situación</th>
                  <th class="px-4 py-3 text-right lg:px-6"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="c in data.clients" :key="c.clientId" class="hover:bg-gray-50 dark:hover:bg-gray-700/30" data-testid="receivables-client-row">
                  <td class="px-4 py-3 lg:px-6">
                    <p class="font-bold text-gray-900 dark:text-white">{{ c.clientName }}</p>
                    <p class="text-xs text-gray-500"><Icon name="ph:phone" class="mr-1 align-[-2px]" />{{ c.clientPhone || 'Sin teléfono' }} · {{ c.salesCount }} {{ c.salesCount === 1 ? 'venta' : 'ventas' }}</p>
                  </td>
                  <td class="px-4 py-3 text-right font-black tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(c.balance)) }}</td>
                  <td class="px-4 py-3 text-right tabular-nums" :class="Number(c.overdue) > 0 ? 'font-bold text-error-600 dark:text-error-400' : 'text-gray-400'">{{ Number(c.overdue) > 0 ? formatCurrency(Number(c.overdue)) : '—' }}</td>
                  <td class="px-4 py-3 text-sm">
                    <p class="text-gray-800 dark:text-gray-200">{{ fechaCorta(c.oldestSaleDate) }}</p>
                    <p class="text-xs text-gray-500">hace {{ c.oldestAgeDays }} {{ c.oldestAgeDays === 1 ? 'día' : 'días' }}</p>
                  </td>
                  <td class="px-4 py-3"><CreditStatusChip v-bind="situacionCliente(c)" /></td>
                  <td class="px-4 py-3 lg:px-6">
                    <div class="flex justify-end gap-1.5">
                      <button type="button" class="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30" data-testid="receivables-view-sales" @click="verVentas(c.clientId)">Ver ventas</button>
                      <button v-if="authStore.can('canRegisterClientPayment')" type="button" class="flex items-center rounded-lg bg-success-50 px-3 py-1.5 text-sm font-bold text-success-700 hover:bg-success-100 dark:bg-success-900/30 dark:text-success-400" @click="cobrar(c)">
                        <Icon name="ph:money-bold" class="mr-1.5" /> Cobrar
                      </button>
                      <NuxtLink v-if="authStore.can('canViewAccountStatement')" :to="`/clients/${c.clientId}`" class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" title="Estado de cuenta" aria-label="Estado de cuenta">
                        <Icon name="ph:receipt-bold" class="h-5 w-5" />
                      </NuxtLink>
                      <button v-if="authStore.can('canUpdateCreditConfig')" type="button" class="rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30" title="Crédito: límite y días para pagar" aria-label="Configurar crédito" @click="configurar(c)">
                        <Icon name="ph:identification-card-bold" class="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul class="card-list @4xl:hidden">
            <li v-for="c in data.clients" :key="c.clientId" class="px-4 py-3">
              <div class="card-row">
                <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">{{ c.clientName }}</p>
                <p class="shrink-0 font-black tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(c.balance)) }}</p>
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <CreditStatusChip v-bind="situacionCliente(c)" />
                <span v-if="Number(c.overdue) > 0" class="text-xs font-semibold text-error-600 dark:text-error-400">Vencido {{ formatCurrency(Number(c.overdue)) }}</span>
                <span class="ml-auto text-xs text-gray-500">Más vieja: {{ fechaCorta(c.oldestSaleDate) }}</span>
              </div>
              <div class="mt-3 flex gap-2">
                <button type="button" class="flex min-h-10 flex-1 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200" @click="verVentas(c.clientId)">Ver ventas</button>
                <button v-if="authStore.can('canRegisterClientPayment')" type="button" class="flex min-h-10 flex-1 items-center justify-center rounded-lg bg-success-50 text-sm font-bold text-success-700 dark:bg-success-900/30 dark:text-success-400" @click="cobrar(c)">
                  <Icon name="ph:money-bold" class="mr-1.5" /> Cobrar
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- ═══ Ventas por cobrar ═══ -->
        <div v-else role="tabpanel">
          <div class="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
            <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por situación">
              <button
                v-for="f in FILTROS"
                :key="f.id"
                type="button"
                class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
                :class="filtroEstado === f.id && !filtroAntiguedad ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'"
                :data-testid="`receivables-filter-${f.id}`"
                @click="filtroEstado = f.id; filtroAntiguedad = null"
              >{{ f.label }}</button>
            </div>
            <span v-if="filtroAntiguedad" class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {{ ANTIGUEDAD_META[filtroAntiguedad].label }}
              <button type="button" class="ml-1 rounded-full hover:text-gray-900" aria-label="Quitar filtro de antigüedad" @click="filtroAntiguedad = null"><Icon name="ph:x-bold" class="h-3 w-3" /></button>
            </span>
            <label class="ml-auto flex min-w-0 items-center gap-2 text-sm">
              <span class="sr-only">Cliente</span>
              <select v-model="filtroCliente" class="input-base py-1.5 text-sm" data-testid="receivables-client-filter">
                <option :value="null">Todos los clientes</option>
                <option v-for="c in data.clients" :key="c.clientId" :value="c.clientId">{{ c.clientName }}</option>
              </select>
            </label>
          </div>

          <p v-if="ventasFiltradas.length === 0" class="px-6 py-10 text-center text-sm text-gray-500">No hay ventas con estos filtros.</p>

          <template v-else>
            <div class="table-wrap hidden @4xl:block">
              <table class="w-full border-collapse text-left">
                <thead>
                  <tr class="text-xs uppercase text-gray-500">
                    <th class="px-4 py-3 lg:px-6">Venta</th>
                    <th class="px-4 py-3">Cliente</th>
                    <th class="px-4 py-3">Fecha de pago</th>
                    <th class="px-4 py-3">Situación</th>
                    <th class="px-4 py-3 text-right lg:px-6">Saldo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="v in ventasFiltradas" :key="v.saleId" class="hover:bg-gray-50 dark:hover:bg-gray-700/30" data-testid="receivables-sale-row">
                    <td class="px-4 py-3 lg:px-6">
                      <NuxtLink :to="`/sales/${v.saleId}`" class="font-mono text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300">{{ v.folio }}</NuxtLink>
                      <p class="text-xs text-gray-500">{{ fechaCorta(v.saleDate) }} · hace {{ v.ageDays }} {{ v.ageDays === 1 ? 'día' : 'días' }}</p>
                    </td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{{ v.clientName }}</td>
                    <td class="px-4 py-3 text-sm">
                      <button
                        type="button"
                        class="group inline-flex items-center gap-1.5 rounded-md px-1 -mx-1 text-gray-800 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-default disabled:hover:bg-transparent dark:text-gray-200 dark:hover:bg-primary-900/20"
                        :disabled="!puedeCambiarFecha"
                        :title="puedeCambiarFecha ? 'Cambiar fecha de pago' : undefined"
                        data-testid="receivables-edit-due"
                        @click="editarFecha(v)"
                      >
                        {{ v.dueDate ? fechaCorta(v.dueDate) : 'Sin fecha' }}
                        <Icon v-if="puedeCambiarFecha" name="ph:pencil-simple-bold" class="h-3.5 w-3.5 text-gray-400 group-hover:text-primary-600" />
                      </button>
                    </td>
                    <td class="px-4 py-3"><CreditStatusChip :status="v.status" :days="v.days" /></td>
                    <td class="px-4 py-3 text-right lg:px-6">
                      <p class="font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(v.balance)) }}</p>
                      <p class="text-xs tabular-nums text-gray-500">de {{ formatCurrency(Number(v.total)) }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul class="card-list @4xl:hidden">
              <li v-for="v in ventasFiltradas" :key="v.saleId" class="px-4 py-3">
                <div class="card-row">
                  <NuxtLink :to="`/sales/${v.saleId}`" class="min-w-0 truncate font-mono text-sm font-semibold text-primary-700 dark:text-primary-300">{{ v.folio }}</NuxtLink>
                  <p class="shrink-0 font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(v.balance)) }}</p>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ v.clientName }}</p>
                <div class="mt-1.5 flex flex-wrap items-center gap-2">
                  <CreditStatusChip :status="v.status" :days="v.days" />
                  <button type="button" class="ml-auto text-xs font-semibold text-primary-700 disabled:text-gray-500 dark:text-primary-300" :disabled="!puedeCambiarFecha" @click="editarFecha(v)">
                    Pago: {{ v.dueDate ? fechaCorta(v.dueDate) : 'sin fecha' }}
                  </button>
                </div>
              </li>
            </ul>
          </template>
        </div>
      </section>
    </template>

    <CreditConfigModal v-model="showCreditModal" :client="seleccion" @success="cargar" />
    <ClientPaymentModal v-model="showPaymentModal" :client="seleccion" @success="cargar" />
    <DueDateModal
      :open="!!fechaVenta"
      :folio="fechaVenta?.folio ?? ''"
      :client-name="fechaVenta?.clientName ?? ''"
      :balance="fechaVenta?.balance ?? '0'"
      :current="fechaVenta?.dueDate ?? null"
      :saving="guardandoFecha"
      @close="fechaVenta = null"
      @save="guardarFecha"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useReceivablesStore, type ClientePorCobrar, type CuentaPorCobrar } from '~/stores/receivables'
import type { Debtor } from '~/stores/client'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
import { ANTIGUEDAD_META, fechaCorta, type Antiguedad, type EstadoCobro } from '~/utils/credit-status'
import AgingThermometer from '~/components/credit/AgingThermometer.vue'
import CreditStatusChip from '~/components/credit/CreditStatusChip.vue'
import DueDateModal from '~/components/credit/DueDateModal.vue'
import CreditConfigModal from '~/components/clients/CreditConfigModal.vue'
import ClientPaymentModal from '~/components/clients/ClientPaymentModal.vue'

/**
 * COBRANZA (ADR-0029). Antes «Deudores»: sólo decía cuánto debía cada quien.
 * Ahora dice desde cuándo y qué cobrar primero: la cartera por antigüedad, un
 * resumen por cliente ordenado por urgencia y cada venta con su fecha de pago.
 */
definePageMeta({ requiredPermission: 'canViewDebtors' })

const store = useReceivablesStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const data = computed(() => store.receivables)
const cargar = () => store.fetchReceivables()
onMounted(cargar)

type Tab = 'clientes' | 'ventas'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'clientes', label: 'Por cliente', icon: 'ph:users-bold' },
  { id: 'ventas', label: 'Ventas por cobrar', icon: 'ph:receipt-bold' },
]
const tab = ref<Tab>('clientes')

type Filtro = 'todas' | EstadoCobro
const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'VENCIDA', label: 'Vencidas' },
  { id: 'POR_VENCER', label: 'Por vencer' },
  { id: 'AL_CORRIENTE', label: 'Al corriente' },
  { id: 'SIN_FECHA', label: 'Sin fecha' },
]
const filtroEstado = ref<Filtro>('todas')
const filtroAntiguedad = ref<Antiguedad | null>(null)
const filtroCliente = ref<number | null>(null)

/** El servidor ya las manda en orden de cobro; aquí sólo se filtra. */
const ventasFiltradas = computed<CuentaPorCobrar[]>(() =>
  (data.value?.sales ?? []).filter((v) =>
    (filtroCliente.value === null || v.clientId === filtroCliente.value) &&
    (filtroAntiguedad.value ? v.aging === filtroAntiguedad.value : filtroEstado.value === 'todas' || v.status === filtroEstado.value),
  ),
)

function filtrarPorAntiguedad(bucket: Antiguedad | null) {
  filtroAntiguedad.value = bucket
  filtroEstado.value = 'todas'
  if (bucket) tab.value = 'ventas'
}

function verVentas(clientId: number) {
  filtroCliente.value = clientId
  filtroEstado.value = 'todas'
  filtroAntiguedad.value = null
  tab.value = 'ventas'
}

/** La situación más urgente del cliente, en las mismas palabras que sus ventas. */
function situacionCliente(c: ClientePorCobrar): { status: EstadoCobro; days: number } {
  if (c.maxDaysOverdue > 0) return { status: 'VENCIDA', days: c.maxDaysOverdue }
  if (!c.nextDueDate || !data.value) return { status: 'SIN_FECHA', days: 0 }
  const dias = Math.round((Date.parse(c.nextDueDate) - Date.parse(data.value.today)) / 86_400_000)
  return { status: dias <= data.value.dueSoonDays ? 'POR_VENCER' : 'AL_CORRIENTE', days: dias }
}

// Modales de cobro y crédito (reciben la forma de Deudor que ya conocen).
const seleccion = ref<Debtor | null>(null)
const showCreditModal = ref(false)
const showPaymentModal = ref(false)
const comoDeudor = (c: ClientePorCobrar): Debtor => ({
  id: c.clientId,
  name: c.clientName,
  phone: c.clientPhone,
  currentDebt: c.balance,
  creditLimit: c.creditLimit,
  sales: [],
})
function cobrar(c: ClientePorCobrar) {
  seleccion.value = comoDeudor(c)
  showPaymentModal.value = true
}
function configurar(c: ClientePorCobrar) {
  seleccion.value = comoDeudor(c)
  showCreditModal.value = true
}

// Fecha de pago de una venta (gerencia: la misma regla que el servidor).
const puedeCambiarFecha = computed(() => authStore.can('canViewDebtors'))
const fechaVenta = ref<CuentaPorCobrar | null>(null)
const guardandoFecha = ref(false)
function editarFecha(v: CuentaPorCobrar) {
  if (puedeCambiarFecha.value) fechaVenta.value = v
}
async function guardarFecha(dueDate: string | null) {
  const v = fechaVenta.value
  if (!v) return
  guardandoFecha.value = true
  const ok = await store.setDueDate(v.saleId, dueDate)
  guardandoFecha.value = false
  if (!ok) return
  toast.success(dueDate ? `Fecha de pago de ${v.folio}: ${fechaCorta(dueDate)}.` : `${v.folio} quedó sin fecha de pago.`)
  fechaVenta.value = null
  await cargar()
}
</script>
