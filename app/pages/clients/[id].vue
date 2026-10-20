<template>
  <!--
    ESTADO DE CUENTA DEL CLIENTE.

    Esta página no existía. Los botones "Estado de cuenta" de Clientes y de
    Deudores apuntaban a /clients/:id y daban 404: justo la pantalla que el
    encargado necesita cuando un cliente pregunta "¿cuánto debo y de qué?".
  -->
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0">
        <NuxtLink to="/clients" class="inline-flex items-center gap-1 py-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          <Icon name="ph:arrow-left-bold" /> Clientes
        </NuxtLink>
        <h1 class="mt-1 break-words text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          {{ cliente?.name ?? 'Estado de cuenta' }}
        </h1>
        <p v-if="cliente" class="break-words text-sm text-gray-500 dark:text-gray-400">
          {{ cliente.phone || 'Sin teléfono' }} · {{ cliente.email || 'Sin correo' }}
        </p>
      </div>

      <div v-if="cliente" class="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:text-right">
        <div class="rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Deuda actual</p>
          <p class="text-xl font-bold tabular-nums" :class="aCentavos(cliente.currentDebt) > 0 ? 'text-error-600 dark:text-error-400' : 'text-success-600 dark:text-success-400'">
            {{ formatCurrency(Number(cliente.currentDebt)) }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Crédito disponible</p>
          <p class="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
            {{ formatCurrency(Math.max(0, restar(cliente.creditLimit, cliente.currentDebt))) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Precios especiales (ADR-0025) -->
    <ClientSpecialPrices v-if="cliente" :client-id="clienteId" :client-name="cliente.name" />

    <!-- Filtro de periodo -->
    <form class="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-white p-4 sm:flex sm:flex-wrap sm:items-end dark:border-gray-700 dark:bg-gray-800" @submit.prevent="cargar(1)">
      <div class="grid grid-cols-2 gap-3 sm:contents">
        <div class="min-w-0">
          <label for="desde" class="text-xs font-semibold uppercase text-gray-500">Desde</label>
          <input id="desde" v-model="desde" type="date" class="input-base" />
        </div>
        <div class="min-w-0">
          <label for="hasta" class="text-xs font-semibold uppercase text-gray-500">Hasta</label>
          <input id="hasta" v-model="hasta" type="date" class="input-base" :min="desde || undefined" />
        </div>
      </div>
      <div class="flex gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
        <button type="submit" class="btn-primary text-sm">
          Filtrar
        </button>
        <button v-if="desde || hasta" type="button" class="btn-secondary text-sm" @click="limpiar">
          Quitar filtro
        </button>
      </div>
    </form>

    <!-- Totales del periodo (sólo con rango de fechas) -->
    <div v-if="totales" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div v-for="t in totalesVisibles" :key="t.etiqueta" class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t.etiqueta }}</p>
        <p class="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{{ t.valor }}</p>
        <p v-if="t.detalle" class="text-xs text-gray-500 dark:text-gray-400">{{ t.detalle }}</p>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <SharedDataState
        :cargando="estado.cargando.value"
        :fallo="estado.fallo.value"
        :vacio="estado.vacio.value"
        mensaje-vacio="Este cliente no tiene ventas en el periodo."
        icono-vacio="ph:receipt-duotone"
        @reintentar="estado.reintentar()"
      >
        <div class="table-wrap hidden @4xl:block">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900/40">
            <tr>
              <th class="px-4 py-3">Folio</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3 text-right">Pagado</th>
              <th class="px-4 py-3 text-right">Saldo</th>
              <th class="px-4 py-3">Abonos</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="m in movimientos" :key="m.id" class="align-top">
              <td class="px-4 py-3 font-semibold">
                <NuxtLink :to="`/sales/${m.id}`" class="text-primary-600 hover:underline">
                  {{ m.invoiceNumber || `#${m.id}` }}
                </NuxtLink>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ formatDateTime(m.createdAt) }}</td>
              <td class="px-4 py-3 text-right">{{ formatCurrency(Number(m.total)) }}</td>
              <td class="px-4 py-3 text-right text-success-600 dark:text-success-400">{{ formatCurrency(Number(m.paidAmount)) }}</td>
              <td class="px-4 py-3 text-right font-semibold" :class="aCentavos(m.balance) > 0 ? 'text-error-600 dark:text-error-400' : 'text-gray-400'">
                {{ formatCurrency(Number(m.balance)) }}
              </td>
              <td class="px-4 py-3">
                <ul v-if="m.payments.length" class="space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                  <li v-for="p in m.payments" :key="p.id">
                    {{ formatDate(p.createdAt) }} · {{ etiquetaMetodo(p.method) }} · {{ formatCurrency(Number(p.amount)) }}
                  </li>
                </ul>
                <span v-else class="text-xs text-gray-400">Sin abonos</span>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <!-- Celular: una tarjeta por venta -->
        <ul class="card-list @4xl:hidden" data-testid="account-statement-cards">
          <li v-for="m in movimientos" :key="m.id">
            <NuxtLink :to="`/sales/${m.id}`" class="card-item">
              <div class="card-row">
                <p class="min-w-0 truncate font-bold text-primary-600 dark:text-primary-400">{{ m.invoiceNumber || `#${m.id}` }}</p>
                <p class="shrink-0 font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(m.total)) }}</p>
              </div>
              <div class="card-row mt-0.5">
                <p class="card-label min-w-0 truncate">{{ formatDateTime(m.createdAt) }}</p>
                <p class="shrink-0 text-xs font-semibold" :class="aCentavos(m.balance) > 0 ? 'text-error-600 dark:text-error-400' : 'text-gray-400'">
                  Saldo {{ formatCurrency(Number(m.balance)) }}
                </p>
              </div>
              <p class="mt-1 text-xs text-success-600 dark:text-success-400">Pagado {{ formatCurrency(Number(m.paidAmount)) }}</p>
              <ul v-if="m.payments.length" class="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                <li v-for="p in m.payments" :key="p.id">
                  {{ formatDate(p.createdAt) }} · {{ etiquetaMetodo(p.method) }} · {{ formatCurrency(Number(p.amount)) }}
                </li>
              </ul>
              <p v-else class="mt-1 text-xs text-gray-400">Sin abonos</p>
            </NuxtLink>
          </li>
        </ul>

        <div class="px-3 pb-4 sm:px-4">
          <Pagination :pagination="paginacion" @page-change="cargar" />
        </div>
      </SharedDataState>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useNuxtApp, navigateTo } from '#app'
import type { ApiResponse } from '~/types/auth'
import { useRequestState } from '~/composables/useRequestState'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import { aCentavos, restar } from '~/utils/money'
import Pagination from '~/components/shared/Pagination.vue'
import ClientSpecialPrices from '~/components/clients/ClientSpecialPrices.vue'

definePageMeta({ requiredPermission: 'canViewAccountStatement' })

interface Movimiento {
  id: number
  invoiceNumber: string | null
  total: string | number
  paidAmount: string | number
  balance: string | number
  createdAt: string
  payments: { id: number; amount: string | number; method: string; createdAt: string }[]
}

interface EstadoDeCuenta {
  client: {
    id: number
    name: string
    email: string | null
    phone: string | null
    currentDebt: string | number
    creditLimit: string | number
  }
  movements: Movimiento[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  totals?: Record<string, string | number>
}

const route = useRoute()
const { formatCurrency } = useCurrency()
const { formatDate, formatDateTime } = useDate()

const clienteId = Number(route.params.id)
const desde = ref('')
const hasta = ref('')

const estado = useRequestState<EstadoDeCuenta | null>(null)

const cliente = computed(() => estado.datos.value?.client ?? null)
const movimientos = computed(() => estado.datos.value?.movements ?? [])
const totales = computed(() => estado.datos.value?.totals ?? null)
const paginacion = computed(
  () => estado.datos.value?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
)

/**
 * Totales del periodo (backend: totalCharges, chargesCount, totalPayments,
 * paymentsCount). Antes se mostraban las claves crudas y `chargesCount`
 * (un conteo de ventas) salía formateado como dinero.
 */
const totalesVisibles = computed(() => {
  const t = totales.value
  if (!t) return []
  const n = (v: unknown) => Number(v ?? 0)
  const plural = (c: number, uno: string, varios: string) => `${c} ${c === 1 ? uno : varios}`
  return [
    {
      etiqueta: 'Vendido en el periodo',
      valor: formatCurrency(n(t.totalCharges)),
      detalle: '',
    },
    {
      etiqueta: 'Ventas en el periodo',
      valor: String(n(t.chargesCount)),
      detalle: 'Sin contar anuladas',
    },
    {
      etiqueta: 'Abonado en el periodo',
      valor: formatCurrency(n(t.totalPayments)),
      detalle: t.paymentsCount !== undefined ? plural(n(t.paymentsCount), 'abono', 'abonos') : '',
    },
  ]
})

const METODOS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
}
const etiquetaMetodo = (m: string) => METODOS[m] ?? m

function cargar(page = 1) {
  const { $api } = useNuxtApp()
  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (desde.value) params.set('startDate', desde.value)
  if (hasta.value) params.set('endDate', hasta.value)

  return estado.run(async () => {
    const res = await $api<ApiResponse<EstadoDeCuenta>>(
      `/client/${clienteId}/account-statement?${params.toString()}`,
    )
    return res.data
  })
}

function limpiar() {
  desde.value = ''
  hasta.value = ''
  void cargar(1)
}

onMounted(() => {
  // Un id no numérico en la URL no debe llegar al backend como NaN.
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    void navigateTo('/clients')
    return
  }
  void cargar(1)
})
</script>
