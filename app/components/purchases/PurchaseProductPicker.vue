<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProductStore, type Product, type ProductSearchField } from '~/stores/product'
import { useCurrency } from '~/composables/useCurrency'
import { coincidenciaExacta, pareceCodigo, prefillAlta } from '~/utils/product-search'

/**
 * BUSCADOR DE PRODUCTOS DE COMPRAS.
 *
 *  - Busca en nombre, SKU y código de barras («Todo»), o sólo en uno («Nombre»
 *    / «Código»).
 *  - Con el lector: el código llega con Enter y el producto se agrega directo
 *    si coincide exacto (código de barras o SKU).
 *  - Si no existe, ofrece darlo de alta ahí mismo con lo que se escribió
 *    (código de barras o nombre ya llenos).
 */
withDefaults(defineProps<{
  inputId: string
  label?: string
  /** Ofrecer «Crear producto» cuando no se encuentra. */
  allowCreate?: boolean
}>(), { label: 'Agregar producto', allowCreate: true })

const emit = defineEmits<{
  (e: 'select', product: Product): void
  (e: 'create', prefill: { name?: string; barcode?: string }): void
}>()

const productStore = useProductStore()
const { formatCurrency } = useCurrency()

const MODOS: { value: ProductSearchField; label: string; hint: string }[] = [
  { value: 'all', label: 'Todo', hint: 'Nombre, SKU o código de barras' },
  { value: 'name', label: 'Nombre', hint: 'Sólo el nombre del producto' },
  { value: 'code', label: 'Código', hint: 'SKU o código de barras (escáner)' },
]

const modo = ref<ProductSearchField>('all')
const query = ref('')
const results = ref<Product[]>([])
const isSearching = ref(false)
/** Ya se buscó este texto (para distinguir "sin resultados" de "aún no busca"). */
const searchedFor = ref('')
const active = ref(-1)
const inputEl = ref<HTMLInputElement | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null
let seq = 0

const placeholder = computed(() => ({
  all: 'Escanea o escribe nombre, SKU o código de barras…',
  name: 'Escribe el nombre del producto…',
  code: 'Escanea o escribe el código de barras o SKU…',
}[modo.value]))

const notFound = computed(() =>
  !isSearching.value && !!query.value.trim() && searchedFor.value === query.value.trim() && results.value.length === 0,
)
const showPanel = computed(() => !!query.value.trim() && (results.value.length > 0 || notFound.value))

async function runSearch(text: string): Promise<Product[]> {
  const mine = ++seq
  isSearching.value = true
  try {
    const found = await productStore.searchProductsLocally({ name: text, by: modo.value, limit: 6 })
    if (mine === seq) {
      results.value = found
      searchedFor.value = text
      active.value = found.length ? 0 : -1
    }
    return found
  } finally {
    if (mine === seq) isSearching.value = false
  }
}

function onInput() {
  if (timer) clearTimeout(timer)
  const text = query.value.trim()
  if (!text) {
    seq++
    results.value = []
    searchedFor.value = ''
    isSearching.value = false
    return
  }
  timer = setTimeout(() => void runSearch(text), 300)
}

function reset() {
  if (timer) clearTimeout(timer)
  seq++
  query.value = ''
  results.value = []
  searchedFor.value = ''
  isSearching.value = false
  active.value = -1
}

function choose(p: Product) {
  emit('select', p)
  reset()
  inputEl.value?.focus()
}

function crear() {
  emit('create', prefillAlta(query.value))
  reset()
}

/**
 * Enter: lo que haría un cajero. Código exacto (escáner) → se agrega; un solo
 * resultado → se agrega; con la lista abierta → el resaltado; nada → ofrecer alta.
 */
async function onEnter() {
  const text = query.value.trim()
  if (!text) return
  if (timer) clearTimeout(timer)

  if (modo.value !== 'name' && pareceCodigo(text)) {
    const exacto = await productStore.fetchByBarcode(text)
    if (exacto) return choose(exacto)
  }
  const lista = searchedFor.value === text ? results.value : await runSearch(text)
  const exacta = coincidenciaExacta(text, lista)
  if (exacta) return choose(exacta)
  if (lista.length === 1) return choose(lista[0]!)
  const resaltado = lista[active.value]
  if (resaltado) return choose(resaltado)
}

function move(delta: number) {
  if (!results.value.length) return
  const n = results.value.length
  active.value = (active.value + delta + n) % n
}

function setModo(m: ProductSearchField) {
  modo.value = m
  if (query.value.trim()) void runSearch(query.value.trim())
  inputEl.value?.focus()
}

defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<template>
  <div class="relative">
    <div class="mb-1.5 flex flex-wrap items-end justify-between gap-2">
      <label :for="inputId" class="label-base mb-0">{{ label }}</label>
      <!-- Dónde buscar -->
      <div class="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs dark:bg-gray-900/60" role="radiogroup" aria-label="Buscar por">
        <button
          v-for="m in MODOS"
          :key="m.value"
          type="button"
          role="radio"
          :aria-checked="modo === m.value"
          :title="m.hint"
          class="rounded-md px-2.5 py-1 font-semibold transition-colors"
          :class="modo === m.value
            ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-700 dark:text-primary-300'
            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
          :data-testid="`purchase-search-mode-${m.value}`"
          @click="setModo(m.value)"
        >
          {{ m.label }}
        </button>
      </div>
    </div>

    <div class="relative">
      <Icon :name="modo === 'code' ? 'ph:barcode-bold' : 'ph:magnifying-glass-bold'" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        :id="inputId"
        ref="inputEl"
        v-model="query"
        type="search"
        autocomplete="off"
        :placeholder="placeholder"
        class="input-base pl-10 pr-10 border-primary-200 focus:ring-primary-500"
        role="combobox"
        :aria-expanded="showPanel"
        :aria-controls="`${inputId}-list`"
        data-testid="purchase-product-search"
        @input="onInput"
        @keydown.enter.prevent="onEnter"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.esc.stop="reset"
      />
      <Icon v-if="isSearching" name="ph:spinner-gap-bold" class="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary-500" />
    </div>

    <div
      v-if="showPanel"
      :id="`${inputId}-list`"
      class="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
    >
      <ul v-if="results.length" class="max-h-72 overflow-y-auto" role="listbox">
        <li v-for="(product, i) in results" :key="product.id" role="option" :aria-selected="i === active">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 dark:border-gray-700"
            :class="i === active ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'"
            @mouseenter="active = i"
            @click="choose(product)"
          >
            <div class="min-w-0">
              <p class="truncate font-bold text-gray-900 dark:text-white">
                {{ product.name }}
                <span v-if="!product.isActive" class="ml-1 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-600 dark:bg-gray-700 dark:text-gray-300">Inactivo</span>
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                SKU: {{ product.sku }}<template v-if="product.barcode"> · <span class="font-mono">{{ product.barcode }}</span></template> · Costo ref.: {{ formatCurrency(Number(product.cost)) }}
              </p>
            </div>
            <Icon name="ph:plus-circle-bold" class="h-6 w-6 shrink-0 text-primary-600" />
          </button>
        </li>
      </ul>

      <div v-if="notFound" class="px-4 py-4 text-sm" data-testid="purchase-product-not-found">
        <p class="text-gray-600 dark:text-gray-300">
          No encontramos <strong class="break-all">«{{ query.trim() }}»</strong> en el catálogo<template v-if="modo !== 'all'"> (buscando sólo por {{ modo === 'name' ? 'nombre' : 'código' }})</template>.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button v-if="allowCreate" type="button" class="btn-primary py-2 text-sm" data-testid="purchase-product-create" @click="crear">
            <Icon name="ph:plus-circle-bold" class="mr-1.5" /> Dar de alta este producto
          </button>
          <button v-if="modo !== 'all'" type="button" class="btn-secondary py-2 text-sm" @click="setModo('all')">
            Buscar en todo
          </button>
        </div>
      </div>
      <button
        v-else-if="allowCreate"
        type="button"
        class="flex w-full items-center gap-2 border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-left text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900/40 dark:text-primary-300 dark:hover:bg-primary-900/20"
        @click="crear"
      >
        <Icon name="ph:plus-bold" /> ¿Es un producto nuevo? Darlo de alta
      </button>
    </div>
  </div>
</template>
