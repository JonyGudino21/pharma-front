<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/sales"
        class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
        title="Volver al historial"
        aria-label="Volver al historial"
      >
        <Icon name="ph:arrow-left-bold" class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Detalle de venta</h1>
    </div>

    <div v-if="store.detailLoading && !venta" class="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 text-center border border-gray-100 dark:border-gray-700">
      <Icon name="ph:spinner-gap-bold" class="w-10 h-10 animate-spin mx-auto mb-3 text-primary-500" />
      <p class="text-gray-500">Cargando la venta...</p>
    </div>

    <!--
      "No se pudo consultar" ≠ "no existe". Antes, un 500 o un corte de red
      dejaba `currentSale` en null y esta pantalla afirmaba "No se encontró esta
      venta" sobre una venta que existe perfectamente. Para un ticket que el
      cliente tiene en la mano, eso es una acusación, no un mensaje de error.
    -->
    <div v-else-if="store.detailError" class="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 text-center border border-error-500/40">
      <Icon name="ph:cloud-slash-fill" class="w-12 h-12 mx-auto mb-3 text-error-500" />
      <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
        {{ store.detailError.mensaje }}
      </p>
      <p class="mt-1 text-xs text-gray-500">
        No pudimos consultar la venta. No significa que no exista.
      </p>
      <button
        v-if="store.detailError.reintentable"
        type="button"
        class="mt-3 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        @click="store.retryDetail()"
      >
        <Icon name="ph:arrow-clockwise-bold" />
        Reintentar
      </button>
      <code
        v-if="store.detailError.requestId"
        class="mt-3 block wrap-break-word font-mono text-[11px] text-gray-500 select-all"
      >
        {{ store.detailError.requestId }}
      </code>
    </div>

    <div v-else-if="!venta" class="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 text-center border border-gray-100 dark:border-gray-700">
      <Icon name="ph:receipt-duotone" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
      <p class="text-gray-500">No se encontró esta venta.</p>
    </div>

    <template v-else>
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
          <div class="space-y-3 min-w-0">
            <div class="flex items-center gap-x-3 gap-y-2 flex-wrap">
              <h2 class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white break-all">
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

            <p v-if="venta.note" class="text-sm text-gray-500 italic break-words">{{ venta.note }}</p>
          </div>

          <!-- Celular: acciones a todo el ancho (dos por fila desde 400 px); laptop: fila. -->
          <div
            v-if="puedeImprimir || puedeRemision || puedeDevolver || puedeAnular || puedeRevender"
            class="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 sm:flex sm:flex-wrap shrink-0 print:hidden"
          >
            <button
              v-if="puedeImprimir"
              class="btn-secondary"
              data-testid="print-ticket"
              :disabled="isPrinting"
              @click="imprimir"
            >
              <Icon name="ph:printer-bold" class="mr-2" />
              {{ isPrinting ? 'Imprimiendo…' : 'Imprimir ticket' }}
            </button>

            <button
              v-if="puedeRemision"
              class="btn-secondary"
              data-testid="open-remission"
              @click="mostrarRemision = true"
            >
              <Icon name="ph:file-text-bold" class="mr-2" />
              Nota de remisión
            </button>

            <button
              v-if="puedeRevender"
              :class="venta.flowStatus === 'CANCELLED' ? 'btn-primary' : 'btn-secondary'"
              :disabled="pos.isBootstrapping"
              title="Crea una venta nueva en el punto de venta con este cliente y estos productos, con los precios y existencias de hoy"
              data-testid="sale-reorder"
              @click="revender"
            >
              <Icon :name="pos.isBootstrapping ? 'ph:spinner-gap-bold' : 'ph:arrow-clockwise-bold'" class="mr-2" :class="{ 'animate-spin': pos.isBootstrapping }" />
              {{ etiquetaRevender }}
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
              class="flex items-center justify-center px-4 py-2 rounded-lg font-medium text-white bg-error-600 hover:bg-error-700 transition-colors"
              @click="mostrarAnulacion = true"
            >
              <Icon name="ph:prohibit-bold" class="mr-2" /> Anular venta
            </button>
          </div>
        </div>

        <!-- gap-px sobre fondo gris: líneas divisorias correctas tanto en 2 columnas (celular) como en 4. -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-px border-t border-gray-100 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
          <div class="p-3 sm:p-4 text-center bg-white dark:bg-gray-800 min-w-0">
            <p class="text-xs font-semibold text-gray-500 uppercase">Total</p>
            <p class="text-lg sm:text-xl font-black tabular-nums text-gray-900 dark:text-white mt-1 break-words">{{ formatCurrency(Number(venta.total)) }}</p>
          </div>
          <div class="p-3 sm:p-4 text-center bg-white dark:bg-gray-800 min-w-0">
            <p class="text-xs font-semibold text-gray-500 uppercase">Pagado</p>
            <p class="text-lg sm:text-xl font-black tabular-nums text-success-600 dark:text-success-400 mt-1 break-words">{{ formatCurrency(Number(venta.paidAmount)) }}</p>
          </div>
          <div class="p-3 sm:p-4 text-center bg-white dark:bg-gray-800 min-w-0">
            <p class="text-xs font-semibold text-gray-500 uppercase">Saldo</p>
            <p
              class="text-lg sm:text-xl font-black tabular-nums mt-1 break-words"
              :class="Number(venta.balance) > 0 ? 'text-error-600 dark:text-error-400' : 'text-gray-400'"
            >
              {{ formatCurrency(Number(venta.balance)) }}
            </p>
          </div>
          <div class="p-3 sm:p-4 text-center bg-white dark:bg-gray-800 min-w-0">
            <p class="text-xs font-semibold text-gray-500 uppercase">Reembolsado</p>
            <p
              class="text-lg sm:text-xl font-black tabular-nums mt-1 break-words"
              :class="store.totalRefunded > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400'"
            >
              {{ formatCurrency(store.totalRefunded) }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <h3 class="px-4 sm:px-6 py-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
          Productos
        </h3>
        <div class="table-wrap hidden @4xl:block">
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
                  <p v-if="Number(item.discountPercent ?? 0) > 0" class="mt-1 text-xs text-success-700 dark:text-success-400">
                    Descuento {{ Number(item.discountPercent) }}% (−{{ formatCurrency(Number(item.discount)) }})
                    <template v-if="item.discountReason"> · {{ item.discountReason }}</template>
                    <template v-if="item.discountAppliedBy"> · aplicó {{ item.discountAppliedBy.firstName }} {{ item.discountAppliedBy.lastName }}</template>
                    <template v-if="item.discountAuthorizedBy"> · autorizó {{ item.discountAuthorizedBy.firstName }} {{ item.discountAuthorizedBy.lastName }}</template>
                  </p>
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

        <!-- Celular: un renglón por producto -->
        <ul class="card-list @4xl:hidden" data-testid="sale-items-cards">
          <li v-for="item in venta.items" :key="item.id" class="px-4 py-3">
            <div class="card-row">
              <p class="min-w-0 font-medium text-gray-900 dark:text-white break-words">
                {{ item.product?.name || `Producto #${item.productId}` }}
              </p>
              <p class="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(item.subtotal)) }}</p>
            </div>
            <div class="card-row mt-0.5">
              <p class="card-label min-w-0 truncate">
                {{ item.quantity }} × {{ formatCurrency(Number(item.price)) }}<template v-if="item.product?.sku"> · {{ item.product.sku }}</template>
              </p>
              <span
                v-if="devueltas(item.id) > 0"
                class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400"
              >
                Devuelto {{ devueltas(item.id) }} de {{ item.quantity }}
              </span>
            </div>
            <p v-if="Number(item.discountPercent ?? 0) > 0" class="mt-1 text-xs text-success-700 dark:text-success-400">
              Descuento {{ Number(item.discountPercent) }}% (−{{ formatCurrency(Number(item.discount)) }})
              <template v-if="item.discountReason"> · {{ item.discountReason }}</template>
              <template v-if="item.discountAppliedBy"> · aplicó {{ item.discountAppliedBy.firstName }} {{ item.discountAppliedBy.lastName }}</template>
              <template v-if="item.discountAuthorizedBy"> · autorizó {{ item.discountAuthorizedBy.firstName }} {{ item.discountAuthorizedBy.lastName }}</template>
            </p>
          </li>
        </ul>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <h3 class="px-4 sm:px-6 py-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
            Pagos recibidos
          </h3>
          <div v-if="!venta.payments || venta.payments.length === 0" class="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
            Esta venta no registra pagos.
          </div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="pago in venta.payments" :key="pago.id" class="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
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
          <h3 class="px-4 sm:px-6 py-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
            Devoluciones
          </h3>
          <div v-if="venta.saleReturn.length === 0" class="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
            Esta venta no tiene devoluciones.
          </div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="devolucion in venta.saleReturn" :key="devolucion.id" class="px-4 sm:px-6 py-4">
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
          <h3 class="px-4 sm:px-6 py-4 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
            Copias impresas
          </h3>
          <div v-if="!impresiones.length" class="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
            Aún no se ha impreso ningún comprobante de esta venta.
          </div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="copia in impresiones" :key="copia.id" class="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
              <div class="min-w-0">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ copia.document === 'REMISSION' ? 'Nota de remisión' : 'Ticket' }} ·
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

        <!-- Vista previa sólo cuando el ticket se puede imprimir (no en anuladas). -->
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

    <RemissionModal
      v-if="mostrarRemision && venta"
      :sale="venta"
      :printed-copies="copiasRemision"
      :returned-total="totalDevuelto"
      @printed="cargar"
      @close="mostrarRemision = false"
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
import { useSalesStore, type Sale, type PaymentMethod } from '~/stores/sales'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import ReturnModal from '~/components/sales/ReturnModal.vue'
import ReceiptPreview from '~/components/receipt/ReceiptPreview.vue'
import { useCompanyStore } from '~/stores/company'
import { useReceiptPrint } from '~/composables/useReceiptPrint'
import { saleToReceiptView } from '~/utils/receipt-view'
import { useSettingsStore } from '~/stores/settings'
import RemissionModal from '~/components/receipt/RemissionModal.vue'

definePageMeta({ requiredPermission: 'canViewSalesHistory' })

const route = useRoute()
const store = useSalesHistoryStore()
const authStore = useAuthStore()
const companyStore = useCompanyStore()
const settingsStore = useSettingsStore()
void settingsStore.fetch('taxes').catch(() => null)
void settingsStore.fetch('remission').catch(() => null)
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()
const { printSale, isPrinting } = useReceiptPrint()

const mostrarDevolucion = ref(false)
const mostrarAnulacion = ref(false)
const mostrarRemision = ref(false)
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

/**
 * VOLVER A VENDER (anulada) o REPETIR (cobrada): arma en el punto de venta una
 * venta nueva con el mismo cliente y productos, con precios y existencias de
 * hoy. Necesita poder vender.
 */
const pos = useSalesStore()
const puedeRevender = computed(
  () =>
    !!venta.value &&
    authStore.can('canSell') &&
    (venta.value.flowStatus === 'CANCELLED' || venta.value.flowStatus === 'COMPLETED'),
)
const etiquetaRevender = computed(() =>
  venta.value?.flowStatus === 'CANCELLED' ? 'Volver a vender' : 'Repetir venta',
)
async function revender() {
  const v = venta.value
  if (!v) return
  const r = await pos.reorderFrom(v.id, v.invoiceNumber || `#${v.id}`)
  if (r) await navigateTo('/pos')
}

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

/**
 * Ticket: venta cerrada y vigente + permiso de impresión. Antes sólo se
 * excluían los borradores: en una venta anulada el botón y la vista previa
 * seguían visibles (al pulsarlo sólo avisaba) y no se revisaba `canPrintReceipt`,
 * a diferencia de la nota de remisión.
 */
const puedeImprimir = computed(
  () =>
    !!venta.value &&
    venta.value.flowStatus !== 'DRAFT' &&
    venta.value.status !== 'CANCELLED' &&
    venta.value.flowStatus !== 'CANCELLED' &&
    authStore.can('canPrintReceipt'),
)

const impresiones = computed(() => venta.value?.receiptPrints ?? [])

// Los registros anteriores a la nota de remisión no traen `document`: son tickets.
const impresionesTicket = computed(() => impresiones.value.filter((c) => (c.document ?? 'TICKET') === 'TICKET'))
const copiasRemision = computed(() => impresiones.value.filter((c) => c.document === 'REMISSION').length)

/** La nota exige venta cobrada y no anulada, que el gerente no la haya apagado y permiso de impresión. */
const puedeRemision = computed(
  () =>
    // puedeImprimir ya exige venta vigente (no borrador ni anulada) y canPrintReceipt.
    puedeImprimir.value &&
    (settingsStore.valuesOf('remission')?.enabled ?? true),
)

/** Importe ya devuelto (suma de reembolsos), para advertirlo en la nota. */
const totalDevuelto = computed(() =>
  (venta.value?.saleReturn ?? []).reduce((acc, d) => acc + montoReembolsado(d), 0),
)

const ticketView = computed(() => {
  if (!venta.value) return null
  const last = impresionesTicket.value[impresionesTicket.value.length - 1]
  return saleToReceiptView(venta.value, {
    copyNumber: ticketCopy.value || last?.copyNumber || 0,
    showTaxBreakdown: settingsStore.valuesOf('taxes')?.showBreakdownOnTicket ?? true,
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
