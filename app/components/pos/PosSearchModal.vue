<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useProductStore, type Product } from '~/stores/product'
import { useCurrency } from '~/composables/useCurrency'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', product: Product): void
}>()

const productStore = useProductStore()
const { formatCurrency } = useCurrency()

const query = ref('')
const results = ref<Product[]>([])
const isSearching = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
let debounce: ReturnType<typeof setTimeout> | null = null

async function runSearch() {
  const term = query.value.trim()
  if (term.length < 2) {
    results.value = []
    return
  }
  isSearching.value = true
  try {
    results.value = await productStore.searchProductsLocally({ name: term, limit: 15 })
  } finally {
    isSearching.value = false
  }
}

function onInput() {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(runSearch, 300)
}

function choose(product: Product) {
  emit('select', product)
}

onMounted(async () => {
  await nextTick()
  searchInput.value?.focus()
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" @keydown.esc="emit('close')">
    <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <!-- Buscador -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <Icon name="ph:magnifying-glass-bold" class="w-5 h-5 text-gray-400 shrink-0" />
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Buscar producto por nombre..."
          class="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          @input="onInput"
        />
        <button class="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 rounded border border-gray-200 dark:border-gray-600" @click="emit('close')">
          Esc
        </button>
      </div>

      <!-- Resultados -->
      <div class="max-h-96 overflow-y-auto">
        <div v-if="isSearching" class="flex items-center justify-center py-10 text-gray-400">
          <Icon name="ph:spinner-gap-bold" class="w-5 h-5 animate-spin mr-2" /> Buscando...
        </div>

        <div v-else-if="query.trim().length >= 2 && results.length === 0" class="py-10 text-center text-gray-400">
          Sin resultados para "{{ query }}"
        </div>

        <div v-else-if="query.trim().length < 2" class="py-10 text-center text-gray-400">
          Escribe al menos 2 caracteres para buscar
        </div>

        <button
          v-for="p in results"
          :key="p.id"
          class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 disabled:opacity-50"
          :disabled="p.stock <= 0"
          @click="choose(p)"
        >
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <Icon name="ph:pill-bold" class="w-5 h-5 text-primary-500" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ p.name }}</p>
            <p class="text-xs text-gray-400">{{ p.sku }} · Stock: {{ p.stock }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(Number(p.price)) }}</p>
            <p v-if="p.stock <= 0" class="text-xs text-error-500 font-medium">Sin stock</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
