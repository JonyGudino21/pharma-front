<script setup lang="ts">
import { computed, useId } from 'vue'

/**
 * Campo numérico de Configuración: etiqueta, ayuda, prefijo ($) o sufijo
 * (días), error en línea y marca de "cambiado".
 *
 * Un campo vacío produce `NaN` —no 0— para que la validación lo marque como
 * requerido. Convertir vacío en 0 cambiaría en silencio una tolerancia de $20
 * por $0, justo lo contrario de lo que el usuario quería.
 */
const model = defineModel<number>({ required: true })

const props = withDefaults(
  defineProps<{
    label: string
    hint?: string
    error?: string
    prefix?: string
    suffix?: string
    min?: number
    max?: number
    step?: number
    changed?: boolean
    /** Valor de fábrica, para ofrecer "restablecer". */
    defaultValue?: number
    formatDefault?: (v: number) => string
  }>(),
  { step: 1 },
)

const emit = defineEmits<{ restore: [] }>()

const id = useId()
const hintId = `${id}-hint`

const shown = computed(() => (Number.isNaN(model.value) ? '' : model.value))
const showRestore = computed(
  () => props.defaultValue !== undefined && !Object.is(model.value, props.defaultValue),
)

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  model.value = el.value.trim() === '' ? Number.NaN : el.valueAsNumber
}
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between gap-2">
      <label :for="id" class="label-base flex items-center gap-2">
        {{ label }}
        <span v-if="changed" class="h-1.5 w-1.5 rounded-full bg-warning-500" title="Cambiado, sin guardar" />
      </label>
      <button
        v-if="showRestore"
        type="button"
        class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        @click="emit('restore')"
      >
        Restablecer ({{ formatDefault ? formatDefault(defaultValue!) : defaultValue }})
      </button>
    </div>
    <div class="relative">
      <span v-if="prefix" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{{ prefix }}</span>
      <input
        :id="id"
        type="number"
        inputmode="decimal"
        :value="shown"
        :min="min"
        :max="max"
        :step="step"
        class="input-base tabular-nums"
        :class="[prefix ? 'pl-7' : '', suffix ? 'pr-14' : '', error ? 'border-error-500 focus:ring-error-500' : '']"
        :aria-invalid="!!error"
        :aria-describedby="hint || error ? hintId : undefined"
        @input="onInput"
      />
      <span v-if="suffix" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{{ suffix }}</span>
    </div>
    <p
      v-if="error || hint"
      :id="hintId"
      class="mt-1 text-xs"
      :class="error ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'"
      :role="error ? 'alert' : undefined"
    >
      {{ error || hint }}
    </p>
  </div>
</template>
