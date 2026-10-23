<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import type { ReorderResult } from '~/stores/sales'

/**
 * Aviso en caja tras «Volver a vender»: qué se armó y qué cambió respecto a la
 * venta original (precios de hoy, piezas ajustadas, productos omitidos), para
 * revisarlo con el cliente antes de cobrar.
 */
const props = defineProps<{ notice: ReorderResult }>()
const emit = defineEmits<{ (e: 'dismiss'): void }>()

const { formatCurrency } = useCurrency()

const MOTIVO = { INACTIVO: 'dado de baja', SIN_EXISTENCIA: 'sin existencia' } as const

const hayCambios = computed(() =>
  props.notice.clientDropped ||
  props.notice.adjusted.length > 0 ||
  props.notice.skipped.length > 0 ||
  props.notice.priceChanges.length > 0,
)
</script>

<template>
  <div
    class="rounded-2xl border px-4 py-3 text-sm"
    :class="hayCambios
      ? 'border-warning-200 bg-warning-50 text-warning-900 dark:border-warning-800/40 dark:bg-warning-900/20 dark:text-warning-100'
      : 'border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-800/40 dark:bg-primary-900/20 dark:text-primary-100'"
    role="status"
    data-testid="pos-reorder-notice"
  >
    <div class="flex items-start gap-3">
      <Icon :name="hayCambios ? 'ph:warning-circle-bold' : 'ph:arrow-clockwise-bold'" class="mt-0.5 h-5 w-5 shrink-0" />
      <div class="min-w-0 flex-1 space-y-1.5">
        <p class="font-semibold">
          Venta armada a partir de {{ notice.fromLabel }}.
          <span class="font-normal">{{ hayCambios ? 'Revisa estos cambios antes de cobrar:' : 'Mismos productos y precios.' }}</span>
        </p>
        <ul v-if="hayCambios" class="list-disc space-y-0.5 pl-5">
          <li v-if="notice.clientDropped">El cliente original está dado de baja: la venta quedó a <strong>Público General</strong>.</li>
          <li v-for="p in notice.priceChanges" :key="'p' + p.productId">
            <strong>{{ p.name }}</strong>: hoy cuesta {{ formatCurrency(Number(p.now)) }} (antes {{ formatCurrency(Number(p.before)) }}).
          </li>
          <li v-for="a in notice.adjusted" :key="'a' + a.productId">
            <strong>{{ a.name }}</strong>: sólo hay {{ a.quantity }} de {{ a.requested }} piezas.
          </li>
          <li v-for="s in notice.skipped" :key="'s' + s.productId">
            <strong>{{ s.name }}</strong> ({{ s.quantity }} pzas.) no se agregó: {{ MOTIVO[s.reason] }}.
          </li>
        </ul>
        <p class="text-xs opacity-80">Los precios son los de hoy (precio especial del cliente o de lista); los descuentos de la venta original no se copian.</p>
      </div>
      <button
        type="button"
        class="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
        aria-label="Cerrar aviso"
        @click="emit('dismiss')"
      >
        <Icon name="ph:x-bold" class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
