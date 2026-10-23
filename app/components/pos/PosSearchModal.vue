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
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Buscar producto" @keydown.esc="emit('close')" @click.self="emit('close')">
    <div class="modal-panel sm:max-w-2xl sm:border sm:border-gray-100 sm:shadow-2xl dark:sm:border-gray-700">
      <!-- Buscador -->
      <div class="shrink-0 flex items-center gap-3 px-4 py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700">
        <Icon name="ph:magnifying-glass-bold" class="w-5 h-5 text-gray-400 shrink-0" />
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          enterkeyhint="search"
          placeholder="Nombre, SKU o código de barras..."
          aria-label="Buscar producto por nombre"
          class="min-w-0 flex-1 bg-transparent py-1.5 text-base outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          @input="onInput"
        />
        <!-- Laptop: recordatorio de la tecla; celular: botón de cerrar tocable. -->
        <button type="button" class="hidden sm:block text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 rounded border border-gray-200 dark:border-gray-600" @click="emit('close')">
          Esc
        </button>
        <button type="button" class="sm:hidden -mr-2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Cerrar" @click="emit('close')">
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>
      </div>

      <!-- Resultados -->
      <div class="min-h-[40dvh] flex-1 overflow-y-auto sm:min-h-0 sm:max-h-96 sm:flex-none">
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
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 disabled:opacity-50"
          :disabled="p.stock <= 0"
          @click="choose(p)"
        >
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <Icon name="ph:pill-bold" class="w-5 h-5 text-primary-500" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ p.name }}</p>
            <!--
              Controlados: la búsqueda sólo trae la existencia TOTAL, que puede
              incluir piezas sin lote (no vendibles hasta asignarles uno). No se
              promete disponibilidad: se avisa que el lote se verifica al agregar
              (sin una petición extra por resultado en cada tecla).
            -->
            <p class="text-xs text-gray-400">
              {{ p.sku }} · {{ p.controlled ? 'Existencia' : 'Stock' }}: {{ p.stock }}
              <span
                v-if="p.controlled"
                class="ml-1 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300"
                title="Medicamento controlado: se verifica que tenga lote vigente al agregarlo"
              >
                Controlado
              </span>
            </p>
            <p v-if="p.controlled && p.stock > 0" class="text-[11px] text-gray-400 dark:text-gray-500">Lote vigente se verifica al agregar</p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(Number(p.price)) }}</p>
            <p v-if="p.stock <= 0" class="text-xs text-error-600 dark:text-error-400 font-medium">Sin stock</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
