<script setup lang="ts" generic="T extends string | number">
/**
 * Selector de una opción entre pocas, accesible como grupo de radio:
 * flechas para moverse, el foco sigue a la selección.
 */
import { useId } from 'vue'

const model = defineModel<T>({ required: true })

// Id estable (igual en servidor y cliente) para enlazar la etiqueta al grupo.
const labelId = useId()

const props = defineProps<{
  label: string
  options: { value: T; title: string; hint?: string }[]
}>()

function onKey(e: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  e.preventDefault()
  const i = props.options.findIndex((o) => o.value === model.value)
  const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1
  const next = props.options[(i + step + props.options.length) % props.options.length]
  if (next) model.value = next.value
  const group = e.currentTarget as HTMLElement
  requestAnimationFrame(() => group.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
}
</script>

<template>
  <div>
    <p :id="labelId" class="label-base">{{ label }}</p>
    <div
      role="radiogroup"
      :aria-labelledby="labelId"
      class="grid gap-2"
      :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }"
      @keydown="onKey"
    >
      <button
        v-for="o in options"
        :key="String(o.value)"
        type="button"
        role="radio"
        :aria-checked="model === o.value"
        :tabindex="model === o.value ? 0 : -1"
        class="rounded-lg border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        :class="
          model === o.value
            ? 'border-primary-500 bg-primary-50 text-primary-800 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-100'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500'
        "
        @click="model = o.value"
      >
        <span class="block text-sm font-semibold">{{ o.title }}</span>
        <span v-if="o.hint" class="mt-0.5 block text-xs opacity-75">{{ o.hint }}</span>
      </button>
    </div>
  </div>
</template>
