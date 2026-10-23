<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import { ANTIGUEDAD_META, TONO_CLASES, segmentos, type Antiguedad } from '~/utils/credit-status'

/**
 * TERMÓMETRO DE ANTIGÜEDAD: toda la cartera en una barra, de lo que está al
 * corriente (verde) a lo vencido hace más de 90 días (rojo oscuro). Cada
 * segmento mide lo que pesa en dinero; "sin fecha de pago" va aparte, en gris.
 * Tocar un segmento (o su leyenda) filtra la lista.
 */
const props = withDefaults(defineProps<{
  aging: { bucket: Antiguedad; amount: string; count: number }[]
  /** Columna seleccionada (resaltada). */
  active?: Antiguedad | null
  /** Versión del panel: barra delgada y leyenda breve. */
  compact?: boolean
  /** Permitir tocar para filtrar. */
  interactive?: boolean
}>(), { active: null, compact: false, interactive: true })

const emit = defineEmits<{ (e: 'select', bucket: Antiguedad | null): void }>()

const { formatCurrency } = useCurrency()

const partes = computed(() => segmentos(props.aging))
const conDinero = computed(() => props.aging.filter((a) => Number(a.amount) > 0))

function elegir(bucket: Antiguedad) {
  if (!props.interactive) return
  emit('select', props.active === bucket ? null : bucket)
}
</script>

<template>
  <div>
    <div
      class="flex w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/60"
      :class="compact ? 'h-2.5 gap-0.5' : 'h-5 gap-1 p-0.5'"
      role="img"
      :aria-label="'Antigüedad de la cartera: ' + conDinero.map((a) => `${ANTIGUEDAD_META[a.bucket].label} ${formatCurrency(Number(a.amount))}`).join(', ')"
      data-testid="aging-thermometer"
    >
      <button
        v-for="p in partes"
        :key="p.bucket"
        type="button"
        :tabindex="interactive ? 0 : -1"
        :disabled="!interactive"
        class="h-full rounded-full transition-[opacity,transform] duration-200 first:rounded-l-full last:rounded-r-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-default motion-reduce:transition-none"
        :class="[TONO_CLASES[ANTIGUEDAD_META[p.bucket].tono].bar, active && active !== p.bucket ? 'opacity-30' : 'opacity-100']"
        :style="{ width: `${p.pct}%` }"
        :title="`${ANTIGUEDAD_META[p.bucket].label}: ${formatCurrency(Number(p.amount))} (${p.count} ${p.count === 1 ? 'venta' : 'ventas'})`"
        @click="elegir(p.bucket)"
      />
    </div>

    <!-- Leyenda: cada columna con su monto. En el panel, sólo las que tienen dinero. -->
    <ul
      class="mt-3 grid gap-x-4 gap-y-2"
      :class="compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6'"
    >
      <li v-for="a in (compact ? conDinero : aging)" :key="a.bucket">
        <button
          type="button"
          :disabled="!interactive"
          class="group flex w-full items-start gap-2 rounded-lg p-1.5 text-left transition-colors disabled:cursor-default"
          :class="[
            interactive ? 'hover:bg-gray-50 dark:hover:bg-gray-700/40' : '',
            active === a.bucket ? 'bg-gray-100 ring-1 ring-gray-300 dark:bg-gray-700/60 dark:ring-gray-600' : '',
            Number(a.amount) === 0 ? 'opacity-50' : '',
          ]"
          :aria-pressed="interactive ? active === a.bucket : undefined"
          :data-testid="`aging-${a.bucket}`"
          @click="elegir(a.bucket)"
        >
          <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" :class="TONO_CLASES[ANTIGUEDAD_META[a.bucket].tono].dot" aria-hidden="true" />
          <span class="min-w-0">
            <span class="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ ANTIGUEDAD_META[a.bucket].short }}</span>
            <span class="block font-bold tabular-nums text-gray-900 dark:text-white" :class="compact ? 'text-sm' : 'text-base'">{{ formatCurrency(Number(a.amount)) }}</span>
            <span v-if="!compact" class="block text-xs text-gray-500 dark:text-gray-400">{{ a.count }} {{ a.count === 1 ? 'venta' : 'ventas' }}</span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
