<script setup lang="ts">
import { computed } from 'vue'
import { TONO_CLASES, textoEstado, tonoEstado, type EstadoCobro } from '~/utils/credit-status'

/** "Vencida hace 12 días", "Vence mañana", "Sin fecha de pago", con su color. */
const props = defineProps<{ status: EstadoCobro; days: number }>()

const tono = computed(() => TONO_CLASES[tonoEstado(props.status, props.days)])
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset"
    :class="tono.chip"
    :data-status="status"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="tono.dot" aria-hidden="true" />
    {{ textoEstado(status, days) }}
  </span>
</template>
