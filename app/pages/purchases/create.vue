<template>
  <div class="space-y-6 pb-4 md:pb-20">
    <div class="page-header">
      <div class="min-w-0">
        <NuxtLink to="/purchases" class="text-sm text-gray-500 hover:text-primary-600 inline-flex items-center mb-2 py-1 transition-colors">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver al listado
        </NuxtLink>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:shopping-cart-bold" class="text-primary-600" /> Nueva Orden de Compra
        </h1>
      </div>
      <!-- En celular el botón vive en la barra fija inferior (siempre a la mano). -->
      <div class="page-actions hidden md:flex">
        <button
          @click="handleSubmit"
          :disabled="isSubmitting || !isFormValid"
          :title="blockingReason || undefined"
          class="btn-primary min-w-[150px]"
        >
          <Icon v-if="isSubmitting" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          <Icon v-else name="ph:floppy-disk-back-bold" class="mr-2" />
          Guardar Borrador
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <div class="lg:col-span-2 space-y-6 min-w-0">

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="ph:buildings-bold" class="text-gray-400" /> Datos del Proveedor
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="createSupplier" class="label-base">Proveedor *</label>
              <!--
                `options`, NO `suppliers`. `suppliers` es la tabla del directorio,
                paginada de 10 en 10: con este combo alimentado desde ahí, al
                proveedor número 11 en adelante no se le podía comprar.
              -->
              <select id="createSupplier" v-model="form.supplierId" required class="input-base cursor-pointer">
                <option :value="null" disabled>
                  {{ supplierStore.isLoadingOptions ? 'Cargando proveedores…' : 'Selecciona un proveedor...' }}
                </option>
                <option v-for="sup in supplierStore.options" :key="sup.id" :value="sup.id">
                  {{ sup.name }}
                </option>
              </select>
              <p v-if="supplierStore.optionsTruncated" class="mt-1 text-xs text-warning-600 dark:text-warning-400">
                La lista está recortada: hay más proveedores de los que caben aquí.
              </p>
            </div>
            <div>
              <label for="createInvoice" class="label-base">Folio de Factura / Ticket *</label>
              <div class="relative">
                <Icon name="ph:receipt-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="createInvoice" v-model="form.invoiceNumber" type="text" required autocomplete="off" class="input-base pl-10" placeholder="Ej: FAC-001" />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 flex flex-col md:min-h-[400px]">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="ph:package-bold" class="text-gray-400" /> Productos a Comprar
            <span v-if="form.items.length" class="ml-auto text-sm font-medium text-gray-500">{{ form.items.length }} partida{{ form.items.length === 1 ? '' : 's' }}</span>
          </h2>

          <div class="relative mb-4 sm:mb-6">
            <label for="createSearch" class="label-base">Agregar Producto</label>
            <div class="relative">
              <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="createSearch"
                v-model="searchQuery"
                @input="handleSearch"
                type="search"
                autocomplete="off"
                placeholder="Busca por nombre y elige de la lista..."
                class="input-base pl-10 pr-10 border-primary-200 focus:ring-primary-500"
              />
              <Icon v-if="isSearching" name="ph:spinner-gap-bold" class="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-spin" />
            </div>

            <div
              v-if="searchResults.length > 0 && searchQuery.trim() !== ''"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-72 overflow-y-auto"
            >
              <button
                v-for="product in searchResults" :key="product.id"
                @click="addProductToCart(product)"
                type="button"
                class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors flex justify-between items-center gap-3"
              >
                <div class="min-w-0">
                  <p class="font-bold text-gray-900 dark:text-white truncate">{{ product.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">SKU: {{ product.sku }} | Costo Ref: {{ formatCurrency(Number(product.cost)) }}</p>
                </div>
                <Icon name="ph:plus-circle-bold" class="shrink-0 text-primary-600 w-6 h-6" />
              </button>
            </div>
          </div>

          <div v-if="form.items.length === 0" class="flex-1 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700">
            Aún no has agregado productos a esta compra.
          </div>

          <template v-else>
            <!-- Laptop y tableta: tabla editable -->
            <div class="flex-1 table-wrap hidden md:block border border-gray-100 dark:border-gray-700 rounded-xl">
              <table class="w-full text-left border-collapse whitespace-nowrap">
                <thead class="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lote</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Caducidad</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Cant.</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-32">Costo Unit.</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Subtotal</th>
                    <th class="px-4 py-3 w-10"><span class="sr-only">Quitar</span></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <template v-for="(item, index) in form.items" :key="item.product.id + '-' + index">
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td class="px-4 py-3">
                        <p class="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{{ item.product.name }}</p>
                        <p class="text-xs text-gray-500">{{ item.product.sku }}</p>
                        <p v-if="item.product.controlled" class="text-[10px] font-bold uppercase text-error-600 dark:text-error-400 mt-0.5">Controlado</p>
                      </td>
                      <td class="px-4 py-3">
                        <input v-model="item.lotNumber" type="text" maxlength="40" aria-label="Lote" class="input-base p-1.5 text-xs font-mono uppercase w-28" :aria-invalid="!!itemLotError(item)" :required="lotRequired(item.product)" />
                      </td>
                      <td class="px-4 py-3">
                        <input v-model="item.expiryDate" type="date" aria-label="Caducidad" class="input-base p-1.5 text-xs w-36" :aria-invalid="!!itemLotError(item)" :required="lotRequired(item.product)" />
                      </td>
                      <td class="px-4 py-3 w-28">
                        <input
                          v-model.number="item.quantity"
                          type="number"
                          min="1"
                          aria-label="Cantidad"
                          class="input-base p-1.5 text-center text-sm font-bold w-full max-w-[80px]"
                          style="width: 100%; min-width: 60px;"
                        />
                      </td>

                      <td class="px-4 py-3">
                        <div class="relative">
                          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input v-model.number="item.cost" type="number" step="0.01" :min="MIN_ITEM_COST" aria-label="Costo unitario" class="input-base p-1.5 pl-6 text-sm" :aria-invalid="!!itemCostError(item)" />
                        </div>
                      </td>
                      <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white text-sm">
                        {{ formatCurrency(item.quantity * item.cost) }}
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button @click="removeItem(index)" type="button" class="p-2 rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 transition-colors" title="Quitar" :aria-label="`Quitar ${item.product.name}`">
                          <Icon name="ph:trash-bold" class="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                    <tr v-if="itemError(item)">
                      <td colspan="7" class="px-4 pb-3 pt-0 text-xs font-medium text-error-600 dark:text-error-400 whitespace-normal" role="alert">
                        {{ itemError(item) }}
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <!-- Celular: una tarjeta editable por partida -->
            <ul class="space-y-3 md:hidden" data-testid="purchase-create-items">
              <li v-for="(item, index) in form.items" :key="item.product.id + '-' + index" class="rounded-xl border p-3" :class="itemError(item) ? 'border-error-200 dark:border-error-800/50' : 'border-gray-200 dark:border-gray-700'">
                <div class="flex items-start gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-sm text-gray-900 dark:text-white break-words">{{ item.product.name }}</p>
                    <p class="text-xs text-gray-500 font-mono">{{ item.product.sku }}<span v-if="item.product.controlled" class="ml-2 font-sans text-[10px] font-bold uppercase text-error-600 dark:text-error-400">Controlado</span></p>
                  </div>
                  <button @click="removeItem(index)" type="button" class="shrink-0 -mr-1 -mt-1 p-2 rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30" :aria-label="`Quitar ${item.product.name}`">
                    <Icon name="ph:trash-bold" class="w-5 h-5" />
                  </button>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <label :for="`qty-${index}`" class="card-label">Cantidad</label>
                    <input :id="`qty-${index}`" v-model.number="item.quantity" type="number" inputmode="numeric" min="1" class="input-base text-center font-bold" />
                  </div>
                  <div>
                    <label :for="`cost-${index}`" class="card-label">Costo unit.</label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input :id="`cost-${index}`" v-model.number="item.cost" type="number" inputmode="decimal" step="0.01" :min="MIN_ITEM_COST" class="input-base pl-7" :aria-invalid="!!itemCostError(item)" />
                    </div>
                  </div>
                  <div>
                    <label :for="`lot-${index}`" class="card-label">Lote{{ lotRequired(item.product) ? ' *' : '' }}</label>
                    <input :id="`lot-${index}`" v-model="item.lotNumber" type="text" maxlength="40" autocomplete="off" class="input-base font-mono uppercase" :aria-invalid="!!itemLotError(item)" />
                  </div>
                  <div>
                    <label :for="`exp-${index}`" class="card-label">Caducidad{{ lotRequired(item.product) ? ' *' : '' }}</label>
                    <input :id="`exp-${index}`" v-model="item.expiryDate" type="date" class="input-base px-2" :aria-invalid="!!itemLotError(item)" />
                  </div>
                </div>
                <p v-if="itemError(item)" class="mt-2 text-xs font-medium text-error-600 dark:text-error-400" role="alert">{{ itemError(item) }}</p>
                <div class="card-row mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                  <span class="card-label">Subtotal</span>
                  <span class="font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(item.quantity * item.cost) }}</span>
                </div>
              </li>
            </ul>
          </template>
        </div>
      </div>

      <div class="space-y-6 min-w-0">

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="ph:wallet-bold" class="text-gray-400" /> Pagos (Abonos)
            </h2>
            <button @click="addPaymentRow" type="button" class="inline-flex items-center text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-3 py-2 rounded-lg transition-colors">
              <Icon name="ph:plus-bold" class="mr-1" /> Agregar
            </button>
          </div>

          <div v-if="form.payments.length === 0" class="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            Compra a crédito (Sin pago inicial)
          </div>

          <div v-else class="space-y-4">
            <div v-for="(payment, index) in form.payments" :key="index" class="bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold uppercase text-gray-500">Abono {{ index + 1 }}</span>
                <button @click="removePayment(index)" type="button" class="-mr-1 p-2 rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 transition-colors" :aria-label="`Quitar abono ${index + 1}`">
                  <Icon name="ph:x-bold" class="w-4 h-4" />
                </button>
              </div>

              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label :for="`pay-method-${index}`" class="text-[10px] font-bold text-gray-500 uppercase">Método</label>
                    <select :id="`pay-method-${index}`" v-model="payment.method" class="input-base px-2 cursor-pointer">
                      <option value="CASH">{{ paymentMethodLabel('CASH') }}</option>
                      <option value="TRANSFER">{{ paymentMethodLabel('TRANSFER') }}</option>
                      <option value="CARD">{{ paymentMethodLabel('CARD') }}</option>
                    </select>
                  </div>
                  <div>
                    <label :for="`pay-amount-${index}`" class="text-[10px] font-bold text-gray-500 uppercase">Monto</label>
                    <input :id="`pay-amount-${index}`" v-model.number="payment.amount" type="number" inputmode="decimal" step="0.01" min="0.01" class="input-base px-2" placeholder="0.00" :aria-invalid="!(payment.amount > 0)" />
                  </div>
                </div>
                <div>
                  <input v-model="payment.references" type="text" maxlength="120" aria-label="Referencia o comprobante" class="input-base px-2" placeholder="Referencia / Comprobante (Opcional)" />
                </div>
                <p v-if="!(payment.amount > 0)" class="text-xs font-medium text-error-600 dark:text-error-400">Indica un monto mayor a $0.00 o quita este abono.</p>
                <div v-if="payment.method === 'CASH'" class="flex items-center gap-1.5 text-xs text-warning-700 dark:text-warning-400 font-bold bg-warning-50 dark:bg-warning-900/20 p-2 rounded">
                  <Icon name="ph:warning-circle-bold" class="shrink-0" /> Requiere un turno de caja abierto.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-5 sm:p-6 text-white lg:sticky lg:top-24">
          <h2 class="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Resumen Financiero</h2>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between gap-3 text-gray-300">
              <span>Subtotal ({{ totalItemsCount }} ítems)</span>
              <span class="tabular-nums">{{ formatCurrency(cartTotal) }}</span>
            </div>
            <div class="flex justify-between gap-3 text-success-400">
              <span>Total Abonado</span>
              <span class="tabular-nums">- {{ formatCurrency(totalPaid) }}</span>
            </div>

            <div class="pt-3 mt-3 border-t border-gray-700">
              <div class="flex justify-between items-center gap-3 mb-1">
                <span class="font-bold text-gray-300 uppercase tracking-wider text-xs">Total Compra</span>
                <span class="text-xl font-black tabular-nums">{{ formatCurrency(cartTotal) }}</span>
              </div>
              <div class="flex justify-between items-center gap-3">
                <span class="font-bold text-warning-400 uppercase tracking-wider text-xs">Saldo Pendiente (Deuda)</span>
                <span class="text-2xl font-black text-warning-400 tabular-nums">{{ formatCurrency(calculatedBalance) }}</span>
              </div>
            </div>
          </div>
          <p v-if="blockingReason" class="mt-4 hidden md:block rounded-lg bg-white/10 px-3 py-2 text-xs text-gray-200">
            <Icon name="ph:info-bold" class="mr-1 inline" /> {{ blockingReason }}
          </p>
        </div>

      </div>
    </div>

    <!-- Celular: barra fija con el total y el botón de guardar. -->
    <div class="sticky bottom-0 z-20 -mx-3 border-t border-gray-200 bg-white/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur md:hidden dark:border-gray-700 dark:bg-gray-800/95">
      <p v-if="blockingReason" class="mb-2 text-xs text-gray-500 dark:text-gray-400">{{ blockingReason }}</p>
      <div class="flex items-center gap-3">
        <div class="min-w-0">
          <p class="card-label">Total</p>
          <p class="font-black tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(cartTotal) }}</p>
        </div>
        <button
          @click="handleSubmit"
          :disabled="isSubmitting || !isFormValid"
          class="btn-primary ml-auto flex-1"
        >
          <Icon v-if="isSubmitting" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          <Icon v-else name="ph:floppy-disk-back-bold" class="mr-2" />
          Guardar Borrador
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import { useRouter } from '#app'
import {
  usePurchaseStore,
  lotPairError,
  paymentMethodLabel,
  MIN_ITEM_COST,
  type CreatePurchasePayload,
  type PaymentMethod,
} from '~/stores/purchase'
import { useSupplierStore } from '~/stores/supplier'
import { useProductStore, type Product } from '~/stores/product'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
import { useUpdateHold } from '~/composables/useAppUpdate'

definePageMeta({ requiredPermission: 'canManagePurchases' })

const router = useRouter()
const purchaseStore = usePurchaseStore()
const supplierStore = useSupplierStore()
const productStore = useProductStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const isSubmitting = ref(false)

// Configuración › Inventario: con "exigir lote en toda entrada", cada partida
// lo necesita, no sólo los controlados. Mismo criterio que al recibir.
const settingsStore = useSettingsStore()
const lotRequired = (product: Product) =>
  product.controlled || (settingsStore.valuesOf('inventory')?.requireLotForAll ?? false)

type CartItem = { product: Product, quantity: number, cost: number, lotNumber: string, expiryDate: string }

// Estado del Formulario
const form = reactive({
  supplierId: null as number | null,
  invoiceNumber: '',
  items: [] as CartItem[],
  payments: [] as Array<{ method: PaymentMethod, amount: number, references: string }>
})

// Validación por partida: mismas reglas que PurchaseItemModal (y que el servidor).
// Antes aquí se aceptaba costo 0 y un lote sin caducidad (o al revés), y el
// servidor rechazaba la orden completa al guardar.
const itemCostError = (i: CartItem) =>
  Number(i.cost) >= MIN_ITEM_COST ? '' : `El costo unitario debe ser de al menos ${formatCurrency(MIN_ITEM_COST)}.`
const itemLotError = (i: CartItem) => {
  const pair = lotPairError(i.lotNumber, i.expiryDate)
  if (pair) return pair
  if (lotRequired(i.product) && !i.lotNumber.trim() && !i.expiryDate) {
    return i.product.controlled
      ? 'Medicamento controlado: captura lote y caducidad.'
      : 'La configuración de inventario exige lote y caducidad en toda entrada.'
  }
  return ''
}
const itemError = (i: CartItem) =>
  (Number.isInteger(i.quantity) && i.quantity >= 1 ? '' : 'La cantidad debe ser un número entero de al menos 1.')
  || itemCostError(i)
  || itemLotError(i)

// Una compra a medio capturar no debe perderse por una recarga para actualizar.
useUpdateHold('purchase-create', () =>
  form.items.length > 0 || form.payments.length > 0 ? 'Tienes una compra a medio capturar.' : null,
)

// Lógica del Buscador Autocompletado
const searchQuery = ref('')
const searchResults = ref<Product[]>([])
const isSearching = ref(false)
let searchTimeout: any = null

onMounted(async () => {
  void settingsStore.fetch('inventory').catch(() => null)
  // Opciones del combo, no la tabla paginada del directorio. Además, la versión
  // anterior escribía `supplierStore.filters.isActive = 'true'`, lo que dejaba
  // el filtro cambiado para la pantalla de proveedores al volver a ella.
  await supplierStore.fetchSupplierOptions()
})

const handleSearch = () => {
  clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    isSearching.value = false
    return
  }
  isSearching.value = true
  searchTimeout = setTimeout(async () => {
    searchResults.value = await productStore.searchProductsLocally({ 
      name: searchQuery.value, 
      limit: 5 // Solo mostramos los top 5 en el dropdown
    })
    isSearching.value = false
  }, 400)
}

const addProductToCart = (product: Product) => {
  if (!product.controlled) {
    const existingItem = form.items.find(i => i.product.id === product.id && !i.lotNumber)
    if (existingItem) {
      existingItem.quantity += 1
      searchQuery.value = ''
      searchResults.value = []
      return
    }
  }
  form.items.unshift({
    product,
    quantity: 1,
    cost: Number(product.cost),
    lotNumber: '',
    expiryDate: '',
  })
  searchQuery.value = ''
  searchResults.value = []
}

const removeItem = (index: number) => form.items.splice(index, 1)

// Lógica de Pagos
const addPaymentRow = () => {
  form.payments.push({ method: 'TRANSFER', amount: 0, references: '' })
}
const removePayment = (index: number) => form.payments.splice(index, 1)

// Cálculos Reactivos
const cartTotal = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0)
})

const totalPaid = computed(() => {
  return form.payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0)
})

const calculatedBalance = computed(() => Math.max(0, cartTotal.value - totalPaid.value))

const totalItemsCount = computed(() => form.items.reduce((sum, item) => sum + item.quantity, 0))

// Validación
/** Qué falta para poder guardar (se muestra junto al botón deshabilitado). */
const blockingReason = computed(() => {
  if (form.supplierId === null) return 'Selecciona el proveedor.'
  if (!form.invoiceNumber.trim()) return 'Escribe el folio de la factura o ticket.'
  if (form.items.length === 0) return 'Agrega al menos un producto.'
  if (form.items.some(i => itemError(i))) return 'Corrige las partidas marcadas en rojo.'
  if (form.payments.some(p => !(p.amount > 0))) return 'Hay un abono sin monto.'
  return ''
})

const isFormValid = computed(() => blockingReason.value === '')

// Envío a Backend
const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return
  isSubmitting.value = true

  try {
    // Armamos el payload exacto que exige CreatePurchaseDto
    const payload: CreatePurchasePayload = {
      supplierId: form.supplierId!,
      invoiceNumber: form.invoiceNumber.trim(),
      items: form.items.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        cost: i.cost,
        lotNumber: i.lotNumber.trim().toUpperCase() || undefined,
        expiryDate: i.expiryDate || undefined,
      })),
      // Solo enviamos array de pagos si realmente hay alguno configurado
      payments: form.payments.length > 0 ? form.payments.map(p => ({
        method: p.method,
        amount: Number(p.amount),
        references: p.references.trim() || undefined
      })) : undefined
    }

    const createdPurchase = await purchaseStore.createPurchase(payload)
    toast.success('Borrador de compra creado exitosamente.')
    
    // Magia: Tras crear, lo mandamos a la vista de Detalle Operativo de esa compra
    if (createdPurchase) {
      router.push(`/purchases/${createdPurchase.id}`)
    }
  } catch (error) {
    console.error("Error al crear compra")
  } finally {
    isSubmitting.value = false
  }
}
</script>