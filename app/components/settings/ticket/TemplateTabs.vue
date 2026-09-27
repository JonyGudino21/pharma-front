<script setup lang="ts">
import { ref } from 'vue'
import type { ReceiptTemplate } from '~/types/receipt'

/**
 * Plantillas disponibles como pestañas, con la que usa el POS marcada.
 * Antes era un `<select>` que sólo aparecía con dos o más plantillas: con una
 * sola, no había pista de que se pudieran tener varias.
 */
defineProps<{
  templates: ReceiptTemplate[]
  selectedId: number | null
  busy: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
  create: [width: 58 | 80]
  makeDefault: []
  deactivate: []
}>()

const menuOpen = ref(false)
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <div role="tablist" aria-label="Plantillas de ticket" class="flex flex-wrap gap-2">
      <button
        v-for="t in templates"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="t.id === selectedId"
        class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        :class="
          t.id === selectedId
            ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
        "
        @click="emit('select', t.id)"
      >
        <Icon name="ph:receipt" class="h-4 w-4 opacity-70" />
        <span class="font-medium">{{ t.name }}</span>
        <span class="font-mono text-xs opacity-60">{{ t.paperWidthMm }}mm</span>
        <span
          v-if="t.isDefault"
          class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          :class="t.id === selectedId ? 'bg-success-500 text-white' : 'bg-success-500/10 text-success-700 dark:text-success-400'"
        >
          En el POS
        </span>
      </button>
    </div>

    <div class="relative ml-auto" @keydown.esc="menuOpen = false">
      <!-- Capa invisible: un clic fuera del menú lo cierra. -->
      <div v-if="menuOpen" class="fixed inset-0 z-10" aria-hidden="true" @click="menuOpen = false" />
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        :disabled="busy"
        @click="menuOpen = !menuOpen"
      >
        Opciones
        <Icon name="ph:caret-down-bold" class="h-3.5 w-3.5" />
      </button>
      <div
        v-if="menuOpen"
        role="menu"
        class="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800"
        @click="menuOpen = false"
      >
        <button role="menuitem" type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700" @click="emit('makeDefault')">
          <Icon name="ph:check-circle" class="h-4 w-4 text-success-600" /> Usar esta plantilla en el POS
        </button>
        <button role="menuitem" type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700" @click="emit('create', 58)">
          <Icon name="ph:copy" class="h-4 w-4" /> Duplicar como 58 mm
        </button>
        <button role="menuitem" type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700" @click="emit('create', 80)">
          <Icon name="ph:copy" class="h-4 w-4" /> Duplicar como 80 mm
        </button>
        <div class="my-1 border-t border-gray-100 dark:border-gray-700" />
        <button role="menuitem" type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-error-600 hover:bg-error-500/5" @click="emit('deactivate')">
          <Icon name="ph:archive" class="h-4 w-4" /> Desactivar plantilla
        </button>
      </div>
    </div>
  </div>
</template>
