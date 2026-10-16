<script setup lang="ts">
import { useCurrency } from '~/composables/useCurrency'
import type { SaleItem } from '~/stores/sales'

defineProps<{
  items: SaleItem[]
  busy?: boolean
  /** Descuentos disponibles (configuración activa). */
  canDiscount?: boolean
  /** Ya hay un pago: el servidor congela los descuentos. */
  discountsLocked?: boolean
}>()

const emit = defineEmits<{
  (e: 'increment', item: SaleItem): void
  (e: 'decrement', item: SaleItem): void
  (e: 'remove', item: SaleItem): void
  (e: 'discount', item: SaleItem): void
}>()

const { formatCurrency } = useCurrency()
const pct = (i: SaleItem) => Number(i.discountPercent ?? 0)
const gross = (i: SaleItem) => Number(i.price) * i.quantity
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Encabezado de columnas -->
    <div class="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
      <div class="col-span-5">Producto</div>
      <div class="col-span-3 text-center">Cantidad</div>
      <div class="col-span-2 text-right">Importe</div>
      <div class="col-span-2"></div>
    </div>

    <!-- Estado vacío -->
    <div v-if="items.length === 0" class="flex-1 flex flex-col items-center justify-center text-center py-10 sm:py-16 px-4">
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
        class="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 py-3 sm:grid sm:grid-cols-12 sm:px-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <!--
          Celular: nombre a todo el ancho y debajo una fila con cantidad,
          importe y acciones (botones de 40 px, cómodos al dedo).
          Desde `sm`: la rejilla de 12 columnas de siempre.
        -->
        <!-- Producto -->
        <div class="w-full sm:w-auto sm:col-span-5 min-w-0">
          <p class="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 sm:truncate">{{ item.product?.name ?? 'Producto #' + item.productId }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ item.product?.sku }} · {{ formatCurrency(Number(item.price)) }} c/u
            <span
              v-if="item.product?.controlled"
              class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300"
            >
              Controlado
            </span>
            <span
              v-if="pct(item) > 0"
              class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300"
              :title="item.discountReason ?? undefined"
            >
              −{{ pct(item) }}%
            </span>
          </p>
        </div>

        <!-- Cantidad -->
        <div class="sm:col-span-3 flex items-center justify-center gap-1.5">
          <button
            :disabled="busy"
            class="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"
            :aria-label="`Quitar una unidad de ${item.product?.name ?? 'producto'}`"
            @click="emit('decrement', item)"
          >
            <Icon name="ph:minus-bold" class="w-4 h-4" />
          </button>
          <span class="w-9 sm:w-10 text-center font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{{ item.quantity }}</span>
          <button
            :disabled="busy"
            class="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"
            :aria-label="`Agregar una unidad de ${item.product?.name ?? 'producto'}`"
            @click="emit('increment', item)"
          >
            <Icon name="ph:plus-bold" class="w-4 h-4" />
          </button>
        </div>

        <!-- Importe -->
        <div class="ml-auto sm:ml-0 sm:col-span-2 text-right tabular-nums">
          <p v-if="pct(item) > 0" class="text-xs text-gray-400 line-through">{{ formatCurrency(gross(item)) }}</p>
          <p class="font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(Number(item.subtotal)) }}</p>
        </div>

        <!-- Descuento y quitar -->
        <div class="sm:col-span-2 flex justify-end gap-0.5">
          <button
            v-if="canDiscount"
            :disabled="busy || discountsLocked"
            class="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-40 transition-colors"
            :title="discountsLocked ? 'Ya hay un pago registrado: el descuento no se puede cambiar' : 'Descuento'"
            :aria-label="`Descuento en ${item.product?.name ?? 'producto'}`"
            @click="emit('discount', item)"
          >
            <Icon name="ph:percent-bold" class="w-4 h-4" />
          </button>
          <button
            :disabled="busy"
            class="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 disabled:opacity-40 transition-colors"
            :aria-label="`Quitar ${item.product?.name ?? 'producto'}`"
            @click="emit('remove', item)"
          >
            <Icon name="ph:trash-bold" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
