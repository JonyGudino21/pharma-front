<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSalesStore, type Sale } from '~/stores/sales'
import type { Product } from '~/stores/product'
import type { Client } from '~/stores/client'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'
import { useUpdateHold } from '~/composables/useAppUpdate'
import { useConnectivity } from '~/composables/useConnectivity'
import PosCart from '~/components/pos/PosCart.vue'
import PosSearchModal from '~/components/pos/PosSearchModal.vue'
import PosClientModal from '~/components/pos/PosClientModal.vue'
import PosPaymentModal from '~/components/pos/PosPaymentModal.vue'
import PosPrescriptionModal from '~/components/pos/PosPrescriptionModal.vue'
import PosDiscountModal from '~/components/pos/PosDiscountModal.vue'
import { useSettingsStore } from '~/stores/settings'
import RemissionModal from '~/components/receipt/RemissionModal.vue'
import type { SaleItem, DiscountRequest } from '~/stores/sales'
import ReceiptPreview from '~/components/receipt/ReceiptPreview.vue'
import { useCompanyStore } from '~/stores/company'
import { useAuthStore } from '~/stores/auth'
import { useReceiptPrint } from '~/composables/useReceiptPrint'
import { cartToReceiptView, saleToReceiptView } from '~/utils/receipt-view'

definePageMeta({ requiredPermission: 'canSell' })

const sales = useSalesStore()
const companyStore = useCompanyStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const toast = useToast()
const { printSale, afterSaleCompleted, isPrinting } = useReceiptPrint()
const { items, total, subtotal, discountTotal, taxTotal, paidAmount, balance, discountsLocked, itemCount, isEmpty, selectedClient, isMutating, isBootstrapping, canChangeClient, hasControlledItems } = storeToRefs(sales)

// ── Descuentos (Configuración › Descuentos) ────────────────────────────────
const settingsStore = useSettingsStore()
const discountCfg = computed(() => settingsStore.valuesOf('discounts'))
const canDiscount = computed(() => !!discountCfg.value?.enabled)

/** Qué se está descontando: una línea o toda la venta. */
const discountTarget = ref<{ item: SaleItem | null } | null>(null)

const discountProps = computed(() => {
  const t = discountTarget.value
  if (!t) return null
  if (t.item) {
    const i = t.item
    return {
      label: i.product?.name ?? `Producto #${i.productId}`,
      gross: Number(i.price) * i.quantity,
      cost: Number(i.costAtSale) * i.quantity,
      currentPercent: Number(i.discountPercent ?? 0),
    }
  }
  // Toda la venta: el % "actual" es el mayor de las líneas, como en el servidor.
  return {
    label: 'Toda la venta',
    gross: subtotal.value,
    cost: items.value.reduce((acc, i) => acc + Number(i.costAtSale) * i.quantity, 0),
    currentPercent: Math.max(0, ...items.value.map((i) => Number(i.discountPercent ?? 0))),
  }
})

function openDiscount(item: SaleItem | null) {
  if (discountsLocked.value) {
    toast.warning('Ya hay un pago registrado: el descuento ya no se puede cambiar.')
    return
  }
  discountTarget.value = { item }
}

function applyDiscount(req: DiscountRequest) {
  const t = discountTarget.value
  return sales.applyDiscount({ itemId: t?.item?.id }, req)
}

function onDiscountDone() {
  discountTarget.value = null
  toast.success('Descuento actualizado')
  focusScanner()
}

const scannerRef = ref<HTMLInputElement | null>(null)
const scannerValue = ref('')

const showSearch = ref(false)
const showClient = ref(false)
const showPayment = ref(false)
const showPrescription = ref(false)
const showReceipt = ref(false)
const showRemission = ref(false)
/** Copias de la nota de remisión emitidas para la venta que está en pantalla. */
const remissionCopies = ref(0)
const canRemission = computed(
  () => authStore.can('canPrintReceipt') && (settingsStore.valuesOf('remission')?.enabled ?? true),
)
const completedSale = ref<Sale | null>(null)
/** Cliente de la venta que se está cobrando (respaldo para ticket y nota). */
const clientAtCheckout = ref<Client | null>(null)
const ticketCopy = ref(0)
const ticketEl = ref<HTMLElement | null>(null)

const liveTicket = computed(() =>
  cartToReceiptView({
    showTaxBreakdown: settingsStore.valuesOf('taxes')?.showBreakdownOnTicket ?? true,
    sale: sales.sale,
    items: items.value,
    subtotal: Number(sales.sale?.subtotal ?? total.value),
    total: total.value,
    client: selectedClient.value,
    cashier: authStore.user,
  }),
)

const completedTicket = computed(() => {
  if (!completedSale.value) return null
  return saleToReceiptView(completedSale.value, {
    showTaxBreakdown: settingsStore.valuesOf('taxes')?.showBreakdownOnTicket ?? true,
    copyNumber: ticketCopy.value,
    fallbackClient: clientAtCheckout.value,
    fallbackCashier: authStore.user,
  })
})

// Sin conexión con el servidor no se puede cobrar: se avisa arriba (banner) y
// aquí se deshabilita Cobrar, en lugar de dejar que falle con un error genérico.
const connectivity = useConnectivity()

// Mientras haya una venta abierta o el comprobante en pantalla, no se ofrece
// recargar para actualizar la aplicación (ADR-0018).
useUpdateHold('pos', () =>
  showReceipt.value
    ? 'Hay un comprobante de venta en pantalla.'
    : !isEmpty.value
      ? 'Hay una venta en curso en el punto de venta.'
      : null,
)

const anyModalOpen = computed(() => showSearch.value || showClient.value || showPayment.value || showReceipt.value || showRemission.value || showPrescription.value || !!discountTarget.value)
const busy = computed(() => isMutating.value || isBootstrapping.value)

function focusScanner() {
  nextTick(() => scannerRef.value?.focus())
}

// Al deshabilitar el input durante una operación se pierde el foco, y el
// siguiente disparo del escáner se iría al vacío sin que el cajero lo note.
// En cuanto la operación termina, devolvemos el foco automáticamente.
watch(busy, (ocupado) => {
  if (!ocupado && !anyModalOpen.value) focusScanner()
})

async function onScan() {
  const raw = scannerValue.value.trim()
  scannerValue.value = ''
  if (!raw) return
  // Soporte de multiplicador: "3*7501234567890" agrega 3 unidades
  let qty = 1
  let code = raw
  const mult = raw.match(/^(\d+)\s*\*\s*(.+)$/)
  if (mult && mult[1] && mult[2]) {
    qty = parseInt(mult[1], 10)
    code = mult[2].trim()
  }
  // Tope al multiplicador. Un "99999*código" tecleado por error (o un escáner
  // que repite dígitos) intentaba agregar 99,999 unidades: el backend lo
  // rechazaba por stock, pero si había existencias suficientes pasaba y el
  // cajero cobraba una cifra absurda sin notarlo en la lista.
  const MAX_UNIDADES_POR_ESCANEO = 999
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_UNIDADES_POR_ESCANEO) {
    toast.warning(`La cantidad debe estar entre 1 y ${MAX_UNIDADES_POR_ESCANEO}.`)
    focusScanner()
    return
  }
  await sales.scanBarcode(code, qty)
  focusScanner()
}

function openPayment() {
  if (!connectivity.canOperate.value) {
    toast.warning('Sin conexión con el servidor: no se puede cobrar hasta que regrese.')
    return
  }
  if (isEmpty.value) {
    toast.warning('Agrega al menos un producto antes de cobrar.')
    return
  }
  // Se fija AQUÍ el cliente del cobro: al cerrar, el store limpia el carrito
  // (incluido el cliente) antes de que el comprobante lo necesite.
  clientAtCheckout.value = selectedClient.value
  if (hasControlledItems.value && !sales.prescription) {
    showPrescription.value = true
    return
  }
  showPayment.value = true
}

function onPrescriptionConfirmed() {
  showPrescription.value = false
  showPayment.value = true
}

function openSearch() { showSearch.value = true }
function openClient() {
  if (!canChangeClient.value) {
    toast.warning('La venta ya no es editable.')
    return
  }
  showClient.value = true
}

async function onProductSelected(product: Product) {
  showSearch.value = false
  await sales.addProduct(product, 1)
  focusScanner()
}

async function onClientSelected(client: Client | null) {
  showClient.value = false
  // Si ya hay venta viva, el backend re-precia los items con los precios del cliente
  await sales.setClient(client)
  focusScanner()
}

function onCompleted(sale: Sale) {
  showPayment.value = false
  completedSale.value = sale
  ticketCopy.value = 0
  remissionCopies.value = 0
  showReceipt.value = true
  // Perfil de esta caja: impresión automática y/o cajón. Nunca bloquea: la
  // venta ya está cobrada; si el dispositivo falla, se avisa y se reimprime.
  void afterSaleCompleted(sale, {
    onRegistered: (copyNumber) => {
      ticketCopy.value = copyNumber
    },
  })
}

function newSale() {
  showReceipt.value = false
  clientAtCheckout.value = null
  showRemission.value = false
  remissionCopies.value = 0
  completedSale.value = null
  ticketCopy.value = 0
  focusScanner()
}

async function discard() {
  if (isEmpty.value && !sales.sale) return
  if (!confirm('¿Descartar la venta actual? Esta acción no se puede deshacer.')) return
  await sales.discardSale()
  focusScanner()
}

function handleEscape() {
  if (discountTarget.value) { discountTarget.value = null; focusScanner(); return }
  if (showSearch.value) { showSearch.value = false; focusScanner(); return }
  if (showClient.value) { showClient.value = false; focusScanner(); return }
  if (showPrescription.value) { showPrescription.value = false; focusScanner(); return }
  if (showPayment.value) { showPayment.value = false; focusScanner(); return }
  focusScanner()
}

async function printReceipt() {
  const s = completedSale.value
  if (!s) return
  await printSale(s, {
    previewEl: ticketEl.value,
    onRegistered: (copyNumber) => {
      ticketCopy.value = copyNumber
    },
  })
}

/**
 * Un atajo de acción sólo corre si NO hay un modal abierto ni una operación en
 * curso.
 *
 * Antes los atajos se disparaban siempre: F9 descartaba la venta aunque el
 * botón estuviera deshabilitado por `busy` (a mitad de un cobro), y F3/F4
 * abrían un modal ENCIMA del de cobro, dejando dos capas y el foco perdido.
 * Escape queda fuera a propósito: su trabajo es precisamente cerrar modales.
 */
const soloSiLibre = (accion: () => unknown) => () => {
  if (anyModalOpen.value || busy.value) return
  void accion()
}

useKeyboardShortcuts({
  F2: soloSiLibre(openPayment),
  F3: soloSiLibre(openSearch),
  F4: soloSiLibre(openClient),
  F9: soloSiLibre(discard),
  Escape: handleEscape,
})

onMounted(async () => {
  focusScanner()
  companyStore.ensureProfile()
  // Reglas de descuento: si no cargan, el botón de descuento simplemente no aparece.
  void settingsStore.fetch('discounts').catch(() => null)
  void settingsStore.fetch('taxes').catch(() => null)
  // Nota de remisión: si no carga, el botón simplemente no aparece.
  void settingsStore.fetch('remission').catch(() => null)

  // RECUPERACIÓN DEL CARRITO. Antes, un F5 o una sesión caducada dejaban al
  // cajero con el carrito vacío mientras la venta DRAFT seguía viva en el
  // backend con todo lo capturado.
  //
  // No se espera antes de dar el foco al escáner: si el cajero ya está pasando
  // productos, no debe notar esta llamada. `resumeDraft` no sobreescribe un
  // carrito que ya empezó.
  const recuperado = await sales.resumeDraft()

  // Al adoptar un carrito el foco puede haberse perdido con el re-render de la
  // lista de productos. Sin esto el siguiente escaneo se iba al vacío.
  if (recuperado) {
    await nextTick()
    focusScanner()
  }
})
</script>

<template>
  <div class="h-[calc(100vh-8rem)] flex flex-col">
    <!-- Barra superior -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Punto de Venta</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Escanea, busca y cobra rápido</p>
      </div>
      <div class="hidden md:flex items-center gap-2 text-xs text-gray-400">
        <kbd class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">F2</kbd> Cobrar
        <kbd class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">F3</kbd> Buscar
        <kbd class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">F4</kbd> Cliente
        <kbd class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">F9</kbd> Descartar
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
      <!-- Panel izquierdo: escáner + carrito -->
      <section class="lg:col-span-8 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-2">
          <div class="relative flex-1">
            <Icon name="ph:barcode-bold" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <!--
              El input se DESHABILITA mientras haya una operación en vuelo.
              Antes, una ráfaga del escáner (20 lecturas en menos de un segundo)
              disparaba decenas de peticiones concurrentes que se pisaban entre
              sí y perdían unidades del carrito.
            -->
            <input
              ref="scannerRef"
              v-model="scannerValue"
              type="text"
              :disabled="busy"
              :placeholder="busy
                ? 'Procesando...'
                : 'Escanea un código de barras o escribe 3* para multiplicar cantidad...'"
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-wait"
              @keyup.enter="onScan"
            />
            <Icon
              v-if="busy"
              name="ph:spinner-gap-bold"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin"
            />
          </div>
          <button
            class="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            @click="openSearch"
          >
            <Icon name="ph:magnifying-glass-bold" class="w-5 h-5" />
            <span class="hidden sm:inline">Buscar</span>
          </button>
        </div>

        <PosCart
          :items="items"
          :busy="busy"
          @increment="sales.incrementItem"
          @decrement="sales.decrementItem"
          @remove="(i) => sales.removeItem(i.id)"
          :can-discount="canDiscount"
          :discounts-locked="discountsLocked"
          @discount="openDiscount"
        />
      </section>

      <!-- Panel derecho: resumen y cobro -->
      <aside class="lg:col-span-4 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Cliente -->
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <button
            class="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="!canChangeClient"
            @click="openClient"
          >
            <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
              <Icon name="ph:user-bold" class="w-5 h-5 text-primary-600 dark:text-primary-300" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-900 dark:text-gray-100 truncate">
                {{ selectedClient?.name ?? 'Público General' }}
              </p>
              <p class="text-xs text-gray-400">
                {{ selectedClient ? 'Cliente asignado · toca para cambiar' : 'Toca para asignar cliente (F4)' }}
              </p>
            </div>
            <Icon v-if="canChangeClient" name="ph:caret-right-bold" class="w-4 h-4 text-gray-400" />
            <Icon v-else name="ph:lock-simple-bold" class="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <!-- Totales -->
        <div class="flex-1 flex flex-col justify-end p-5 space-y-3 min-h-0">
          <div class="hidden xl:flex justify-center overflow-y-auto max-h-56 mb-2">
            <ReceiptPreview
              :sale="liveTicket"
              :company="companyStore.company"
              :template="companyStore.defaultTemplate"
              compact
            />
          </div>
          <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Artículos</span>
            <span class="tabular-nums">{{ itemCount }}</span>
          </div>
          <template v-if="discountTotal > 0">
            <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span class="tabular-nums">{{ formatCurrency(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm text-success-700 dark:text-success-400">
              <span>Descuentos</span>
              <span class="tabular-nums">− {{ formatCurrency(discountTotal) }}</span>
            </div>
          </template>
          <div class="flex justify-between items-end">
            <span class="text-gray-500 dark:text-gray-400">Total</span>
            <span class="text-4xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ formatCurrency(total) }}</span>
          </div>
          <p v-if="taxTotal > 0" class="text-right text-xs text-gray-400 tabular-nums">IVA incluido: {{ formatCurrency(taxTotal) }}</p>
          <!-- Abonos ya registrados en esta venta (p. ej. un cobro cuyo cierre
               falló): sin esto el carrito mostraba el total completo y el cajero
               no sabía que parte ya estaba pagada. -->
          <div
            v-if="paidAmount > 0"
            class="space-y-1 rounded-lg bg-success-500/10 px-3 py-2 text-sm"
            data-testid="pos-paid-summary"
          >
            <div class="flex justify-between text-success-800 dark:text-success-300">
              <span>Ya pagado</span>
              <span class="tabular-nums font-semibold">{{ formatCurrency(paidAmount) }}</span>
            </div>
            <div v-if="balance >= 0" class="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
              <span>Por cobrar</span>
              <span class="tabular-nums">{{ formatCurrency(balance) }}</span>
            </div>
            <div v-else class="flex justify-between font-semibold text-error-700 dark:text-error-300">
              <span>Pagado de más</span>
              <span class="tabular-nums">{{ formatCurrency(-balance) }}</span>
            </div>
          </div>
          <button
            v-if="canDiscount && !isEmpty"
            type="button"
            class="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-primary-700 hover:border-primary-400 hover:bg-primary-50/50 disabled:opacity-40 dark:border-gray-600 dark:text-primary-300 dark:hover:bg-primary-900/10"
            :disabled="busy || discountsLocked"
            @click="openDiscount(null)"
          >
            <Icon name="ph:percent-bold" class="mr-1 inline h-4 w-4" /> Descuento a toda la venta
          </button>
        </div>

        <!-- Acciones -->
        <div class="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <button
            class="w-full py-4 rounded-xl bg-primary-600 text-white text-lg font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            :disabled="isEmpty || busy || !connectivity.canOperate.value"
            :title="connectivity.canOperate.value ? undefined : 'Sin conexión con el servidor'"
            @click="openPayment"
          >
            <Icon name="ph:money-bold" class="w-6 h-6" />
            Cobrar (F2)
          </button>
          <button
            class="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-error-600 dark:text-error-400 font-medium hover:bg-error-50 dark:hover:bg-error-900/20 disabled:opacity-40 transition-colors"
            :disabled="isEmpty || busy"
            @click="discard"
          >
            Descartar venta (F9)
          </button>
        </div>
      </aside>
    </div>

    <!-- Modales -->
    <PosSearchModal v-if="showSearch" @close="handleEscape" @select="onProductSelected" />
    <PosClientModal v-if="showClient" @close="handleEscape" @select="onClientSelected" />
    <PosPrescriptionModal
      v-if="showPrescription"
      @close="handleEscape"
      @confirmed="onPrescriptionConfirmed"
    />
    <PosPaymentModal v-if="showPayment" :client="selectedClient" @close="handleEscape" @completed="onCompleted" />
    <PosDiscountModal
      v-if="discountTarget && discountProps"
      :label="discountProps.label"
      :gross="discountProps.gross"
      :cost="discountProps.cost"
      :current-percent="discountProps.currentPercent"
      :role="authStore.user?.role"
      :settings="discountCfg"
      :apply="applyDiscount"
      @close="handleEscape"
      @done="onDiscountDone"
    />

    <!-- Nota de remisión (hoja completa) sobre el comprobante -->
    <RemissionModal
      v-if="showRemission && completedSale"
      :sale="completedSale"
      :printed-copies="remissionCopies"
      :fallback-client="clientAtCheckout"
      @printed="(n) => (remissionCopies = n)"
      @close="showRemission = false"
    />

    <!-- Comprobante -->
    <div v-if="showReceipt && completedSale && completedTicket" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <!-- Identidad de la app (azul PharmaPOS, claro/oscuro). Antes era un verde
           y dorado fijos que no correspondían con ninguna otra pantalla. -->
      <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" @click="newSale"></div>
      <div class="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div class="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
          <Icon name="ph:check-circle-fill" class="h-7 w-7" />
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white">Venta cobrada</p>
        <p class="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
          {{ completedSale.invoiceNumber ?? '#' + completedSale.id }}
        </p>
        <div ref="ticketEl" class="flex max-h-[52vh] justify-center overflow-y-auto rounded-xl bg-gray-100 px-3 pb-3 pt-4 dark:bg-gray-900">
          <ReceiptPreview
            :sale="completedTicket"
            :company="companyStore.company"
            :template="companyStore.defaultTemplate"
          />
        </div>
        <button
          v-if="canRemission"
          class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:border-primary-500/30 dark:text-primary-300 dark:hover:bg-primary-500/10"
          data-testid="pos-open-remission"
          @click="showRemission = true"
        >
          <Icon name="ph:file-text-bold" class="w-5 h-5" />
          Nota de remisión (hoja carta)
        </button>
        <div class="flex gap-3 mt-3">
          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            :disabled="isPrinting"
            @click="printReceipt"
          >
            <Icon name="ph:printer-bold" class="w-5 h-5" />
            {{ isPrinting ? 'Imprimiendo…' : 'Imprimir' }}
          </button>
          <button
            class="flex-1 rounded-xl bg-primary-600 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
            @click="newSale"
          >
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
