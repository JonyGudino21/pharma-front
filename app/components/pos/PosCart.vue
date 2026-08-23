<script setup lang="ts">
import { useCurrency } from '~/composables/useCurrency'
import type { SaleItem } from '~/stores/sales'

defineProps<{
  items: SaleItem[]
  busy?: boolean
}>()

const emit = defineEmits<{
  (e: 'increment', item: SaleItem): void
  (e: 'decrement', item: SaleItem): void
  (e: 'remove', item: SaleItem): void
}>()

const { formatCurrency } = useCurrency()
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Encabezado de columnas -->
    <div class="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
      <div class="col-span-6">Producto</div>
      <div class="col-span-3 text-center">Cantidad</div>
      <div class="col-span-2 text-right">Importe</div>
      <div class="col-span-1"></div>
    </div>

    <!-- Estado vacío -->
    <div v-if="items.length === 0" class="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
      <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-4">
        <Icon name="ph:barcode-bold" class="w-8 h-8 text-gray-400" />
      </div>
      <p class="text-gray-500 dark:text-gray-400 font-medium">Escanea o busca un producto para comenzar</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">El carrito de la venta aparecerá aquí</p>
    </div>

    <!-- Lista de items -->
    <div v-else class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
      <div
        v-for="item in items"
        :key="item.id"
        class="grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <!-- Producto -->
        <div class="col-span-12 sm:col-span-6 min-w-0">
          <p class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ item.product?.name ?? 'Producto #' + item.productId }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ item.product?.sku }} · {{ formatCurrency(Number(item.price)) }} c/u
          </p>
        </div>

        <!-- Cantidad -->
        <div class="col-span-7 sm:col-span-3 flex items-center justify-center gap-1.5">
          <button
            :disabled="busy"
            class="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"
            @click="emit('decrement', item)"
          >
            <Icon name="ph:minus-bold" class="w-4 h-4" />
          </button>
          <span class="w-10 text-center font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{{ item.quantity }}</span>
          <button
            :disabled="busy"
            class="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"
            @click="emit('increment', item)"
          >
            <Icon name="ph:plus-bold" class="w-4 h-4" />
          </button>
        </div>

        <!-- Importe -->
        <div class="col-span-4 sm:col-span-2 text-right font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
          {{ formatCurrency(Number(item.subtotal)) }}
        </div>

        <!-- Quitar -->
        <div class="col-span-1 flex justify-end">
          <button
            :disabled="busy"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 disabled:opacity-40 transition-colors"
            @click="emit('remove', item)"
          >
            <Icon name="ph:trash-bold" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
