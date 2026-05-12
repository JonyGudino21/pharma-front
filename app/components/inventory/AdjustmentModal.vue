<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden">
      
      <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Icon name="ph:sliders-horizontal-bold" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Ajuste de Inventario</h2>
            <p class="text-xs text-gray-500">Auditoría física de stock</p>
          </div>
        </div>
        <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" id="adjForm" class="p-6 space-y-5">
        
        <div v-if="product" class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
          <p class="font-bold text-blue-900 dark:text-blue-100">{{ product.name }}</p>
          <p class="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">SKU: {{ product.sku }}</p>
          <div class="mt-3 flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Stock en sistema:</span>
            <span class="font-black text-lg text-gray-900 dark:text-white">{{ product.stock }} uds.</span>
          </div>
        </div>

        <div>
          <label class="label-base text-lg font-bold">¿Cuánto contaste físicamente? *</label>
          <input
            v-model.number="form.realQuantity"
            type="number"
            min="0"
            required
            class="input-base text-2xl font-black text-center h-14"
            @input="calculateDifference"
          />
        </div>

        <div v-if="difference !== null" class="flex items-center gap-2 p-3 rounded-lg border" :class="differenceClass.wrapper">
          <Icon :name="differenceClass.icon" class="w-6 h-6" :class="differenceClass.text" />
          <div class="flex-1">
            <p class="text-sm font-bold" :class="differenceClass.text">{{ differenceClass.title }}</p>
            <p class="text-xs" :class="differenceClass.text">Diferencia: {{ difference > 0 ? '+' : '' }}{{ difference }} unidades</p>
          </div>
        </div>

        <div>
          <label class="label-base">Motivo del Ajuste (Auditoría) *</label>
          <textarea
            v-model="form.reason"
            rows="2"
            required
            class="input-base resize-none"
            placeholder="Ej: Producto dañado, error de conteo previo..."
          ></textarea>
        </div>
      </form>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
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
    return { wrapper: 'bg-gray-50 border-gray-200', text: 'text-gray-500', icon: 'ph:equals-bold', title: 'Sin cambios. No se requiere ajuste.' }
  }
  if (difference.value > 0) {
    return { wrapper: 'bg-success-50 border-success-200', text: 'text-success-700', icon: 'ph:trend-up-bold', title: 'Sobrante detectado (Ajuste Positivo)' }
  }
  return { wrapper: 'bg-error-50 border-error-200', text: 'text-error-700', icon: 'ph:trend-down-bold', title: 'Faltante detectado (Ajuste Negativo o Pérdida)' }
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