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
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" @keydown.esc="emit('close')">
    <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">Asignar cliente</h3>
        <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="emit('close')">
          <Icon name="ph:x-bold" class="w-5 h-5" />
        </button>
      </div>

      <!-- Buscador -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <Icon name="ph:magnifying-glass-bold" class="w-5 h-5 text-gray-400 shrink-0" />
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          class="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          @input="onInput"
        />
      </div>

      <div class="max-h-96 overflow-y-auto">
        <!-- Público general -->
        <button
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
              class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            >
              <Icon name="ph:credit-card-bold" class="w-3 h-3" /> Crédito
            </span>
            <p v-if="Number(c.currentDebt) > 0" class="text-xs text-error-500 mt-1">
              Debe {{ formatCurrency(Number(c.currentDebt)) }}
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
