<script setup lang="ts">
/**
 * Barra de cambios pendientes para pantallas de configuración.
 *
 * Aparece sólo cuando hay algo que guardar, fija abajo, para que el botón
 * esté siempre a la vista aunque se haya bajado por el formulario. Reutilizable
 * por las siguientes pantallas de Configuración.
 */
defineProps<{
  visible: boolean
  saving: boolean
  canSave: boolean
  /** Qué cambió, en palabras del usuario: "datos de la farmacia", "plantilla". */
  scopes: string[]
}>()

const emit = defineEmits<{ save: []; discard: [] }>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="visible"
      class="sticky bottom-4 z-30 mx-auto mt-6 flex max-w-3xl flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-800/95"
      role="region"
      aria-label="Cambios sin guardar"
    >
      <span class="h-2 w-2 shrink-0 rounded-full bg-warning-500" aria-hidden="true" />
      <p class="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-200">
        Cambios sin guardar en
        <strong class="font-semibold">{{ scopes.join(' y ') }}</strong>.
        <span v-if="!canSave" class="text-error-600">Corrige los campos marcados.</span>
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          :disabled="saving"
          @click="emit('discard')"
        >
          Descartar
        </button>
        <button
          type="button"
          class="btn-primary gap-2 text-sm"
          :disabled="saving || !canSave"
          @click="emit('save')"
        >
          <Icon v-if="saving" name="ph:spinner-gap-bold" class="h-4 w-4 animate-spin" />
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          <kbd v-if="!saving" class="hidden rounded border border-white/30 px-1 font-sans text-[10px] font-normal opacity-80 sm:inline">Ctrl S</kbd>
        </button>
      </div>
    </div>
  </Transition>
</template>
