<script setup lang="ts">
import { computed } from 'vue'
import type { SettingsSnapshot } from '~/types/settings'

/**
 * Encabezado de una pantalla de Configuración: qué se configura, desde cuándo
 * rige lo que se ve y, si hubo conflicto, cómo resolverlo.
 */
const props = defineProps<{
  title: string
  description: string
  icon: string
  snapshot?: SettingsSnapshot | null
  conflict?: boolean
}>()

const emit = defineEmits<{ reload: [] }>()

const provenance = computed(() => {
  const s = props.snapshot
  if (!s) return null
  if (s.version === 0 || !s.updatedAt) return 'Valores de fábrica: todavía nadie los ha cambiado.'
  const when = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(s.updatedAt))
  return `Último cambio: ${when}${s.updatedBy ? ` · ${s.updatedBy.name}` : ''}`
})
</script>

<template>
  <div class="space-y-3">
    <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
      <h1 class="flex items-center gap-2 text-xl font-bold sm:text-2xl text-gray-900 dark:text-white">
        <Icon :name="icon" class="shrink-0 text-primary-600 dark:text-primary-400" /> {{ title }}
      </h1>
      <p class="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
      <p v-if="provenance" class="mt-3 inline-flex items-start gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Icon name="ph:clock-counter-clockwise" class="mt-px h-3.5 w-3.5 shrink-0" /> {{ provenance }}
      </p>
    </div>

    <div
      v-if="conflict"
      class="flex flex-wrap items-center gap-3 rounded-2xl border border-warning-500/40 bg-warning-500/10 px-4 py-3 text-sm text-warning-800 dark:text-warning-300"
      role="alert"
    >
      <Icon name="ph:warning-bold" class="h-5 w-5 shrink-0" />
      <p class="min-w-0 flex-1">
        Otro usuario guardó cambios en esta sección mientras editabas. Carga los valores actuales y vuelve a aplicar lo tuyo.
      </p>
      <button type="button" class="btn-secondary w-full py-2 text-sm sm:w-auto sm:py-1.5" @click="emit('reload')">
        Cargar valores actuales
      </button>
    </div>
  </div>
</template>
