<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

      <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="ph:arrow-u-up-left-bold" class="text-primary-600" /> Registrar Devolución
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Venta {{ sale.invoiceNumber || `#${sale.id}` }} · {{ sale.client?.name || 'Público General' }}
          </p>
        </div>
        <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="close">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-5">
        <div class="space-y-3">
          <div
            v-for="item in lineasDevolubles"
            :key="item.id"
            class="rounded-xl border p-4 transition-colors"
            :class="lineas[item.id]!.quantity > 0
              ? 'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/10'
              : 'border-gray-200 dark:border-gray-700'"
          >
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ item.product?.name || `Producto #${item.productId}` }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ formatCurrency(Number(item.price)) }} c/u ·
                  Vendidas: {{ item.quantity }} ·
                  Devueltas: {{ devueltas(item.id) }} ·
                  <span class="font-semibold text-gray-700 dark:text-gray-300">
                    Disponibles: {{ disponibles(item.id) }}
                  </span>
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <label class="text-xs font-semibold text-gray-500 uppercase">Devolver</label>
                <input
                  :value="lineas[item.id]!.quantity"
                  type="number"
                  min="0"
                  :max="disponibles(item.id)"
                  class="input-base w-24 text-center font-bold"
                  @input="fijarCantidad(item.id, ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!--
              El estado de la mercancía NO tiene valor por defecto, ni aquí ni en
              el backend. Si se preseleccionara "buen estado", un medicamento
              dañado volvería al anaquel con un solo clic distraído; si se
              preseleccionara "dañado", una devolución sana se contabilizaría
              como merma. Se obliga a decidir.
            -->
            <div v-if="lineas[item.id]!.quantity > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p class="text-xs font-semibold text-gray-500 uppercase mb-2">
                Estado de la mercancía <span class="text-error-500">*</span>
              </p>
              <div class="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  class="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors"
                  :class="lineas[item.id]!.restock === true
                    ? 'border-success-500 bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'"
                  @click="lineas[item.id]!.restock = true"
                >
                  <Icon name="ph:package-bold" class="w-5 h-5 shrink-0" />
                  <span class="text-left">Buen estado<br /><span class="text-xs font-normal">Vuelve al anaquel</span></span>
                </button>

                <button
                  type="button"
                  class="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors"
                  :class="lineas[item.id]!.restock === false
                    ? 'border-error-500 bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'"
                  @click="lineas[item.id]!.restock = false"
                >
                  <Icon name="ph:trash-bold" class="w-5 h-5 shrink-0" />
                  <span class="text-left">Dañada o caducada<br /><span class="text-xs font-normal">Se registra como merma</span></span>
                </button>
              </div>

              <input
                v-model="lineas[item.id]!.reason"
                type="text"
                class="input-base mt-3"
                placeholder="Motivo (opcional): caducidad, empaque roto, error de cobro..."
              />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="form.refundToCustomer" type="checkbox" class="mt-1 w-4 h-4 accent-primary-600" />
            <span>
              <span class="block text-sm font-semibold text-gray-900 dark:text-white">
                Reintegrar el importe al cliente
              </span>
              <span class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Primero cancela lo que el cliente aún debe por esta venta; el resto sale en
                efectivo de tu caja. Sin marcar, la mercancía reingresa pero no se mueve dinero.
              </span>
            </span>
          </label>

          <p
            v-if="form.refundToCustomer && efectivoEstimado > 0"
            class="text-xs font-bold text-warning-600 dark:text-warning-400 flex items-center gap-1"
          >
            <Icon name="ph:warning-circle-fill" />
            Saldrán hasta {{ formatCurrency(efectivoEstimado) }} en efectivo: requiere caja abierta.
          </p>

          <div>
            <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Nota de la devolución</label>
            <input v-model="form.note" type="text" class="input-base" placeholder="Opcional" />
          </div>
        </div>

        <div class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase">Total a devolver</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ unidadesSeleccionadas }} unidad(es)</p>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">
            {{ formatCurrency(totalDevolucion) }}
          </p>
        </div>

        <p v-if="errorValidacion" class="text-sm font-semibold text-error-600 dark:text-error-400 flex items-center gap-2">
          <Icon name="ph:warning-circle-fill" /> {{ errorValidacion }}
        </p>
      </div>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
        <button type="button" class="btn-secondary" @click="close">Cancelar</button>
        <button
          type="button"
          :disabled="!!errorValidacion || store.isActionLoading"
          class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          @click="enviar"
        >
          <Icon v-if="store.isActionLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          Confirmar devolución
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useSalesHistoryStore, type SaleDetail } from '~/stores/salesHistory'
import { useCurrency } from '~/composables/useCurrency'

const props = defineProps<{ modelValue: boolean; sale: SaleDetail }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  done: []
}>()

const store = useSalesHistoryStore()
const { formatCurrency } = useCurrency()

/** `restock: null` = el operador todavía no ha decidido. No es lo mismo que `false`. */
type LineaFormulario = { quantity: number; restock: boolean | null; reason: string }

const lineas = reactive<Record<number, LineaFormulario>>({})
const form = reactive({ refundToCustomer: true, note: '' })
const enviado = ref(false)

const devueltas = (saleItemId: number) => store.returnedByItem[saleItemId] ?? 0
const disponibles = (saleItemId: number) => store.returnableByItem[saleItemId] ?? 0

const lineasDevolubles = computed(() =>
  (props.sale.items ?? []).filter((item) => disponibles(item.id) > 0),
)

const seleccionadas = computed(() =>
  Object.entries(lineas)
    .map(([id, linea]) => ({ saleItemId: Number(id), ...linea }))
    .filter((linea) => linea.quantity > 0),
)

const unidadesSeleccionadas = computed(() =>
  seleccionadas.value.reduce((acc, l) => acc + l.quantity, 0),
)

const totalDevolucion = computed(() =>
  seleccionadas.value.reduce((acc, linea) => {
    const item = props.sale.items.find((i) => i.id === linea.saleItemId)
    return acc + linea.quantity * Number(item?.price ?? 0)
  }, 0),
)

/**
 * Cuánto de la devolución saldría en efectivo: lo que exceda la deuda viva de
 * la venta. Es una estimación para avisar al cajero; el reparto exacto lo
 * decide el backend dentro de la transacción.
 */
const efectivoEstimado = computed(() =>
  Math.max(0, totalDevolucion.value - Number(props.sale.balance ?? 0)),
)

const errorValidacion = computed(() => {
  if (seleccionadas.value.length === 0) return 'Indica cuántas unidades vas a devolver.'

  for (const linea of seleccionadas.value) {
    const maximo = disponibles(linea.saleItemId)
    if (linea.quantity > maximo) {
      const item = props.sale.items.find((i) => i.id === linea.saleItemId)
      return `De "${item?.product?.name ?? 'ese producto'}" solo quedan ${maximo} unidad(es) por devolver.`
    }
    if (linea.restock === null) {
      const item = props.sale.items.find((i) => i.id === linea.saleItemId)
      return `Indica si "${item?.product?.name ?? 'el producto'}" vuelve al anaquel o se da de baja.`
    }
  }
  return ''
})

function reiniciar() {
  for (const clave of Object.keys(lineas)) delete lineas[Number(clave)]
  for (const item of props.sale.items ?? []) {
    lineas[item.id] = { quantity: 0, restock: null, reason: '' }
  }
  form.refundToCustomer = true
  form.note = ''
  enviado.value = false
}

watch(() => props.modelValue, (abierto) => { if (abierto) reiniciar() }, { immediate: true })

function fijarCantidad(saleItemId: number, raw: string) {
  const linea = lineas[saleItemId]
  if (!linea) return
  const maximo = disponibles(saleItemId)
  const valor = Number(raw)
  if (!Number.isFinite(valor) || valor < 0) {
    linea.quantity = 0
    return
  }
  linea.quantity = Math.min(Math.floor(valor), maximo)
}

const close = () => emit('update:modelValue', false)

async function enviar() {
  if (errorValidacion.value || enviado.value) return
  enviado.value = true

  const ok = await store.createReturn(props.sale.id, {
    items: seleccionadas.value.map((linea) => ({
      saleItemId: linea.saleItemId,
      quantity: linea.quantity,
      restock: linea.restock as boolean,
      reason: linea.reason.trim() || undefined,
    })),
    refundToCustomer: form.refundToCustomer,
    note: form.note.trim() || undefined,
  })

  if (ok) {
    emit('done')
    close()
  } else {
    enviado.value = false // el backend rechazó: permitimos corregir y reintentar
  }
}
</script>
