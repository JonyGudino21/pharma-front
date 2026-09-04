<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      
      <div class="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:package-bold" class="text-primary-600" />
          {{ isEditing ? 'Editar Partida' : 'Agregar Producto' }}
        </h2>
      </div>

      <form @submit.prevent="handleSubmit" id="itemForm" class="p-6 space-y-5">
        
        <div v-if="!isEditing" class="relative">
          <label class="label-base">Buscar Producto *</label>
          <div class="relative">
            <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              v-model="searchQuery" 
              @input="handleSearch"
              type="text" 
              required
              placeholder="Nombre o SKU..." 
              class="input-base pl-10"
            />
          </div>
          <div v-if="searchResults.length > 0" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
            <button 
              v-for="product in searchResults" :key="product.id"
              @click="selectProduct(product)"
              type="button"
              class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
            >
              <p class="font-bold text-gray-900 dark:text-white">{{ product.name }}</p>
              <p class="text-xs text-gray-500">SKU: {{ product.sku }} | Costo: {{ formatCurrency(Number(product.cost)) }}</p>
            </button>
          </div>
        </div>

        <div v-if="selectedProduct || isEditing" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <p class="font-bold text-blue-900 dark:text-blue-100">{{ isEditing ? itemToEdit?.product.name : selectedProduct?.name }}</p>
          <p class="text-xs font-mono text-blue-600 dark:text-blue-400">SKU: {{ isEditing ? itemToEdit?.product.sku : selectedProduct?.sku }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label-base">Cantidad *</label>
            <input v-model.number="form.quantity" type="number" min="1" required class="input-base text-center font-bold" />
          </div>
          <div>
            <label class="label-base">Costo Unitario *</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input v-model.number="form.cost" type="number" step="0.01" min="0.01" required class="input-base pl-8" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label-base">{{ isControlled ? 'Lote *' : 'Lote' }}</label>
            <input v-model="form.lotNumber" type="text" maxlength="40" class="input-base uppercase" :required="isControlled" placeholder="FAB-2026-01" />
          </div>
          <div>
            <label class="label-base">{{ isControlled ? 'Caducidad *' : 'Caducidad' }}</label>
            <input v-model="form.expiryDate" type="date" class="input-base" :required="isControlled" />
          </div>
        </div>
        <p v-if="isControlled" class="text-xs text-error-600 font-medium">
          Medicamento controlado: lote y caducidad son obligatorios para recibirlo.
        </p>

        <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg flex justify-between items-center border border-gray-100 dark:border-gray-700">
          <span class="text-sm font-semibold text-gray-600 dark:text-gray-400">Subtotal de Partida</span>
          <span class="text-lg font-black text-gray-900 dark:text-white">{{ formatCurrency(form.quantity * form.cost) }}</span>
        </div>
      </form>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
        <button type="button" @click="close" class="btn-secondary">Cancelar</button>
        <button type="submit" form="itemForm" :disabled="isLoading || (!isEditing && !selectedProduct)" class="btn-primary">
          <Icon v-if="isLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          {{ isEditing ? 'Actualizar' : 'Agregar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { usePurchaseStore, type PurchaseItem } from '~/stores/purchase'
import { useProductStore, type Product } from '~/stores/product'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ modelValue: boolean, purchaseId: number, itemToEdit?: PurchaseItem | null }>()
const emit = defineEmits(['update:modelValue'])

const store = usePurchaseStore()
const productStore = useProductStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const isLoading = ref(false)
const isEditing = computed(() => !!props.itemToEdit)

// Búsqueda
const searchQuery = ref('')
const searchResults = ref<Product[]>([])
let searchTimeout: any = null
const selectedProduct = ref<Product | null>(null)

const form = reactive({ quantity: 1, cost: 0, lotNumber: '', expiryDate: '' })
const isControlled = computed(() =>
  !!(props.itemToEdit?.product.controlled || selectedProduct.value?.controlled),
)

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.itemToEdit) {
      form.quantity = props.itemToEdit.quantity
      form.cost = Number(props.itemToEdit.cost)
      form.lotNumber = props.itemToEdit.lotNumber ?? ''
      form.expiryDate = props.itemToEdit.expiryDate ? String(props.itemToEdit.expiryDate).slice(0, 10) : ''
    } else {
      searchQuery.value = ''
      searchResults.value = []
      selectedProduct.value = null
      form.quantity = 1
      form.cost = 0
      form.lotNumber = ''
      form.expiryDate = ''
    }
  }
})

const handleSearch = () => {
  clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) { searchResults.value = []; return }
  searchTimeout = setTimeout(async () => {
    searchResults.value = await productStore.searchProductsLocally({ name: searchQuery.value, limit: 5 })
  }, 400)
}

const selectProduct = (p: Product) => {
  selectedProduct.value = p
  searchQuery.value = p.name
  searchResults.value = []
  form.cost = Number(p.cost)
}

const handleSubmit = async () => {
  if (form.quantity <= 0 || form.cost < 0) return
  if (isControlled.value && (!form.lotNumber.trim() || !form.expiryDate)) {
    toast.error('El medicamento controlado requiere lote y caducidad.')
    return
  }
  isLoading.value = true

  const lotPayload = form.lotNumber.trim() && form.expiryDate
    ? { lotNumber: form.lotNumber.trim(), expiryDate: form.expiryDate }
    : { lotNumber: undefined, expiryDate: undefined }

  try {
    if (isEditing.value && props.itemToEdit) {
      await store.updateItem(props.purchaseId, props.itemToEdit.id, { quantity: form.quantity, cost: form.cost, ...lotPayload })
      toast.success('Ítem actualizado.')
    } else if (selectedProduct.value) {
      await store.addItem(props.purchaseId, { productId: selectedProduct.value.id, quantity: form.quantity, cost: form.cost, ...lotPayload })
      toast.success('Producto agregado a la compra.')
    }
    close()
  } catch (error) {
    console.error("Error gestionando ítem")
  } finally {
    isLoading.value = false
  }
}

const close = () => emit('update:modelValue', false)
</script>