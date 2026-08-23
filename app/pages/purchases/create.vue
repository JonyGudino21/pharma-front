<template>
  <div class="space-y-6 pb-20">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div>
        <NuxtLink to="/purchases" class="text-sm text-gray-500 hover:text-primary-600 flex items-center mb-2 transition-colors">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver al listado
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:shopping-cart-bold" class="text-primary-600" /> Nueva Orden de Compra
        </h1>
      </div>
      <button 
        @click="handleSubmit" 
        :disabled="isSubmitting || !isFormValid"
        class="btn-primary shrink-0 min-w-[150px]"
      >
        <Icon v-if="isSubmitting" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
        <Icon v-else name="ph:floppy-disk-back-bold" class="mr-2" />
        Guardar Borrador
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div class="lg:col-span-2 space-y-6">
        
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="ph:buildings-bold" class="text-gray-400" /> Datos del Proveedor
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label-base">Proveedor *</label>
              <select v-model="form.supplierId" required class="input-base cursor-pointer">
                <option :value="null" disabled>Selecciona un proveedor...</option>
                <option v-for="sup in supplierStore.suppliers" :key="sup.id" :value="sup.id">
                  {{ sup.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="label-base">Folio de Factura / Ticket *</label>
              <div class="relative">
                <Icon name="ph:receipt-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model="form.invoiceNumber" type="text" required class="input-base pl-10" placeholder="Ej: FAC-001" />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col min-h-[400px]">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="ph:package-bold" class="text-gray-400" /> Productos a Comprar
          </h2>
          
          <div class="relative mb-6">
            <label class="label-base">Agregar Producto</label>
            <div class="relative">
              <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                v-model="searchQuery" 
                @input="handleSearch"
                type="text" 
                placeholder="Busca por nombre o SKU y selecciona de la lista..." 
                class="input-base pl-10 border-primary-200 focus:ring-primary-500"
              />
              <Icon v-if="isSearching" name="ph:spinner-gap-bold" class="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-spin" />
            </div>

            <div 
              v-if="searchResults.length > 0 && searchQuery.trim() !== ''" 
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
            >
              <button 
                v-for="product in searchResults" :key="product.id"
                @click="addProductToCart(product)"
                type="button"
                class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors flex justify-between items-center"
              >
                <div>
                  <p class="font-bold text-gray-900 dark:text-white">{{ product.name }}</p>
                  <p class="text-xs text-gray-500">SKU: {{ product.sku }} | Costo Ref: {{ formatCurrency(Number(product.cost)) }}</p>
                </div>
                <Icon name="ph:plus-circle-bold" class="text-primary-600 w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead class="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Cant.</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-32">Costo Unit.</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Subtotal</th>
                  <th class="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-if="form.items.length === 0">
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400 text-sm">
                    Aún no has agregado productos a esta compra.
                  </td>
                </tr>
                <tr v-else v-for="(item, index) in form.items" :key="item.product.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3">
                    <p class="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{{ item.product.name }}</p>
                    <p class="text-xs text-gray-500">{{ item.product.sku }}</p>
                  </td>
                  <td class="px-4 py-3 w-28">
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      class="input-base p-1.5 text-center text-sm font-bold w-full max-w-[80px]"
                      style="width: 100%; min-width: 60px;"
                    />
                  </td>
          
                  <td class="px-4 py-3">
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input v-model.number="item.cost" type="number" step="0.01" min="0" class="input-base p-1.5 pl-6 text-sm" />
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white text-sm">
                    {{ formatCurrency(item.quantity * item.cost) }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button @click="removeItem(index)" type="button" class="text-gray-400 hover:text-error-600 transition-colors" title="Quitar">
                      <Icon name="ph:trash-bold" class="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="ph:wallet-bold" class="text-gray-400" /> Pagos (Abonos)
            </h2>
            <button @click="addPaymentRow" type="button" class="text-xs font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 px-2 py-1 rounded transition-colors">
              + Agregar
            </button>
          </div>

          <div v-if="form.payments.length === 0" class="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            Compra a crédito (Sin pago inicial)
          </div>

          <div v-else class="space-y-4">
            <div v-for="(payment, index) in form.payments" :key="index" class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative">
              <button @click="removePayment(index)" type="button" class="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 text-gray-400 hover:text-error-600 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <Icon name="ph:x-circle-fill" class="w-5 h-5" />
              </button>
              
              <div class="space-y-3">
                <div class="flex gap-2">
                  <div class="flex-1">
                    <label class="text-[10px] font-bold text-gray-500 uppercase">Método</label>
                    <select v-model="payment.method" class="input-base p-2 text-sm cursor-pointer">
                      <option value="CASH">Efectivo</option>
                      <option value="TRANSFER">Transferencia</option>
                      <option value="CARD">Tarjeta</option>
                    </select>
                  </div>
                  <div class="flex-1">
                    <label class="text-[10px] font-bold text-gray-500 uppercase">Monto</label>
                    <input v-model.number="payment.amount" type="number" step="0.01" min="0.01" class="input-base p-2 text-sm" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <input v-model="payment.references" type="text" class="input-base p-2 text-xs" placeholder="Referencia / Comprobante (Opcional)" />
                </div>
                <div v-if="payment.method === 'CASH'" class="flex items-center gap-1.5 text-[10px] text-warning-600 font-bold bg-warning-50 p-1.5 rounded">
                  <Icon name="ph:warning-circle-bold" /> Requiere un turno de caja abierto.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white sticky top-24">
          <h2 class="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Resumen Financiero</h2>
          
          <div class="space-y-3 text-sm">
            <div class="flex justify-between text-gray-300">
              <span>Subtotal ({{ totalItemsCount }} ítems)</span>
              <span>{{ formatCurrency(cartTotal) }}</span>
            </div>
            <div class="flex justify-between text-success-400">
              <span>Total Abonado</span>
              <span>- {{ formatCurrency(totalPaid) }}</span>
            </div>
            
            <div class="pt-3 mt-3 border-t border-gray-700">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-gray-300 uppercase tracking-wider text-xs">Total Compra</span>
                <span class="text-xl font-black">{{ formatCurrency(cartTotal) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-bold text-warning-400 uppercase tracking-wider text-xs">Saldo Pendiente (Deuda)</span>
                <span class="text-2xl font-black text-warning-400">{{ formatCurrency(calculatedBalance) }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from '#app'
import { usePurchaseStore, type CreatePurchasePayload, type PaymentMethod } from '~/stores/purchase'
import { useSupplierStore } from '~/stores/supplier'
import { useProductStore, type Product } from '~/stores/product'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'

definePageMeta({ requiredPermission: 'canManagePurchases' })

const router = useRouter()
const purchaseStore = usePurchaseStore()
const supplierStore = useSupplierStore()
const productStore = useProductStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const isSubmitting = ref(false)

// Estado del Formulario
const form = reactive({
  supplierId: null as number | null,
  invoiceNumber: '',
  items: [] as Array<{ product: Product, quantity: number, cost: number }>,
  payments: [] as Array<{ method: PaymentMethod, amount: number, references: string }>
})

// Lógica del Buscador Autocompletado
const searchQuery = ref('')
const searchResults = ref<Product[]>([])
const isSearching = ref(false)
let searchTimeout: any = null

onMounted(async () => {
  // Cargamos proveedores para el select
  if (supplierStore.suppliers.length === 0) {
    supplierStore.filters.isActive = 'true'
    await supplierStore.fetchSuppliers(1)
  }
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
  // Evitar duplicados en la lista (Si existe, le sumamos 1 a la cantidad)
  const existingItem = form.items.find(i => i.product.id === product.id)
  if (existingItem) {
    existingItem.quantity += 1
  } else {
    form.items.unshift({
      product,
      quantity: 1,
      cost: Number(product.cost) // Sugerimos el último costo conocido
    })
  }
  // Limpiamos buscador
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
const isFormValid = computed(() => {
  return form.supplierId !== null 
      && form.invoiceNumber.trim() !== '' 
      && form.items.length > 0 
      && form.items.every(i => i.quantity > 0 && i.cost >= 0)
      && form.payments.every(p => p.amount > 0)
})

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
        cost: i.cost
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