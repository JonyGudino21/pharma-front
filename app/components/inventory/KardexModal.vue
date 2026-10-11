<template>
  <div v-if="modelValue" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="kardexTitle" @keydown.esc="close">
    <div class="modal-panel h-[92dvh] sm:h-auto sm:max-w-4xl">

      <div class="modal-header">
        <div class="min-w-0">
          <h2 id="kardexTitle" class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="ph:clock-counter-clockwise-bold" class="text-primary-600" /> Kardex de Movimientos
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{{ product?.name }} <span class="font-mono">(SKU: {{ product?.sku }})</span></p>
        </div>
        <button type="button" aria-label="Cerrar" @click="close" class="shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <!-- El historial se desplaza dentro del modal; encabezado y pie quedan fijos. -->
      <div class="modal-body bg-gray-50 dark:bg-gray-900/20">

        <div v-if="inventoryStore.isLoadingKardex" class="py-12 text-center text-gray-500">
          <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2" /> Cargando historial...
        </div>

        <div v-else-if="inventoryStore.currentKardex.length === 0" class="py-12 text-center text-gray-500">
          <Icon name="ph:folder-open-duotone" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
          No hay movimientos registrados para este producto.
        </div>

        <ul v-else class="space-y-3 sm:space-y-4">
          <li
            v-for="movement in inventoryStore.currentKardex" :key="movement.id"
            class="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-start sm:items-center gap-3 sm:gap-4"
          >
            <div :class="['w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0', getTypeStyles(movement.type).bg]">
              <Icon :name="getTypeStyles(movement.type).icon" class="w-5 h-5 sm:w-6 sm:h-6" :class="getTypeStyles(movement.type).text" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                <span :class="['text-xs font-bold uppercase tracking-wider', getTypeStyles(movement.type).text]">
                  {{ movementLabel(movement.type) }}
                </span>
                <span class="text-xs text-gray-400 flex items-center">
                  <Icon name="ph:calendar-blank" class="mr-1" /> {{ formatDateTime(movement.createdAt) }}
                </span>
              </div>
              <p v-if="movement.reason" class="text-sm text-gray-600 dark:text-gray-300 italic break-words">"{{ movement.reason }}"</p>
              <p v-else class="text-sm text-gray-600 dark:text-gray-300">Movimiento de sistema automático.</p>
            </div>

            <div class="flex flex-col items-end justify-center shrink-0 gap-1">
              <div :class="['text-lg font-black tabular-nums', movement.quantity >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400']">
                {{ movement.quantity >= 0 ? '+' : '' }}{{ movement.quantity }}
              </div>
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded whitespace-nowrap">
                Saldo: {{ movement.balanceAfter ?? '—' }}
              </div>
            </div>
          </li>
        </ul>

      </div>

      <div class="modal-footer sm:hidden">
        <button type="button" class="btn-secondary" @click="close">Cerrar</button>
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

/** Antes se mostraba el código crudo del servidor (SALE, LOSS…). */
const MOVEMENT_LABELS: Record<MovementType, string> = {
  PURCHASE: 'Compra',
  SALE: 'Venta',
  ADJUSTMENT: 'Ajuste',
  LOSS: 'Merma',
  INITIAL: 'Inventario inicial',
  RETURN: 'Devolución',
  RETURN_IN: 'Devolución de cliente',
  RETURN_OUT: 'Devolución a proveedor',
  TRANSFER: 'Traspaso',
}
const movementLabel = (type: MovementType) => MOVEMENT_LABELS[type] ?? type

const NEUTRAL = { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' }

const getTypeStyles = (type: MovementType) => {
  const styles: Record<MovementType, { icon: string; bg: string; text: string }> = {
    PURCHASE: { icon: 'ph:truck-bold', bg: 'bg-success-50 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400' },
    INITIAL: { icon: 'ph:database-bold', bg: 'bg-success-50 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400' },
    SALE: { icon: 'ph:shopping-cart-bold', bg: 'bg-primary-50 dark:bg-primary-900/30', text: 'text-primary-600 dark:text-primary-400' },
    ADJUSTMENT: { icon: 'ph:sliders-horizontal-bold', bg: 'bg-warning-50 dark:bg-warning-900/30', text: 'text-warning-600 dark:text-warning-400' },
    LOSS: { icon: 'ph:warning-circle-bold', bg: 'bg-error-50 dark:bg-error-900/30', text: 'text-error-600 dark:text-error-400' },
    RETURN: { icon: 'ph:arrow-u-up-left-bold', ...NEUTRAL },
    RETURN_IN: { icon: 'ph:arrow-u-up-left-bold', ...NEUTRAL },
    RETURN_OUT: { icon: 'ph:arrow-u-up-right-bold', ...NEUTRAL },
    TRANSFER: { icon: 'ph:arrows-left-right-bold', ...NEUTRAL },
  }
  return styles[type] || styles.ADJUSTMENT
}

const close = () => emit('update:modelValue', false)
</script>
