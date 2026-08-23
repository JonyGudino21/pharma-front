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

definePageMeta({ requiredPermission: 'canSell' })

const sales = useSalesStore()
const { formatCurrency } = useCurrency()
const toast = useToast()
const { items, total, itemCount, isEmpty, selectedClient, isMutating, isBootstrapping, canChangeClient } = storeToRefs(sales)

const scannerRef = ref<HTMLInputElement | null>(null)
const scannerValue = ref('')

const showSearch = ref(false)
const showClient = ref(false)
const showPayment = ref(false)
const showReceipt = ref(false)
const completedSale = ref<Sale | null>(null)

const anyModalOpen = computed(() => showSearch.value || showClient.value || showPayment.value || showReceipt.value)
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
  showPayment.value = true
}

function openSearch() { showSearch.value = true }
function openClient() {
  if (!canChangeClient.value) {
    toast.warning('Para cambiar de cliente, primero descarta o cierra la venta actual.')
    return
  }
  showClient.value = true
}

async function onProductSelected(product: Product) {
  showSearch.value = false
  await sales.addProduct(product, 1)
  focusScanner()
}

function onClientSelected(client: Client | null) {
  sales.setClient(client)
  showClient.value = false
  focusScanner()
}

function onCompleted(sale: Sale) {
  showPayment.value = false
  completedSale.value = sale
  showReceipt.value = true
}

function newSale() {
  showReceipt.value = false
  completedSale.value = null
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
  if (showPayment.value) { showPayment.value = false; focusScanner(); return }
  focusScanner()
}

function printReceipt() {
  const s = completedSale.value
  if (!s) return
  const rows = s.items.map(i =>
    `<tr><td>${i.quantity}x ${i.product?.name ?? ''}</td><td style="text-align:right">${formatCurrency(Number(i.subtotal))}</td></tr>`
  ).join('')
  const win = window.open('', '_blank', 'width=320,height=600')
  if (!win) return
  win.document.write(`
    <html><head><title>Ticket ${s.invoiceNumber ?? s.id}</title>
    <style>body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:8px}
    h3{text-align:center;margin:4px 0}table{width:100%;border-collapse:collapse}
    hr{border:none;border-top:1px dashed #000;margin:6px 0}.tot{font-weight:bold;font-size:14px}</style>
    </head><body>
    <h3>PharmaPOS</h3>
    <p style="text-align:center">Ticket ${s.invoiceNumber ?? '#' + s.id}<br>${new Date(s.createdAt).toLocaleString('es-MX')}</p>
    <hr><table>${rows}</table><hr>
    <table><tr class="tot"><td>TOTAL</td><td style="text-align:right">${formatCurrency(Number(s.total))}</td></tr></table>
    <hr><p style="text-align:center">¡Gracias por su compra!</p>
    </body></html>`)
  win.document.close()
  win.focus()
  win.print()
}

useKeyboardShortcuts({
  F2: openPayment,
  F3: openSearch,
  F4: openClient,
  F9: discard,
  Escape: handleEscape,
})

onMounted(focusScanner)
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
                {{ selectedClient ? 'Cliente asignado' : 'Toca para asignar cliente (F4)' }}
              </p>
            </div>
            <Icon v-if="canChangeClient" name="ph:caret-right-bold" class="w-4 h-4 text-gray-400" />
            <Icon v-else name="ph:lock-simple-bold" class="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <!-- Totales -->
        <div class="flex-1 flex flex-col justify-end p-5 space-y-3">
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
    <PosPaymentModal v-if="showPayment" :client="selectedClient" @close="handleEscape" @completed="onCompleted" />

    <!-- Comprobante -->
    <div v-if="showReceipt && completedSale" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" @click="newSale"></div>
      <div class="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden text-center p-6">
        <div class="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-4">
          <Icon name="ph:check-circle-bold" class="w-9 h-9 text-success-600 dark:text-success-400" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">¡Venta completada!</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ completedSale.invoiceNumber ?? '#' + completedSale.id }} · {{ formatCurrency(Number(completedSale.total)) }}
        </p>
        <div class="flex gap-3 mt-6">
          <button
            class="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            @click="printReceipt"
          >
            <Icon name="ph:printer-bold" class="w-5 h-5" /> Imprimir
          </button>
          <button
            class="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            @click="newSale"
          >
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
