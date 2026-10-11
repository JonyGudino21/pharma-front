<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useClientStore, type Client } from '~/stores/client'
import { useCurrency } from '~/composables/useCurrency'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', client: Client | null): void
}>()

const clientStore = useClientStore()
const { clients, isLoading } = storeToRefs(clientStore)
const { formatCurrency } = useCurrency()

const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
let debounce: ReturnType<typeof setTimeout> | null = null

async function load() {
  clientStore.filters.query = query.value.trim()
  if (clientStore.filters.query) {
    await clientStore.searchClients(1)
  } else {
    await clientStore.fetchClients(1)
  }
}

function onInput() {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(load, 300)
}

onMounted(async () => {
  await load()
  await nextTick()
  searchInput.value?.focus()
})
</script>

<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="clientModalTitle" @keydown.esc="emit('close')" @click.self="emit('close')">
    <div class="modal-panel sm:max-w-lg sm:border sm:border-gray-100 sm:shadow-2xl dark:sm:border-gray-700">
      <div class="shrink-0 px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 id="clientModalTitle" class="font-semibold text-gray-900 dark:text-gray-100">Asignar cliente</h3>
        <button type="button" class="-mr-2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200" aria-label="Cerrar" @click="emit('close')">
          <Icon name="ph:x-bold" class="w-5 h-5" />
        </button>
      </div>

      <!-- Buscador -->
      <div class="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <Icon name="ph:magnifying-glass-bold" class="w-5 h-5 text-gray-400 shrink-0" />
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          enterkeyhint="search"
          placeholder="Buscar por nombre, teléfono o email..."
          aria-label="Buscar cliente"
          class="min-w-0 flex-1 bg-transparent text-base outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          @input="onInput"
        />
      </div>

      <!-- Celular: la lista ocupa la hoja; laptop: el alto de siempre. -->
      <div class="min-h-[40dvh] flex-1 overflow-y-auto sm:min-h-0 sm:max-h-96 sm:flex-none">
        <!-- Público general -->
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50"
          @click="emit('select', null)"
        >
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <Icon name="ph:user-bold" class="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-100">Público General</p>
            <p class="text-xs text-gray-400">Venta de contado sin cliente asignado</p>
          </div>
        </button>

        <div v-if="isLoading" class="flex items-center justify-center py-8 text-gray-400">
          <Icon name="ph:spinner-gap-bold" class="w-5 h-5 animate-spin mr-2" /> Cargando...
        </div>

        <button
          v-for="c in clients"
          v-else
          :key="c.id"
          class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
          @click="emit('select', c)"
        >
          <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
            <span class="text-primary-600 dark:text-primary-300 font-semibold uppercase">{{ c.name.charAt(0) }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ c.name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ c.phone || c.rfc || 'Sin contacto' }}</p>
          </div>
          <div class="text-right shrink-0">
            <span
              v-if="c.hasCredit"
              class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400"
            >
              <Icon name="ph:credit-card-bold" class="w-3 h-3" /> Crédito
            </span>
            <p v-if="Number(c.currentDebt) > 0" class="text-xs text-error-600 dark:text-error-400 mt-1">
              Debe {{ formatCurrency(Number(c.currentDebt)) }}
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
