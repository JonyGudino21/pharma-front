<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      
      <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="ph:clock-counter-clockwise-bold" class="text-primary-600" /> Kardex de Movimientos
          </h2>
          <p class="text-sm text-gray-500 font-mono mt-1">{{ product?.name }} (SKU: {{ product?.sku }})</p>
        </div>
        <button @click="close" class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900/20">
        
        <div v-if="inventoryStore.isLoadingKardex" class="py-12 text-center text-gray-500">
          <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2" /> Cargando historial...
        </div>

        <div v-else-if="inventoryStore.currentKardex.length === 0" class="py-12 text-center text-gray-500">
          <Icon name="ph:folder-open-duotone" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
          No hay movimientos registrados para este producto.
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="movement in inventoryStore.currentKardex" :key="movement.id"
            class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div :class="['w-12 h-12 rounded-full flex items-center justify-center shrink-0', getTypeStyles(movement.type).bg]">
              <Icon :name="getTypeStyles(movement.type).icon" class="w-6 h-6" :class="getTypeStyles(movement.type).text" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span :class="['text-xs font-bold uppercase tracking-wider', getTypeStyles(movement.type).text]">
                  {{ movement.type }}
                </span>
                <span class="text-xs text-gray-400 flex items-center">
                  <Icon name="ph:calendar-blank" class="mr-1" /> {{ formatDateTime(movement.createdAt) }}
                </span>
              </div>
              <p v-if="movement.reason" class="text-sm text-gray-600 dark:text-gray-300 italic">"{{ movement.reason }}"</p>
              <p v-else class="text-sm text-gray-600 dark:text-gray-300">Movimiento de sistema automático.</p>
            </div>

            <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0 w-full sm:w-auto">
              <div :class="['text-lg font-black', movement.quantity >= 0 ? 'text-success-600' : 'text-error-600']">
                {{ movement.quantity >= 0 ? '+' : '' }}{{ movement.quantity }}
              </div>
              <div class="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Balance: {{ movement.balanceAfter }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useInventoryStore, type MovementType } from '~/stores/inventory'
import { useDate } from '~/composables/useDate'
import type { Product } from '~/stores/product'

const props = defineProps<{ modelValue: boolean, product: Product | null }>()
const emit = defineEmits(['update:modelValue'])

const inventoryStore = useInventoryStore()
const { formatDateTime } = useDate()

watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.product) {
    await inventoryStore.fetchKardex(props.product.id)
  } else {
    inventoryStore.clearKardex()
  }
})

const getTypeStyles = (type: MovementType) => {
  const styles = {
    PURCHASE: { icon: 'ph:truck-bold', bg: 'bg-success-50 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400' },
    INITIAL: { icon: 'ph:database-bold', bg: 'bg-success-50 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400' },
    SALE: { icon: 'ph:shopping-cart-bold', bg: 'bg-primary-50 dark:bg-primary-900/30', text: 'text-primary-600 dark:text-primary-400' },
    ADJUSTMENT: { icon: 'ph:sliders-horizontal-bold', bg: 'bg-warning-50 dark:bg-warning-900/30', text: 'text-warning-600 dark:text-warning-400' },
    LOSS: { icon: 'ph:warning-circle-bold', bg: 'bg-error-50 dark:bg-error-900/30', text: 'text-error-600 dark:text-error-400' },
    RETURN: { icon: 'ph:arrow-u-up-left-bold', bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
    RETURN_IN: { icon: 'ph:arrow-u-up-left-bold', bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
    RETURN_OUT: { icon: 'ph:arrow-u-up-right-bold', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  }
  return styles[type] || styles.ADJUSTMENT
}

const close = () => emit('update:modelValue', false)
</script>