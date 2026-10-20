<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import { describirFallo } from '~/composables/useRequestState'
import { useProductStore, type Product } from '~/stores/product'
import { aCentavos } from '~/utils/money'
import { avisoMargen, evaluarMargen } from '~/utils/price-margin'

/**
 * Capturar o cambiar el precio especial de un cliente desde su ficha
 * (ADR-0025). Al agregar, primero se busca el producto (nombre o SKU).
 */
const props = defineProps<{
  clientName: string
  /** Al editar: el producto y su precio especial actual. */
  existing?: { productId: number; name: string; sku: string; listPrice: number; cost: number; price: number } | null
  allowBelowCost: boolean
  requireReason: boolean
  showCost: boolean
  save: (productId: number, price: number, reason?: string) => Promise<unknown>
}>()

const emit = defineEmits<{ close: []; done: [] }>()

const { formatCurrency } = useCurrency()
const productStore = useProductStore()

type Elegido = { productId: number; name: string; sku: string; listPrice: number; cost: number }
const elegido = ref<Elegido | null>(props.existing ?? null)
const price = ref<number>(props.existing?.price ?? 0)
const reason = ref('')
const busy = ref(false)
const serverError = ref<string | null>(null)

// Búsqueda de producto (sólo al agregar)
const query = ref('')
const results = ref<Product[]>([])
const searching = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
const priceInput = ref<HTMLInputElement | null>(null)
let seq = 0

watch(query, async (q) => {
  const term = q.trim()
  const mio = ++seq
  if (term.length < 2) {
    results.value = []
    return
  }
  searching.value = true
  try {
    const r = await productStore.searchByNameOrSku(term, 8)
    if (mio === seq) results.value = r.filter((p) => p.isActive)
  } catch {
    if (mio === seq) results.value = []
  } finally {
    if (mio === seq) searching.value = false
  }
})

async function elegir(p: Product) {
  elegido.value = { productId: p.id, name: p.name, sku: p.sku, listPrice: Number(p.price), cost: Number(p.cost) }
  price.value = Number(p.price)
  results.value = []
  query.value = ''
  await nextTick()
  priceInput.value?.select()
}

const validPrice = computed(
  () => Number.isFinite(price.value) && price.value >= 0.01 && price.value <= 999999.99 && Math.abs(Math.round(price.value * 100) - price.value * 100) < 1e-6,
)
const margen = computed(() => evaluarMargen(validPrice.value ? price.value : 0, elegido.value?.cost ?? 0))
const aviso = computed(() => (validPrice.value && elegido.value ? avisoMargen(margen.value, props.showCost, elegido.value.cost) : null))
const bloqueadoPorCosto = computed(() => validPrice.value && margen.value.estado === 'BAJO_COSTO' && !props.allowBelowCost)
const igualALista = computed(() => !!elegido.value && aCentavos(price.value) === aCentavos(elegido.value.listPrice))
const diferencia = computed(() => (elegido.value && validPrice.value ? price.value - elegido.value.listPrice : 0))

const canSubmit = computed(
  () =>
    !busy.value &&
    !!elegido.value &&
    validPrice.value &&
    !bloqueadoPorCosto.value &&
    (!props.requireReason || reason.value.trim().length > 0) &&
    !(props.existing && aCentavos(price.value) === aCentavos(props.existing.price)),
)

async function submit() {
  if (!canSubmit.value || !elegido.value) return
  busy.value = true
  serverError.value = null
  try {
    await props.save(elegido.value.productId, price.value, reason.value.trim() || undefined)
    emit('done')
  } catch (e) {
    serverError.value = describirFallo(e).mensaje
  } finally {
    busy.value = false
  }
}

onMounted(() => nextTick(() => (props.existing ? priceInput.value?.select() : searchInput.value?.focus())))
</script>

<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="clientPriceTitle" @keydown.esc="emit('close')" @click.self="emit('close')">
    <form class="modal-panel sm:max-w-lg sm:border sm:border-gray-100 sm:shadow-2xl dark:sm:border-gray-700" data-testid="client-price-modal" @submit.prevent="submit">
      <div class="modal-header">
        <div class="min-w-0">
          <h2 id="clientPriceTitle" class="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <Icon name="ph:tag-bold" class="text-primary-600" /> {{ existing ? 'Cambiar precio especial' : 'Agregar precio especial' }}
          </h2>
          <p class="truncate text-sm text-gray-500 dark:text-gray-400">{{ clientName }}</p>
        </div>
        <button type="button" class="-mr-2 -mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200" aria-label="Cerrar" @click="emit('close')">
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>
      </div>

      <div class="modal-body space-y-4">
        <!-- Producto -->
        <div v-if="!elegido">
          <label for="cpSearch" class="label-base">Producto</label>
          <div class="relative">
            <Icon name="ph:magnifying-glass-bold" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="cpSearch" ref="searchInput" v-model="query" type="search" class="input-base pl-9" placeholder="Nombre o SKU…" autocomplete="off" data-testid="client-price-search" />
          </div>
          <p v-if="searching" class="mt-2 text-xs text-gray-500">Buscando…</p>
          <ul v-else-if="results.length" class="mt-2 max-h-60 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
            <li v-for="p in results" :key="p.id">
              <button type="button" class="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20" @click="elegir(p)">
                <span class="min-w-0">
                  <span class="block truncate text-sm font-medium text-gray-900 dark:text-white">{{ p.name }}</span>
                  <span class="block text-xs text-gray-500">{{ p.sku }}</span>
                </span>
                <span class="shrink-0 text-sm tabular-nums text-gray-700 dark:text-gray-300">{{ formatCurrency(Number(p.price)) }}</span>
              </button>
            </li>
          </ul>
          <p v-else-if="query.trim().length >= 2" class="mt-2 text-xs text-gray-500">No hay productos activos con «{{ query }}».</p>
        </div>

        <template v-else>
          <div class="flex items-start justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
            <div class="min-w-0">
              <p class="truncate font-medium text-gray-900 dark:text-white">{{ elegido.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ elegido.sku }} · Lista {{ formatCurrency(elegido.listPrice) }}<template v-if="showCost"> · Costo {{ formatCurrency(elegido.cost) }}</template>
              </p>
            </div>
            <button v-if="!existing" type="button" class="shrink-0 text-xs font-medium text-primary-700 hover:underline dark:text-primary-300" @click="elegido = null">Cambiar</button>
          </div>

          <div>
            <label for="cpPrice" class="label-base">Precio especial por pieza (con IVA)</label>
            <div class="relative">
              <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input id="cpPrice" ref="priceInput" v-model.number="price" type="number" min="0.01" max="999999.99" step="0.01" inputmode="decimal" class="input-base pl-7 text-xl font-bold tabular-nums" :aria-invalid="!validPrice || bloqueadoPorCosto" data-testid="client-price-input" />
            </div>
            <p v-if="validPrice && !igualALista" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ diferencia > 0 ? '+' : '−' }}{{ formatCurrency(Math.abs(diferencia)) }} contra el precio de lista.
            </p>
            <p v-if="igualALista" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Es el precio de lista: no se guarda como especial y {{ clientName }} seguirá la lista.
            </p>
          </div>

          <p
            v-if="aviso"
            class="flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
            :class="bloqueadoPorCosto ? 'bg-error-50 text-error-800 dark:bg-error-900/20 dark:text-error-300' : 'bg-warning-50 text-warning-900 dark:bg-warning-900/20 dark:text-warning-200'"
            role="alert"
          >
            <Icon name="ph:warning-bold" class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ aviso }}<template v-if="bloqueadoPorCosto"> No se permite vender bajo costo (Configuración › Precios en caja).</template></span>
          </p>

          <div>
            <label for="cpReason" class="label-base">Motivo {{ requireReason ? '' : '(opcional)' }}</label>
            <input id="cpReason" v-model="reason" type="text" maxlength="200" class="input-base" placeholder="Ej. Precio acordado, viáticos, volumen…" />
          </div>
        </template>

        <p v-if="serverError" class="text-sm text-error-600 dark:text-error-400" role="alert">{{ serverError }}</p>
      </div>

      <div class="modal-footer bg-gray-50 dark:bg-gray-800/80">
        <button type="button" class="btn-secondary py-2.5 sm:py-2" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary gap-2 py-2.5 sm:py-2" :disabled="!canSubmit" data-testid="client-price-submit">
          <Icon v-if="busy" name="ph:spinner-gap-bold" class="h-4 w-4 animate-spin" />
          Guardar
        </button>
      </div>
    </form>
  </div>
</template>
