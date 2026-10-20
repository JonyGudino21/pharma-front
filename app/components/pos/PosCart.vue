<script setup lang="ts">
import { useCurrency } from '~/composables/useCurrency'
import type { SaleItem } from '~/stores/sales'
import { avisoMargen, evaluarMargen } from '~/utils/price-margin'

const props = defineProps<{
  items: SaleItem[]
  busy?: boolean
  /** Descuentos disponibles (configuración activa). */
  canDiscount?: boolean
  /** Ya hay un pago: el servidor congela descuentos y precios. */
  discountsLocked?: boolean
  /** Este usuario puede cambiar precios en caja (Configuración › Precios en caja). */
  canEditPrice?: boolean
  /** Mostrar montos de costo/ganancia en los avisos (gerencia). */
  showCost?: boolean
  /** Nombre del cliente de la venta (para los avisos de precio especial). */
  clientName?: string | null
}>()

const emit = defineEmits<{
  (e: 'increment', item: SaleItem): void
  (e: 'decrement', item: SaleItem): void
  (e: 'remove', item: SaleItem): void
  (e: 'discount', item: SaleItem): void
  (e: 'edit-price', item: SaleItem): void
}>()

const { formatCurrency } = useCurrency()
const pct = (i: SaleItem) => Number(i.discountPercent ?? 0)
const gross = (i: SaleItem) => Number(i.price) * i.quantity

/** ¿Deja ganancia la línea? Neto por pieza (con su descuento) contra su costo. */
const margen = (i: SaleItem) => evaluarMargen(i.price, i.costAtSale, i.discountPercent ?? 0)
const aviso = (i: SaleItem) => avisoMargen(margen(i), !!props.showCost, i.costAtSale)

/** Explicación del origen del precio (lista de referencia y motivo). */
function origen(i: SaleItem): string | undefined {
  const lista = i.listPrice != null ? `Precio de lista: ${formatCurrency(Number(i.listPrice))}.` : ''
  if (i.priceSource === 'CLIENT') {
    return `Precio especial${props.clientName ? ` de ${props.clientName}` : ''}. ${lista}`.trim()
  }
  if (i.priceSource === 'MANUAL') {
    return `Cambiado en caja sólo para esta venta. ${lista}${i.priceReason ? ` Motivo: ${i.priceReason}` : ''}`.trim()
  }
  return undefined
}
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
          <p class="flex flex-wrap items-center gap-x-1 text-xs text-gray-400 dark:text-gray-500">
            <span>{{ item.product?.sku }} ·</span>
            <!-- Precio unitario: botón para cambiarlo (ADR-0025) o texto. -->
            <button
              v-if="canEditPrice"
              type="button"
              :disabled="busy || discountsLocked"
              class="inline-flex items-center gap-1 rounded-md px-1 -mx-1 font-medium text-primary-700 underline decoration-dotted underline-offset-2 hover:bg-primary-50 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60 dark:text-primary-300 dark:hover:bg-primary-900/20"
              :title="discountsLocked ? 'Ya hay un pago registrado: el precio no se puede cambiar' : 'Cambiar precio'"
              :aria-label="`Cambiar el precio de ${item.product?.name ?? 'producto'}: ${formatCurrency(Number(item.price))} por pieza`"
              data-testid="pos-edit-price"
              @click="emit('edit-price', item)"
            >
              {{ formatCurrency(Number(item.price)) }} c/u
              <Icon name="ph:pencil-simple-bold" class="h-3 w-3" />
            </button>
            <span v-else>{{ formatCurrency(Number(item.price)) }} c/u</span>
            <span
              v-if="item.priceSource === 'CLIENT'"
              class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
              :title="origen(item)"
              data-testid="pos-price-client"
            >
              Precio cliente
            </span>
            <span
              v-else-if="item.priceSource === 'MANUAL'"
              class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300"
              :title="origen(item)"
              data-testid="pos-price-manual"
            >
              Precio editado
            </span>
            <span
              v-if="aviso(item)"
              class="inline-flex items-center"
              :class="margen(item).estado === 'BAJO_COSTO' ? 'text-error-600 dark:text-error-400' : 'text-warning-600 dark:text-warning-400'"
              :title="aviso(item) ?? undefined"
              role="img"
              :aria-label="aviso(item) ?? undefined"
              data-testid="pos-price-margin-warning"
            >
              <Icon name="ph:warning-bold" class="h-3.5 w-3.5" />
            </span>
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
