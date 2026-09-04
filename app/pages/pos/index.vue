<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useSalesStore, type Sale } from '~/stores/sales'
import type { Product } from '~/stores/product'
import type { Client } from '~/stores/client'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'
import PosCart from '~/components/pos/PosCart.vue'
import PosSearchModal from '~/components/pos/PosSearchModal.vue'
import PosClientModal from '~/components/pos/PosClientModal.vue'
import PosPaymentModal from '~/components/pos/PosPaymentModal.vue'
import PosPrescriptionModal from '~/components/pos/PosPrescriptionModal.vue'
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
const { printSale, isPrinting } = useReceiptPrint()
const { items, total, itemCount, isEmpty, selectedClient, isMutating, isBootstrapping, canChangeClient, hasControlledItems } = storeToRefs(sales)

const scannerRef = ref<HTMLInputElement | null>(null)
const scannerValue = ref('')

const showSearch = ref(false)
const showClient = ref(false)
const showPayment = ref(false)
const showPrescription = ref(false)
const showReceipt = ref(false)
const completedSale = ref<Sale | null>(null)
const ticketCopy = ref(0)
const ticketEl = ref<HTMLElement | null>(null)

const liveTicket = computed(() =>
  cartToReceiptView({
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
    copyNumber: ticketCopy.value,
    fallbackClient: selectedClient.value,
    fallbackCashier: authStore.user,
  })
})

const anyModalOpen = computed(() => showSearch.value || showClient.value || showPayment.value || showReceipt.value || showPrescription.value)
const busy = computed(() => isMutating.value || isBootstrapping.value)

function focusScanner() {
  nextTick(() => scannerRef.value?.focus())
}

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
  await sales.scanBarcode(code, qty)
  focusScanner()
}

function openPayment() {
  if (isEmpty.value) {
    toast.warning('Agrega al menos un producto antes de cobrar.')
    return
  }
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
  showReceipt.value = true
}

function newSale() {
  showReceipt.value = false
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

useKeyboardShortcuts({
  F2: openPayment,
  F3: openSearch,
  F4: openClient,
  F9: discard,
  Escape: handleEscape,
})

onMounted(() => {
  focusScanner()
  companyStore.ensureProfile()
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
            <input
              ref="scannerRef"
              v-model="scannerValue"
              type="text"
              placeholder="Escanea un código de barras o escribe 3* para multiplicar cantidad..."
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary-500"
              @keyup.enter="onScan"
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
          <div class="flex justify-between items-end">
            <span class="text-gray-500 dark:text-gray-400">Total</span>
            <span class="text-4xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ formatCurrency(total) }}</span>
          </div>
        </div>

        <!-- Acciones -->
        <div class="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <button
            class="w-full py-4 rounded-xl bg-primary-600 text-white text-lg font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            :disabled="isEmpty || busy"
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

    <!-- Comprobante -->
    <div v-if="showReceipt && completedSale && completedTicket" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="fixed inset-0 bg-[#12261e]/70 backdrop-blur-sm" @click="newSale"></div>
      <div class="relative w-full max-w-md bg-[#12261e] rounded-2xl shadow-2xl overflow-hidden p-5 text-center">
        <p class="font-[Literata] text-[#f3e6c4] text-xl mb-1">Venta cobrada</p>
        <p class="text-[#c4a35a] text-xs tracking-[0.2em] uppercase font-mono mb-4">
          {{ completedSale.invoiceNumber ?? '#' + completedSale.id }}
        </p>
        <div ref="ticketEl" class="flex justify-center max-h-[55vh] overflow-y-auto">
          <ReceiptPreview
            :sale="completedTicket"
            :company="companyStore.company"
            :template="companyStore.defaultTemplate"
          />
        </div>
        <div class="flex gap-3 mt-5">
          <button
            class="flex-1 py-3 rounded-xl border border-[#c4a35a]/50 text-[#f3e6c4] font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            :disabled="isPrinting"
            @click="printReceipt"
          >
            <Icon name="ph:printer-bold" class="w-5 h-5" />
            {{ isPrinting ? 'Imprimiendo…' : 'Imprimir' }}
          </button>
          <button
            class="flex-1 py-3 rounded-xl bg-[#c4a35a] text-[#12261e] font-semibold hover:bg-[#d4b56a] transition-colors"
            @click="newSale"
          >
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
