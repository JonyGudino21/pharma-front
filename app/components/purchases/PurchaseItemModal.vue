<template>
  <div v-if="modelValue" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="purchaseItemTitle">
    <div class="modal-panel sm:max-w-md">

      <div class="modal-header">
        <h2 id="purchaseItemTitle" class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:package-bold" class="text-primary-600" />
          {{ isEditing ? 'Editar Partida' : 'Agregar Producto' }}
        </h2>
        <button type="button" aria-label="Cerrar" @click="close" class="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" id="itemForm" novalidate class="modal-body space-y-5">

        <PurchaseProductPicker
          v-if="!isEditing"
          input-id="purchaseItemSearch"
          :label="selectedProduct ? 'Cambiar producto' : 'Buscar producto *'"
          @select="selectProduct"
          @create="newProduct = $event"
        />

        <div v-if="selectedProduct || isEditing" class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800/30">
          <p class="font-bold break-words text-primary-900 dark:text-primary-100">{{ isEditing ? itemToEdit?.product.name : selectedProduct?.name }}</p>
          <p class="text-xs font-mono text-primary-600 dark:text-primary-400">SKU: {{ isEditing ? itemToEdit?.product.sku : selectedProduct?.sku }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label for="purchaseItemQty" class="label-base">Cantidad *</label>
            <input id="purchaseItemQty" v-model.number="form.quantity" type="number" inputmode="numeric" min="1" step="1" required class="input-base text-center font-bold" :aria-invalid="!!qtyError" />
          </div>
          <div>
            <label for="purchaseItemCost" class="label-base">Costo Unitario *</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input id="purchaseItemCost" v-model.number="form.cost" type="number" inputmode="decimal" step="0.01" :min="MIN_ITEM_COST" required class="input-base pl-8" :aria-invalid="!!costError" aria-describedby="purchaseItemCostError" />
            </div>
          </div>
        </div>
        <p v-if="submitted && (qtyError || costError)" id="purchaseItemCostError" class="-mt-3 text-xs text-error-600 dark:text-error-400" role="alert">
          {{ qtyError || costError }}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label for="purchaseItemLot" class="label-base">{{ lotRequired ? 'Lote *' : 'Lote' }}</label>
            <input id="purchaseItemLot" v-model="form.lotNumber" type="text" maxlength="40" autocomplete="off" class="input-base uppercase font-mono" placeholder="FAB-2026-01" :aria-invalid="!!lotError" aria-describedby="purchaseItemLotHelp" />
          </div>
          <div>
            <label for="purchaseItemExpiry" class="label-base">{{ lotRequired ? 'Caducidad *' : 'Caducidad' }}</label>
            <input id="purchaseItemExpiry" v-model="form.expiryDate" type="date" class="input-base" :aria-invalid="!!lotError" aria-describedby="purchaseItemLotHelp" />
          </div>
        </div>
        <!-- Un solo mensaje para el par lote/caducidad (antes, si faltaba uno, ambos se descartaban sin aviso). -->
        <p v-if="shownLotError" id="purchaseItemLotHelp" class="-mt-3 text-xs font-medium text-error-600 dark:text-error-400" role="alert">
          {{ shownLotError }}
        </p>
        <p v-else-if="isControlled" id="purchaseItemLotHelp" class="-mt-3 text-xs text-error-600 dark:text-error-400 font-medium">
          Medicamento controlado: lote y caducidad son obligatorios para recibirlo.
        </p>
        <p v-else-if="requireLotForAll" id="purchaseItemLotHelp" class="-mt-3 text-xs text-error-600 dark:text-error-400 font-medium">
          La configuración de inventario exige lote y caducidad en toda entrada: sin ellos la compra no se podrá recibir.
        </p>
        <p v-else id="purchaseItemLotHelp" class="-mt-3 text-xs text-gray-500 dark:text-gray-400">
          Opcionales, pero van juntos: captura ambos o ninguno.<template v-if="isEditing && props.itemToEdit?.lotNumber"> Para quitar el lote, deja los dos vacíos.</template>
        </p>

        <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg flex justify-between items-center gap-3 border border-gray-100 dark:border-gray-700">
          <span class="text-sm font-semibold text-gray-600 dark:text-gray-400">Subtotal de Partida</span>
          <span class="text-lg font-black text-gray-900 dark:text-white tabular-nums">{{ formatCurrency((Number(form.quantity) || 0) * (Number(form.cost) || 0)) }}</span>
        </div>
      </form>

      <div class="modal-footer bg-gray-50 dark:bg-gray-800/80">
        <button type="button" @click="close" class="btn-secondary">Cancelar</button>
        <button type="submit" form="itemForm" :disabled="isLoading || (!isEditing && !selectedProduct)" class="btn-primary">
          <Icon v-if="isLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          {{ isEditing ? 'Actualizar' : 'Agregar' }}
        </button>
      </div>
    </div>

    <!-- Alta de un producto nuevo sin cerrar la partida. -->
    <ProductFormModal
      v-if="newProduct"
      :initial="newProduct"
      for-purchase
      @created="onProductCreated"
      @close="newProduct = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { usePurchaseStore, lotPairError, MIN_ITEM_COST, type PurchaseItem } from '~/stores/purchase'
import type { Product } from '~/stores/product'
import PurchaseProductPicker from '~/components/purchases/PurchaseProductPicker.vue'
import ProductFormModal from '~/components/catalog/ProductFormModal.vue'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
import { useSettingsStore } from '~/stores/settings'

const props = defineProps<{ modelValue: boolean, purchaseId: number, itemToEdit?: PurchaseItem | null }>()
const emit = defineEmits(['update:modelValue'])

const store = usePurchaseStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const isLoading = ref(false)
const isEditing = computed(() => !!props.itemToEdit)
/** Los errores de "falta" se muestran tras el primer intento de guardar. */
const submitted = ref(false)

const selectedProduct = ref<Product | null>(null)
/** Producto nuevo en alta (datos ya conocidos de lo que se buscó). */
const newProduct = ref<{ name?: string; barcode?: string } | null>(null)

const form = reactive({ quantity: 1, cost: 0, lotNumber: '', expiryDate: '' })
const isControlled = computed(() =>
  !!(props.itemToEdit?.product.controlled || selectedProduct.value?.controlled),
)

// Configuración › Inventario: puede exigir lote también en productos comunes.
// Se valida aquí para avisar al capturar, no hasta el momento de recibir.
const settingsStore = useSettingsStore()
const requireLotForAll = computed(() => settingsStore.valuesOf('inventory')?.requireLotForAll ?? false)
const lotRequired = computed(() => isControlled.value || requireLotForAll.value)

const qtyError = computed(() =>
  Number.isInteger(form.quantity) && form.quantity >= 1 ? '' : 'La cantidad debe ser un número entero de al menos 1.',
)
// Mismo mínimo que la captura de la orden nueva (create.vue) y que el servidor.
const costError = computed(() =>
  Number(form.cost) >= MIN_ITEM_COST ? '' : `El costo unitario debe ser de al menos ${formatCurrency(MIN_ITEM_COST)}.`,
)
/** Mismas reglas que create.vue: el par va junto, y obligatorio si así se exige. */
const lotError = computed(() => {
  const pair = lotPairError(form.lotNumber, form.expiryDate)
  if (pair) return pair
  if (lotRequired.value && !form.lotNumber.trim() && !form.expiryDate) {
    return isControlled.value
      ? 'El medicamento controlado requiere lote y caducidad.'
      : 'La configuración de inventario exige lote y caducidad en toda entrada.'
  }
  return ''
})
// El par incompleto se avisa al momento; el "falta" obligatorio, al intentar guardar.
const shownLotError = computed(() =>
  lotPairError(form.lotNumber, form.expiryDate) || (submitted.value ? lotError.value : ''),
)

watch(() => props.modelValue, (val) => {
  if (val) {
    submitted.value = false
    void settingsStore.fetch('inventory').catch(() => null)
    if (props.itemToEdit) {
      form.quantity = props.itemToEdit.quantity
      form.cost = Number(props.itemToEdit.cost)
      form.lotNumber = props.itemToEdit.lotNumber ?? ''
      form.expiryDate = props.itemToEdit.expiryDate ? String(props.itemToEdit.expiryDate).slice(0, 10) : ''
    } else {
      selectedProduct.value = null
      newProduct.value = null
      form.quantity = 1
      form.cost = 0
      form.lotNumber = ''
      form.expiryDate = ''
    }
  }
})

const selectProduct = (p: Product) => {
  selectedProduct.value = p
  form.cost = Number(p.cost)
}

function onProductCreated(p: Product) {
  newProduct.value = null
  selectProduct(p)
}

const handleSubmit = async () => {
  submitted.value = true
  if (!isEditing.value && !selectedProduct.value) {
    toast.warning('Elige un producto de la lista.')
    return
  }
  if (qtyError.value || costError.value || lotError.value) return
  isLoading.value = true

  const conLote = !!(form.lotNumber.trim() && form.expiryDate)
  const lote = conLote
    ? { lotNumber: form.lotNumber.trim().toUpperCase(), expiryDate: form.expiryDate }
    : null

  try {
    if (isEditing.value && props.itemToEdit) {
      // Al EDITAR, campos vacíos = `null` = borrar el lote (JSON Merge Patch).
      // Con `undefined` el campo no viaja y el servidor conservaba el lote
      // anterior: una captura equivocada no se podía corregir.
      await store.updateItem(props.purchaseId, props.itemToEdit.id, {
        quantity: form.quantity,
        cost: form.cost,
        ...(lote ?? { lotNumber: null, expiryDate: null }),
      })
      toast.success('Ítem actualizado.')
    } else if (selectedProduct.value) {
      await store.addItem(props.purchaseId, { productId: selectedProduct.value.id, quantity: form.quantity, cost: form.cost, ...(lote ?? {}) })
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
