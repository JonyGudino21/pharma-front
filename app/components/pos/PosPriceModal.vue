<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import { describirFallo } from '~/composables/useRequestState'
import { aCentavos } from '~/utils/money'
import { avisoMargen, evaluarMargen } from '~/utils/price-margin'
import type { PriceChangeRequest, PriceChangeResult, SaleItem } from '~/stores/sales'
import type { PricingSettings } from '~/types/settings'

/**
 * CAMBIAR EL PRECIO DE UNA LÍNEA EN CAJA (ADR-0025).
 *
 * Con cliente: la casilla "guardar para este cliente" deja el precio como su
 * precio especial (la próxima vez se le cobra solo). Sin cliente: sólo esta
 * venta. Avisa antes de enviar si el precio no deja ganancia; quien decide si
 * se permite es el servidor (Configuración › Precios en caja).
 */
const props = defineProps<{
  item: SaleItem
  clientName: string | null
  settings: PricingSettings | null
  /** Mostrar costo y ganancia en montos (gerencia). */
  showCost?: boolean
  /** Aplica en el servidor. Debe lanzar si falla. */
  apply: (req: PriceChangeRequest) => Promise<PriceChangeResult | null>
}>()

const emit = defineEmits<{ close: []; done: [result: PriceChangeResult | null] }>()

const { formatCurrency } = useCurrency()

const current = Number(props.item.price)
const list = props.item.listPrice != null ? Number(props.item.listPrice) : null
const cost = Number(props.item.costAtSale)
const pct = Number(props.item.discountPercent ?? 0)

const price = ref<number>(current)
const saveForClient = ref<boolean>(!!props.clientName && (props.settings?.saveForClientByDefault ?? true))
const reason = ref('')
const busy = ref(false)
const serverError = ref<string | null>(null)
const priceInput = ref<HTMLInputElement | null>(null)

const validPrice = computed(
  () =>
    Number.isFinite(price.value) &&
    price.value >= 0.01 &&
    price.value <= 999999.99 &&
    Math.abs(Math.round(price.value * 100) - price.value * 100) < 1e-6,
)
const mismoQueActual = computed(() => aCentavos(price.value) === aCentavos(current))
const igualALista = computed(() => list !== null && aCentavos(price.value) === aCentavos(list))

const margen = computed(() => evaluarMargen(validPrice.value ? price.value : 0, cost, pct))
const aviso = computed(() => (validPrice.value ? avisoMargen(margen.value, !!props.showCost, cost) : null))
const bloqueadoPorCosto = computed(
  () => validPrice.value && margen.value.estado === 'BAJO_COSTO' && !props.settings?.allowBelowCost,
)

/** Importe de la línea con el precio nuevo (conserva el descuento de la línea). */
const importe = computed(() => {
  if (!validPrice.value) return 0
  const bruto = aCentavos(price.value) * props.item.quantity
  return Math.round(bruto * (1 - pct / 100)) / 100
})

const needsReason = computed(() => props.settings?.requireReason ?? false)

// Mismo precio sólo tiene sentido si es para guardarlo como especial del cliente.
const algoQueGuardar = computed(
  () => !mismoQueActual.value || (saveForClient.value && !!props.clientName && props.item.priceSource !== 'CLIENT' && !igualALista.value),
)

const canSubmit = computed(
  () =>
    !busy.value &&
    validPrice.value &&
    algoQueGuardar.value &&
    !bloqueadoPorCosto.value &&
    (!needsReason.value || reason.value.trim().length > 0),
)

async function submit() {
  if (!canSubmit.value) return
  busy.value = true
  serverError.value = null
  try {
    const res = await props.apply({
      price: price.value,
      saveForClient: !!props.clientName && saveForClient.value,
      reason: reason.value.trim() || undefined,
    })
    emit('done', res)
  } catch (e) {
    serverError.value = describirFallo(e).mensaje
  } finally {
    busy.value = false
  }
}

onMounted(() => nextTick(() => priceInput.value?.select()))
</script>

<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="priceTitle" @keydown.esc="emit('close')" @click.self="emit('close')">
    <form class="modal-panel sm:max-w-md sm:border sm:border-gray-100 sm:shadow-2xl dark:sm:border-gray-700" data-testid="pos-price-modal" @submit.prevent="submit">
      <div class="modal-header">
        <div class="min-w-0">
          <h2 id="priceTitle" class="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <Icon name="ph:tag-bold" class="text-primary-600" /> Cambiar precio
          </h2>
          <p class="truncate text-sm text-gray-500 dark:text-gray-400">{{ item.product?.name ?? 'Producto' }} · {{ item.quantity }} pza{{ item.quantity === 1 ? '' : 's' }}</p>
        </div>
        <button type="button" class="-mr-2 -mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200" aria-label="Cerrar" @click="emit('close')">
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>
      </div>

      <div v-if="!settings" class="modal-body text-sm text-gray-500 dark:text-gray-400">Cargando reglas de precios…</div>

      <div v-else class="modal-body space-y-4">
        <!-- Referencias -->
        <dl class="grid grid-cols-2 gap-2 text-sm" :class="showCost ? 'sm:grid-cols-3' : ''">
          <div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
            <dt class="text-xs text-gray-500 dark:text-gray-400">Precio actual</dt>
            <dd class="font-semibold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(current) }}</dd>
          </div>
          <div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
            <dt class="text-xs text-gray-500 dark:text-gray-400">Precio de lista</dt>
            <dd class="font-semibold tabular-nums text-gray-900 dark:text-white">{{ list !== null ? formatCurrency(list) : '—' }}</dd>
          </div>
          <div v-if="showCost" class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
            <dt class="text-xs text-gray-500 dark:text-gray-400">Costo</dt>
            <dd class="font-semibold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(cost) }}</dd>
          </div>
        </dl>

        <!-- Precio nuevo -->
        <div>
          <label for="newPrice" class="label-base">Precio nuevo por pieza (con IVA)</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              id="newPrice"
              ref="priceInput"
              v-model.number="price"
              type="number"
              min="0.01"
              max="999999.99"
              step="0.01"
              inputmode="decimal"
              class="input-base pl-7 text-xl font-bold tabular-nums"
              :aria-invalid="!validPrice || bloqueadoPorCosto"
              aria-describedby="priceMargin"
              data-testid="pos-price-input"
            />
          </div>
          <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              v-if="list !== null && !igualALista"
              type="button"
              class="rounded-md px-2 py-1 font-medium text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
              @click="price = list"
            >
              Usar precio de lista ({{ formatCurrency(list) }})
            </button>
            <span class="ml-auto text-gray-500 dark:text-gray-400">
              Importe: <strong class="tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(importe) }}</strong>
              <template v-if="pct > 0"> (con −{{ pct }}%)</template>
            </span>
          </div>
          <p v-if="!validPrice" class="mt-1 text-xs text-error-600 dark:text-error-400">Escribe un precio mayor a cero, con hasta 2 decimales.</p>
        </div>

        <!-- Ganancia -->
        <div id="priceMargin" aria-live="polite">
          <p
            v-if="validPrice && margen.estado === 'OK'"
            class="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-800 dark:bg-success-900/20 dark:text-success-300"
          >
            <Icon name="ph:check-circle-bold" class="h-4 w-4 shrink-0" />
            <span v-if="showCost">Deja {{ formatCurrency(margen.porPieza) }} por pieza ({{ margen.porcentaje }} %).</span>
            <span v-else>Deja ganancia.</span>
          </p>
          <p
            v-else-if="aviso"
            class="flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
            :class="bloqueadoPorCosto ? 'bg-error-50 text-error-800 dark:bg-error-900/20 dark:text-error-300' : 'bg-warning-50 text-warning-900 dark:bg-warning-900/20 dark:text-warning-200'"
            role="alert"
            data-testid="pos-price-margin"
          >
            <Icon name="ph:warning-bold" class="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {{ aviso }}
              <template v-if="bloqueadoPorCosto"> No se permite vender bajo costo (Configuración › Precios en caja).</template>
            </span>
          </p>
        </div>

        <!-- Precio especial del cliente -->
        <div v-if="clientName" class="rounded-xl border border-gray-100 p-3 dark:border-gray-700">
          <label class="flex cursor-pointer items-start gap-3">
            <input v-model="saveForClient" type="checkbox" class="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600" data-testid="pos-price-save-client" />
            <span class="text-sm">
              <span class="font-medium text-gray-900 dark:text-white">Guardar como precio especial de {{ clientName }}</span>
              <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                <template v-if="!saveForClient">Sólo se aplica a esta venta.</template>
                <template v-else-if="igualALista">Es el precio de lista: {{ clientName }} vuelve a seguir la lista (sin precio especial).</template>
                <template v-else-if="validPrice">La próxima vez que elijas a {{ clientName }}, este producto se cobrará a {{ formatCurrency(price) }}.</template>
              </span>
            </span>
          </label>
        </div>
        <p v-else class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Icon name="ph:info" class="h-4 w-4 shrink-0" />
          Venta a Público General: el precio se aplica sólo a esta venta. Para guardar precios especiales, primero elige al cliente.
        </p>

        <!-- Motivo -->
        <div>
          <label for="priceReason" class="label-base">Motivo {{ needsReason ? '' : '(opcional)' }}</label>
          <input id="priceReason" v-model="reason" type="text" maxlength="200" class="input-base" placeholder="Ej. Precio acordado, viáticos, volumen…" />
        </div>

        <p v-if="serverError" class="text-sm text-error-600 dark:text-error-400" role="alert">{{ serverError }}</p>
      </div>

      <div class="modal-footer bg-gray-50 dark:bg-gray-800/80">
        <button type="button" class="btn-secondary py-2.5 sm:py-2" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary gap-2 py-2.5 sm:py-2" :disabled="!canSubmit" data-testid="pos-price-submit">
          <Icon v-if="busy" name="ph:spinner-gap-bold" class="h-4 w-4 animate-spin" />
          Cambiar precio
        </button>
      </div>
    </form>
  </div>
</template>
