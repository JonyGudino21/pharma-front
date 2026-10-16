<script setup lang="ts">
import { useId } from 'vue'

/**
 * Interruptor de Configuración con etiqueta y explicación.
 * `role="switch"` + `aria-checked`: el lector de pantalla anuncia
 * "activado/desactivado", no "casilla".
 */
const model = defineModel<boolean>({ required: true })

defineProps<{
  label: string
  description?: string
  changed?: boolean
  /** Tono del estado activo: `warning` para ajustes con impacto sanitario o antifraude. */
  tone?: 'primary' | 'warning'
}>()

const id = useId()
</script>

<template>
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      <p :id="`${id}-label`" class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
        {{ label }}
        <span v-if="changed" class="h-1.5 w-1.5 rounded-full bg-warning-500" title="Cambiado, sin guardar" />
      </p>
      <p v-if="description" :id="`${id}-desc`" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-labelledby="`${id}-label`"
      :aria-describedby="description ? `${id}-desc` : undefined"
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
      :class="model ? (tone === 'warning' ? 'bg-warning-500' : 'bg-primary-600') : 'bg-gray-300 dark:bg-gray-600'"
      @click="model = !model"
    >
      <span
        class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform motion-reduce:transition-none"
        :class="model ? 'translate-x-5' : 'translate-x-0.5'"
      />
    </button>
  </div>
</template>
