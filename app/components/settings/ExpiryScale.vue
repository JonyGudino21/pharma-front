<script setup lang="ts">
import { computed } from 'vue'

/**
 * Vista previa del semáforo de caducidad: una regla de 0 al horizonte de
 * alerta, con los tramos rojo / amarillo / verde tal como se van a clasificar
 * los lotes. Al mover un número, se ve de inmediato qué cambia.
 */
const props = defineProps<{
  critical: number
  warning: number
  horizon: number
}>()

const valid = computed(
  () =>
    [props.critical, props.warning, props.horizon].every((n) => Number.isFinite(n) && n > 0) &&
    props.critical < props.warning &&
    props.warning <= props.horizon,
)

const pct = (days: number) => `${Math.min(100, Math.max(0, (days / props.horizon) * 100))}%`

const segments = computed(() => [
  { key: 'red', from: 0, to: props.critical, cls: 'bg-error-500', label: `Menos de ${props.critical} días` },
  { key: 'amber', from: props.critical, to: props.warning, cls: 'bg-warning-500', label: `${props.critical} a ${props.warning} días` },
  { key: 'green', from: props.warning, to: props.horizon, cls: 'bg-success-500', label: `${props.warning} a ${props.horizon} días` },
])
</script>

<template>
  <figure class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
    <figcaption class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      Así se clasificarán los lotes
    </figcaption>

    <template v-if="valid">
      <div class="relative flex h-3 overflow-hidden rounded-full" role="img" :aria-label="segments.map((s) => s.label).join(', ')">
        <div
          v-for="s in segments"
          :key="s.key"
          :class="s.cls"
          class="h-full transition-[width] duration-300 motion-reduce:transition-none"
          :style="{ width: `calc(${pct(s.to)} - ${pct(s.from)})` }"
        />
      </div>
      <div class="relative mt-1 h-4 text-[11px] tabular-nums text-gray-400">
        <span class="absolute left-0">Hoy</span>
        <span class="absolute -translate-x-1/2" :style="{ left: pct(critical) }">{{ critical }}</span>
        <span class="absolute -translate-x-1/2" :style="{ left: pct(warning) }">{{ warning }}</span>
        <span class="absolute right-0">{{ horizon }} días</span>
      </div>
      <ul class="mt-3 grid gap-1.5 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-3">
        <li v-for="s in segments" :key="s.key" class="flex items-center gap-2">
          <span :class="s.cls" class="h-2.5 w-2.5 shrink-0 rounded-full" aria-hidden="true" />
          {{ s.label }}
        </li>
      </ul>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Los lotes con más de {{ horizon }} días no aparecen en "Por caducar". Los ya vencidos aparecen siempre.
      </p>
    </template>

    <p v-else class="text-xs text-gray-500 dark:text-gray-400">
      Ajusta los valores: los días críticos deben ser menores que los de advertencia, y éstos no pueden pasar del horizonte.
    </p>
  </figure>
</template>
