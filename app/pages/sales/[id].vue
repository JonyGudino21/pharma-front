<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/sales"
        class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Volver al historial"
      >
        <Icon name="ph:arrow-left-bold" class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Detalle de venta</h1>
    </div>

    <div v-if="store.isLoading && !venta" class="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
      <Icon name="ph:spinner-gap-bold" class="w-10 h-10 animate-spin mx-auto mb-3 text-primary-500" />
      <p class="text-gray-500">Cargando la venta...</p>
    </div>

    <div v-else-if="!venta" class="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
      <Icon name="ph:receipt-duotone" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
      <p class="text-gray-500">No se encontró esta venta.</p>
    </div>

    <template v-else>
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div class="space-y-3">
            <div class="flex items-center gap-3 flex-wrap">
              <h2 class="text-2xl font-black text-gray-900 dark:text-white">
                {{ venta.invoiceNumber || `Sin folio (#${venta.id})` }}
              </h2>
              <span :class="badgeEstado(venta.status).class">
                <Icon :name="badgeEstado(venta.status).icon" class="mr-1" />
                {{ badgeEstado(venta.status).text }}
              </span>
            </div>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div class="flex gap-2">
                <dt class="text-gray-500">Fecha:</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(venta.createdAt) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-gray-500">Cliente:</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ venta.client?.name || 'Público General' }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-gray-500">Atendió:</dt>
                <dd class="font-medium text-gray-900 dark:text-white">
                  {{ venta.user ? `${venta.user.firstName} ${venta.user.lastName}` : '—' }}
                </dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-gray-500">Método:</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ etiquetaMetodo(venta.paymentMethod) }}</dd>
              </div>
            </dl>

            <p v-if="venta.note" class="text-sm text-gray-500 italic">{{ venta.note }}</p>
          </div>

            <div class="flex flex-wrap gap-2 shrink-0 print:hidden">
            <button
              v-if="puedeImprimir"
              class="btn-secondary"
              :disabled="isPrinting"
              @click="imprimir"
            >
              <Icon name="ph:printer-bold" class="mr-2" />
              {{ isPrinting ? 'Imprimiendo…' : 'Imprimir ticket' }}
            </button>

            <button
              v-if="puedeDevolver"
              class="btn-primary"
              @click="mostrarDevolucion = true"
            >
              <Icon name="ph:arrow-u-up-left-bold" class="mr-2" /> Devolver
            </button>

            <button
              v-if="puedeAnular"
              class="flex items-center px-4 py-2 rounded-lg font-medium text-white bg-error-600 hover:bg-error-700 transition-colors"
              @click="mostrarAnulacion = true"
            >
              <Icon name="ph:prohibit-bold" class="mr-2" /> Anular venta
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 border-t border-gray-100 dark:border-gray-700 divide-x divide-gray-100 dark:divide-gray-700">
          <div class="p-4 text-center">
            <p class="text-xs font-semibold text-gray-500 uppercase">Total</p>
            <p class="text-xl font-black text-gray-900 dark:text-white mt-1">{{ formatCurrency(Number(venta.total)) }}</p>
          </div>
          <div class="p-4 text-center">
            <p class="text-xs font-semibold text-gray-500 uppercase">Pagado</p>
            <p class="text-xl font-black text-success-600 dark:text-success-400 mt-1">{{ formatCurrency(Number(venta.paidAmount)) }}</p>
          </div>
          <div class="p-4 text-center">
            <p class="text-xs font-semibold text-gray-500 uppercase">Saldo</p>
            <p
              class="text-xl font-black mt-1"
              :class="Number(venta.balance) > 0 ? 'text-error-600 dark:text-error-400' : 'text-gray-400'"
            >
              {{ formatCurrency(Number(venta.balance)) }}
            </p>
          </div>
          <div class="p-4 text-center">
            <p class="text-xs font-semibold text-gray-500 uppercase">Reembolsado</p>
            <p
              class="text-xl font-black mt-1"
              :class="store.totalRefunded > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400'"
            >
              {{ formatCurrency(store.totalRefunded) }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <h3 class="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
          Productos
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Cantidad</th>
                <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Devuelto</th>
                <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Precio</th>
                <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="item in venta.items" :key="item.id">
                <td class="px-6 py-4">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ item.product?.name || `Producto #${item.productId}` }}
                  </p>
                  <p v-if="item.product?.sku" class="text-xs text-gray-500 mt-0.5">{{ item.product.sku }}</p>
                </td>
                <td class="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">{{ item.quantity }}</td>
                <td class="px-6 py-4 text-center">
                  <span
                    v-if="devueltas(item.id) > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400"
                  >
                    {{ devueltas(item.id) }} de {{ item.quantity }}
                  </span>
                  <span v-else class="text-gray-400 text-sm">—</span>
                </td>
                <td class="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{{ formatCurrency(Number(item.price)) }}</td>
                <td class="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">{{ formatCurrency(Number(item.subtotal)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <h3 class="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
            Pagos recibidos
          </h3>
          <div v-if="!venta.payments || venta.payments.length === 0" class="px-6 py-8 text-center text-sm text-gray-500">
            Esta venta no registra pagos.
          </div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="pago in venta.payments" :key="pago.id" class="px-6 py-4 flex items-center justify-between gap-4">
              <div class="min-w-0">
                <p class="font-medium text-gray-900 dark:text-white">{{ etiquetaMetodo(pago.method) }}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ formatDateTime(pago.createdAt) }}
                  <span v-if="pago.references"> · {{ pago.references }}</span>
                </p>
              </div>
              <p class="font-bold text-success-600 dark:text-success-400 shrink-0">
                {{ formatCurrency(Number(pago.amount)) }}
              </p>
            </li>
          </ul>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <h3 class="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
            Devoluciones
          </h3>
          <div v-if="venta.saleReturn.length === 0" class="px-6 py-8 text-center text-sm text-gray-500">
            Esta venta no tiene devoluciones.
          </div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="devolucion in venta.saleReturn" :key="devolucion.id" class="px-6 py-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white">Devolución #{{ devolucion.id }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ formatDateTime(devolucion.createdAt) }}
                    <span v-if="devolucion.processedBy">
                      · {{ devolucion.processedBy.firstName }} {{ devolucion.processedBy.lastName }}
                    </span>
                  </p>
                </div>
                <p v-if="montoReembolsado(devolucion) > 0" class="font-bold text-warning-600 dark:text-warning-400 shrink-0">
                  {{ formatCurrency(montoReembolsado(devolucion)) }}
                </p>
                <p v-else class="text-xs text-gray-400 shrink-0">Sin reembolso</p>
              </div>

              <ul class="mt-2 space-y-1">
                <li v-for="linea in devolucion.items" :key="linea.id" class="text-xs text-gray-600 dark:text-gray-400">
                  {{ linea.quantity }} × {{ nombreProducto(linea.saleItemId, linea.productId) }}
                  <span class="text-gray-400">({{ formatCurrency(Number(linea.subtotal)) }})</span>
                  <span v-if="linea.reason"> · {{ linea.reason }}</span>
                </li>
              </ul>

              <p v-if="devolucion.note" class="mt-2 text-xs italic text-gray-500">{{ devolucion.note }}</p>
            </li>
          </ul>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <h3 class="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
            Copias impresas
          </h3>
          <div v-if="!impresiones.length" class="px-6 py-8 text-center text-sm text-gray-500">
            Aún no se ha impreso este ticket.
          </div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="copia in impresiones" :key="copia.id" class="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ copia.copyNumber === 1 ? 'Original' : `Copia ${copia.copyNumber}` }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ formatDateTime(copia.printedAt) }}
                  <span v-if="copia.printedBy">
                    · {{ copia.printedBy.firstName }} {{ copia.printedBy.lastName }}
                  </span>
                  · {{ copia.channel === 'THERMAL' ? 'Térmica USB' : 'Navegador' }}
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div v-if="ticketView && puedeImprimir" class="flex justify-center xl:justify-end print:block">
          <div ref="ticketEl">
            <ReceiptPreview
              :sale="ticketView"
              :company="companyStore.company"
              :template="companyStore.defaultTemplate"
              compact
            />
          </div>
        </div>
      </div>
    </template>

    <ReturnModal
      v-if="venta"
      v-model="mostrarDevolucion"
      :sale="venta"
    />

    <ConfirmModal
      v-if="mostrarAnulacion"
      title="Anular esta venta"
      :message="mensajeAnulacion"
      confirm-text="Sí, anular"
      type="danger"
      :is-loading="store.isActionLoading"
      @confirm="anular"
      @cancel="mostrarAnulacion = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSalesHistoryStore, type SaleReturn } from '~/stores/salesHistory'
import type { Sale, PaymentMethod } from '~/stores/sales'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import ReturnModal from '~/components/sales/ReturnModal.vue'
import ReceiptPreview from '~/components/receipt/ReceiptPreview.vue'
import { useCompanyStore } from '~/stores/company'
import { useReceiptPrint } from '~/composables/useReceiptPrint'
import { saleToReceiptView } from '~/utils/receipt-view'

definePageMeta({ requiredPermission: 'canViewSalesSummary' })

const route = useRoute()
const store = useSalesHistoryStore()
const authStore = useAuthStore()
const companyStore = useCompanyStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()
const { printSale, isPrinting } = useReceiptPrint()

const mostrarDevolucion = ref(false)
const mostrarAnulacion = ref(false)
const ticketEl = ref<HTMLElement | null>(null)
const ticketCopy = ref(0)

const saleId = computed(() => Number(route.params.id))
const venta = computed(() => store.currentSale)

onMounted(() => {
  cargar()
  companyStore.ensureProfile()
})
watch(saleId, () => cargar())

async function cargar() {
  const id = saleId.value
  if (!Number.isInteger(id) || id <= 0) {
    store.clearCurrent()
    return
  }
  await store.fetchSaleById(id)
}

const devueltas = (saleItemId: number) => store.returnedByItem[saleItemId] ?? 0

/**
 * Devolver exige venta cerrada y unidades pendientes. Se replican aquí las
 * mismas condiciones que el backend impone para no ofrecer un botón que solo
 * puede terminar en error.
 */
const puedeDevolver = computed(
  () =>
    !!venta.value &&
    authStore.can('canReturnSales') &&
    venta.value.flowStatus === 'COMPLETED' &&
    venta.value.status !== 'CANCELLED' &&
    store.hasReturnableItems,
)

const puedeAnular = computed(
  () =>
    !!venta.value &&
    authStore.can('canCancelSales') &&
    venta.value.status !== 'CANCELLED' &&
    venta.value.flowStatus !== 'CANCELLED',
)

const mensajeAnulacion = computed(() => {
  if (!venta.value) return ''
  const base = `Se reingresará al inventario todo lo vendido en ${venta.value.invoiceNumber || `#${venta.value.id}`}`
  const pagado = Number(venta.value.paidAmount)
  if (pagado > 0) {
    return `${base} y se devolverán ${formatCurrency(pagado)} desde tu caja. Esta acción no se puede deshacer.`
  }
  return `${base}. Esta acción no se puede deshacer.`
})

async function anular() {
  const ok = await store.cancelSale(saleId.value)
  if (ok) mostrarAnulacion.value = false
}

const montoReembolsado = (devolucion: SaleReturn) =>
  devolucion.refund.reduce((acc, r) => acc + Number(r.amount ?? 0), 0)

const nombreProducto = (saleItemId: number, productId: number) => {
  const item = venta.value?.items.find((i) => i.id === saleItemId)
  return item?.product?.name ?? `Producto #${productId}`
}

const etiquetaMetodo = (method: PaymentMethod | null) => {
  switch (method) {
    case 'CASH': return 'Efectivo'
    case 'CARD': return 'Tarjeta'
    case 'TRANSFER': return 'Transferencia'
    default: return '—'
  }
}

const puedeImprimir = computed(
  () => !!venta.value && venta.value.flowStatus !== 'DRAFT',
)

const impresiones = computed(() => venta.value?.receiptPrints ?? [])

const ticketView = computed(() => {
  if (!venta.value) return null
  const last = impresiones.value[impresiones.value.length - 1]
  return saleToReceiptView(venta.value, {
    copyNumber: ticketCopy.value || last?.copyNumber || 0,
  })
})

async function imprimir() {
  if (!venta.value) return
  await printSale(venta.value, {
    previewEl: ticketEl.value,
    onRegistered: (copyNumber) => {
      ticketCopy.value = copyNumber
    },
  })
  await store.fetchSaleById(venta.value.id)
}

const badgeEstado = (status: Sale['status']) => {
  const base = 'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider'
  switch (status) {
    case 'COMPLETED':
      return { class: `${base} bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400`, icon: 'ph:check-circle-bold', text: 'Completada' }
    case 'PARTIAL':
      return { class: `${base} bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400`, icon: 'ph:clock-countdown-bold', text: 'Parcial' }
    case 'PENDING':
      return { class: `${base} bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400`, icon: 'ph:warning-circle-bold', text: 'Pendiente' }
    case 'REFUNDED':
      return { class: `${base} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400`, icon: 'ph:arrow-u-up-left-bold', text: 'Devuelta' }
    case 'CANCELLED':
      return { class: `${base} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400`, icon: 'ph:prohibit-bold', text: 'Anulada' }
    default:
      return { class: base, icon: '', text: status }
  }
}
</script>
