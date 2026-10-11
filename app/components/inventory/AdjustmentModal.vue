<template>
  <div v-if="modelValue" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="adjTitle">
    <div class="modal-panel sm:max-w-lg">

      <div class="modal-header">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 shrink-0 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
            <Icon name="ph:sliders-horizontal-bold" class="w-5 h-5 text-warning-600 dark:text-warning-400" />
          </div>
          <div class="min-w-0">
            <h2 id="adjTitle" class="text-lg font-bold text-gray-900 dark:text-white">Ajuste de Inventario</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Auditoría física de stock</p>
          </div>
        </div>
        <button type="button" aria-label="Cerrar" @click="close" class="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" id="adjForm" class="modal-body space-y-5">

        <div v-if="product" class="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800/50">
          <p class="font-bold text-primary-900 dark:text-primary-100 break-words">{{ product.name }}</p>
          <p class="text-xs font-mono text-primary-600 dark:text-primary-400 mt-1">SKU: {{ product.sku }}</p>
          <div class="mt-3 flex items-center justify-between gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Stock en sistema:</span>
            <span class="font-black text-lg text-gray-900 dark:text-white">{{ product.stock }} uds.</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Si el producto tiene lotes, da de baja el lote en
            <span class="font-semibold">Inventario → Caducidades</span>. El ajuste a ciegas está bloqueado.
          </p>
        </div>

        <div>
          <label for="adjRealQty" class="label-base text-base sm:text-lg font-bold">¿Cuánto contaste físicamente? *</label>
          <input
            id="adjRealQty"
            v-model.number="form.realQuantity"
            type="number"
            inputmode="numeric"
            min="0"
            required
            class="input-base text-2xl font-black text-center h-14"
            @input="calculateDifference"
          />
        </div>

        <div v-if="difference !== null" class="flex items-center gap-2 p-3 rounded-lg border" :class="differenceClass.wrapper">
          <Icon :name="differenceClass.icon" class="w-6 h-6 shrink-0" :class="differenceClass.text" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold" :class="differenceClass.text">{{ differenceClass.title }}</p>
            <p class="text-xs" :class="differenceClass.text">Diferencia: {{ difference > 0 ? '+' : '' }}{{ difference }} unidades</p>
          </div>
        </div>

        <div>
          <label for="adjReason" class="label-base">Motivo del Ajuste (Auditoría) *</label>
          <textarea
            id="adjReason"
            v-model="form.reason"
            rows="2"
            required
            class="input-base resize-none"
            placeholder="Ej: Producto dañado, error de conteo previo..."
          ></textarea>
        </div>
      </form>

      <div class="modal-footer bg-gray-50 dark:bg-gray-800/80">
        <button type="button" @click="close" class="btn-secondary">Cancelar</button>
        <button
          type="submit"
          form="adjForm"
          :disabled="isLoading || difference === 0 || form.reason.trim() === ''"
          class="btn-primary"
        >
          <Icon v-if="isLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          {{ isLoading ? 'Procesando...' : 'Aplicar Ajuste' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { useToast } from '~/composables/useToast'
import type { Product } from '~/stores/product'

const props = defineProps<{ modelValue: boolean, product: Product | null }>()
const emit = defineEmits(['update:modelValue', 'success'])

const inventoryStore = useInventoryStore()
const toast = useToast()

const form = reactive({ realQuantity: 0, reason: '' })
const isLoading = ref(false)
const difference = ref<number | null>(null)

watch(() => props.modelValue, (newVal) => {
  if (newVal && props.product) {
    form.realQuantity = props.product.stock
    form.reason = ''
    difference.value = 0
  }
})

const calculateDifference = () => {
  if (props.product) difference.value = form.realQuantity - props.product.stock
}

const differenceClass = computed(() => {
  if (difference.value === null || difference.value === 0) {
    return { wrapper: 'bg-gray-50 border-gray-200 dark:bg-gray-900/40 dark:border-gray-700', text: 'text-gray-500 dark:text-gray-400', icon: 'ph:equals-bold', title: 'Sin cambios. No se requiere ajuste.' }
  }
  if (difference.value > 0) {
    return { wrapper: 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800/40', text: 'text-success-700 dark:text-success-400', icon: 'ph:trend-up-bold', title: 'Sobrante detectado (Ajuste Positivo)' }
  }
  return { wrapper: 'bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800/40', text: 'text-error-700 dark:text-error-400', icon: 'ph:trend-down-bold', title: 'Faltante detectado (Ajuste Negativo o Pérdida)' }
})

const handleSubmit = async () => {
  if (!props.product || difference.value === 0 || !form.reason.trim()) return
  isLoading.value = true

  try {
    // El payload exacto que pide RegisterAdjustmentDto
    await inventoryStore.registerAdjustment({
      productId: props.product.id,
      realQuantity: form.realQuantity,
      reason: form.reason.trim()
    })
    
    toast.success('Ajuste de inventario aplicado y registrado en el Kardex.')
    emit('success')
    close()
  } catch (error) {
    console.error("Error al registrar ajuste de inventario.")
  } finally {
    isLoading.value = false
  }
}

const close = () => emit('update:modelValue', false)
</script>