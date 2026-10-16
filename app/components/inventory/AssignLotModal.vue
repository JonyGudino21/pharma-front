<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useInventoryStore, type ProductStockSnapshot } from '~/stores/inventory'
import { useToast } from '~/composables/useToast'
import type { Product } from '~/stores/product'

/**
 * ASIGNAR LOTE A EXISTENCIA SIN LOTE.
 *
 * Para la mercancía que ya estaba en el sistema antes de manejar lotes: no tiene
 * caducidad registrada, así que no entra al "primero lo que caduca primero" ni a
 * las alertas, y un medicamento controlado en esa situación no se puede vender.
 * Aquí se le pone el lote y la caducidad que vienen impresos en la caja. La
 * existencia total no cambia.
 */
const props = defineProps<{ modelValue: boolean; product: Product | null }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; success: [] }>()

const store = useInventoryStore()
const toast = useToast()

const snapshot = ref<ProductStockSnapshot | null>(null)
const loading = ref(false)
const saving = ref(false)
const form = reactive({ lotNumber: '', expiryDate: '', quantity: 0 })

const today = new Date().toLocaleDateString('en-CA') // AAAA-MM-DD local
const sinLote = computed(() => snapshot.value?.unbatched ?? 0)

watch(
  () => [props.modelValue, props.product?.id] as const,
  async ([abierto]) => {
    if (!abierto || !props.product) return
    form.lotNumber = ''
    form.expiryDate = ''
    loading.value = true
    snapshot.value = await store.fetchStock(props.product.id)
    form.quantity = snapshot.value?.unbatched ?? 0
    loading.value = false
  },
  { immediate: true },
)

const error = computed(() => {
  if (!form.lotNumber.trim()) return 'Escribe el número de lote (viene impreso en la caja, junto a la caducidad).'
  if (!form.expiryDate) return 'Indica la caducidad.'
  if (form.expiryDate < today) return 'Esa caducidad ya pasó: un lote caducado no se asigna, se da de baja.'
  if (!Number.isInteger(form.quantity) || form.quantity < 1) return 'Indica cuántas piezas tienen ese lote.'
  if (form.quantity > sinLote.value) return `Sólo hay ${sinLote.value} pieza(s) sin lote.`
  return ''
})

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  if (!props.product || error.value || saving.value) return
  saving.value = true
  try {
    const r = await store.regularizeLot({
      productId: props.product.id,
      lotNumber: form.lotNumber.trim().toUpperCase(),
      expiryDate: form.expiryDate,
      quantity: form.quantity,
    })
    toast.success(
      r.remainingUnbatched > 0
        ? `Lote ${r.lotNumber} asignado a ${r.assigned} pieza(s). Quedan ${r.remainingUnbatched} sin lote: repite con el siguiente lote.`
        : `Lote ${r.lotNumber} asignado a ${r.assigned} pieza(s). Toda la existencia ya tiene lote.`,
    )
    emit('success')
    if (r.remainingUnbatched > 0) {
      // Siguiente lote del mismo producto, sin cerrar el modal.
      snapshot.value = await store.fetchStock(props.product.id)
      form.lotNumber = ''
      form.expiryDate = ''
      form.quantity = r.remainingUnbatched
    } else {
      close()
    }
  } catch {
    // El interceptor ya mostró el motivo (sin permiso, lote con otra caducidad…).
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="modelValue" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="assign-lot-title" @keydown.esc="close">
    <div class="modal-panel sm:max-w-lg">
      <div class="modal-header">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
            <Icon name="ph:barcode-bold" class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <h2 id="assign-lot-title" class="text-lg font-bold text-gray-900 dark:text-white">Asignar lote</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Para mercancía que ya tenías antes de usar lotes</p>
          </div>
        </div>
        <button type="button" class="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200" aria-label="Cerrar" @click="close">
          <Icon name="ph:x-bold" class="h-6 w-6" />
        </button>
      </div>

      <div class="modal-body space-y-5">
        <div v-if="product" class="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
          <p class="font-bold break-words text-gray-900 dark:text-white">{{ product.name }}</p>
          <p class="mt-0.5 font-mono text-xs text-gray-500">SKU {{ product.sku }}</p>
          <div v-if="loading" class="mt-3 h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
          <dl v-else-if="snapshot" class="mt-3 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-lg bg-gray-50 p-2 dark:bg-gray-900">
              <dt class="text-[11px] uppercase tracking-wide text-gray-500">Existencia</dt>
              <dd class="text-lg font-bold text-gray-900 dark:text-white">{{ snapshot.stock }}</dd>
            </div>
            <div class="rounded-lg bg-gray-50 p-2 dark:bg-gray-900">
              <dt class="text-[11px] uppercase tracking-wide text-gray-500">Con lote</dt>
              <dd class="text-lg font-bold text-success-600 dark:text-success-400">{{ snapshot.inLots ?? 0 }}</dd>
            </div>
            <div class="rounded-lg p-2" :class="sinLote > 0 ? 'bg-warning-50 dark:bg-warning-500/10' : 'bg-gray-50 dark:bg-gray-900'">
              <dt class="text-[11px] uppercase tracking-wide text-gray-500">Sin lote</dt>
              <dd class="text-lg font-bold" :class="sinLote > 0 ? 'text-warning-700 dark:text-warning-300' : 'text-gray-900 dark:text-white'">{{ sinLote }}</dd>
            </div>
          </dl>
        </div>

        <p v-if="!loading && snapshot && sinLote === 0" class="rounded-lg bg-success-50 p-3 text-sm text-success-800 dark:bg-success-500/10 dark:text-success-300" role="status">
          Toda la existencia de este producto ya tiene lote y caducidad. No hay nada que asignar.
        </p>

        <form v-else-if="!loading && snapshot" id="assignLotForm" class="space-y-4" @submit.prevent="submit">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Toma las cajas sin lote registrado y copia el <strong>número de lote</strong> y la <strong>caducidad</strong> impresos en ellas.
            Si tienes cajas de varios lotes, asígnalos uno por uno.
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="lotNumber" class="label-base">Número de lote *</label>
              <input id="lotNumber" v-model="form.lotNumber" type="text" maxlength="40" class="input-base font-mono uppercase" placeholder="Ej. PA24117" autocomplete="off" />
            </div>
            <div>
              <label for="lotExpiry" class="label-base">Caducidad *</label>
              <input id="lotExpiry" v-model="form.expiryDate" type="date" :min="today" class="input-base" />
            </div>
          </div>
          <div>
            <label for="lotQty" class="label-base">¿Cuántas piezas tienen este lote? *</label>
            <input id="lotQty" v-model.number="form.quantity" type="number" min="1" :max="sinLote" step="1" class="input-base" />
            <p class="mt-1 text-xs text-gray-500">La existencia total no cambia: sólo se registra de qué lote es cada pieza.</p>
          </div>
          <p v-if="error && (form.lotNumber || form.expiryDate)" class="text-xs text-error-600 dark:text-error-400" role="alert">{{ error }}</p>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-secondary" @click="close">{{ sinLote === 0 ? 'Cerrar' : 'Cancelar' }}</button>
        <button v-if="sinLote > 0" type="submit" form="assignLotForm" class="btn-primary gap-2" :disabled="!!error || saving">
          <Icon :name="saving ? 'ph:spinner-gap-bold' : 'ph:check-bold'" :class="{ 'animate-spin': saving }" />
          {{ saving ? 'Guardando…' : 'Asignar lote' }}
        </button>
      </div>
    </div>
  </div>
</template>
