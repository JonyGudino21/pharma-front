<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToast } from '~/composables/useToast'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import { useClientPrices, type ClientPrice, type ClientPriceHistoryItem } from '~/composables/useClientPrices'
import { avisoMargen, evaluarMargen } from '~/utils/price-margin'
import ClientPriceModal from '~/components/clients/ClientPriceModal.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'

/**
 * PRECIOS ESPECIALES DEL CLIENTE (ADR-0025).
 *
 * A la farmacia A el paracetamol en $10 y a la B en $12: aquí se ven, se
 * capturan y se quitan, con quién y cuándo cambió cada uno. También nacen en
 * caja, al cambiar el precio con este cliente seleccionado.
 */
const props = defineProps<{ clientId: number; clientName: string }>()

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toast = useToast()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()

const cp = useClientPrices(props.clientId)
const canEdit = computed(() => authStore.can('canEditClient'))
const showCost = computed(() => authStore.can('canViewInventoryValuation'))
const pricingCfg = computed(() => settingsStore.valuesOf('pricing'))

const editing = ref<ClientPrice | null>(null)
const adding = ref(false)
const removing = ref<ClientPrice | null>(null)
const removingBusy = ref(false)
const historyOf = ref<ClientPrice | null>(null)
const historyRows = ref<ClientPriceHistoryItem[]>([])
const historyLoading = ref(false)

const existing = computed(() =>
  editing.value
    ? {
        productId: editing.value.productId,
        name: editing.value.product.name,
        sku: editing.value.product.sku,
        listPrice: Number(editing.value.listPrice),
        cost: Number(editing.value.product.cost),
        price: Number(editing.value.price),
      }
    : null,
)

function aviso(p: ClientPrice) {
  return avisoMargen(evaluarMargen(p.price, p.product.cost), showCost.value, p.product.cost)
}

async function guardar(productId: number, price: number, reason?: string) {
  const r = await cp.save(productId, price, reason)
  toast.success(r.message)
  if (r.margin === 'SIN_GANANCIA') toast.warning('Ojo: con ese precio no hay ganancia.')
}

function cerrarModal() {
  editing.value = null
  adding.value = false
}

async function confirmarQuitar() {
  if (!removing.value) return
  removingBusy.value = true
  try {
    const r = await cp.remove(removing.value.productId)
    toast.success(r.message)
    removing.value = null
  } catch {
    // El interceptor ya mostró el motivo.
  } finally {
    removingBusy.value = false
  }
}

async function verHistorial(p: ClientPrice) {
  historyOf.value = p
  historyLoading.value = true
  try {
    historyRows.value = await cp.history(p.productId)
  } catch {
    historyRows.value = []
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  void cp.load()
  void settingsStore.fetch('pricing').catch(() => null)
})
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800" data-testid="client-special-prices" aria-labelledby="cpTitle">
    <header class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
      <div class="min-w-0">
        <h2 id="cpTitle" class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <Icon name="ph:tag-bold" class="text-primary-600" /> Precios especiales
          <span v-if="cp.prices.value.length" class="rounded-full bg-gray-100 px-2 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ cp.prices.value.length }}</span>
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Se aplican solos cuando eliges a {{ clientName }} en caja. Lo demás se cobra a precio de lista.</p>
      </div>
      <button v-if="canEdit" type="button" class="btn-primary gap-2" data-testid="client-price-add" @click="adding = true">
        <Icon name="ph:plus-bold" /> Agregar precio
      </button>
    </header>

    <div v-if="cp.loading.value && !cp.prices.value.length" class="space-y-2 p-4" aria-busy="true">
      <div v-for="n in 3" :key="n" class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
    </div>

    <div v-else-if="cp.loadError.value" class="p-6 text-center" role="alert">
      <p class="text-sm text-gray-700 dark:text-gray-200">{{ cp.loadError.value.mensaje }}</p>
      <button type="button" class="btn-secondary mx-auto mt-3 gap-2" @click="cp.load()"><Icon name="ph:arrow-clockwise-bold" /> Reintentar</button>
    </div>

    <div v-else-if="!cp.prices.value.length" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      <Icon name="ph:tag" class="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
      Sin precios especiales: {{ clientName }} paga los precios de lista.
      <span class="mt-1 block text-xs">Agrégalos aquí o cambia el precio en caja con este cliente seleccionado.</span>
    </div>

    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
      <li v-for="p in cp.prices.value" :key="p.productId" class="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4" data-testid="client-price-row">
        <div class="min-w-0">
          <p class="truncate font-medium text-gray-900 dark:text-white">
            {{ p.product.name }}
            <span v-if="!p.product.isActive" class="ml-1 rounded bg-gray-100 px-1.5 text-[10px] font-bold uppercase text-gray-500 dark:bg-gray-700">Inactivo</span>
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ p.product.sku }}
            <template v-if="p.changedBy"> · {{ p.changedBy }}, {{ formatDateTime(p.updatedAt) }}</template>
            <template v-if="p.reason"> · «{{ p.reason }}»</template>
            <template v-if="p.sale?.invoiceNumber"> · <NuxtLink :to="`/sales/${p.sale.id}`" class="text-primary-700 hover:underline dark:text-primary-300">{{ p.sale.invoiceNumber }}</NuxtLink></template>
          </p>
        </div>

        <div class="flex items-baseline gap-3 tabular-nums sm:justify-end">
          <span class="text-xs text-gray-400 line-through" :title="`Precio de lista: ${formatCurrency(Number(p.listPrice))}`">{{ formatCurrency(Number(p.listPrice)) }}</span>
          <span class="text-lg font-bold text-gray-900 dark:text-white">{{ formatCurrency(Number(p.price)) }}</span>
          <span class="text-xs font-semibold" :class="Number(p.difference) < 0 ? 'text-success-600 dark:text-success-400' : 'text-warning-600 dark:text-warning-400'">
            {{ Number(p.difference) > 0 ? '+' : '−' }}{{ formatCurrency(Math.abs(Number(p.difference))) }}
          </span>
          <span v-if="aviso(p)" class="inline-flex" :class="p.margin === 'BAJO_COSTO' ? 'text-error-600' : 'text-warning-600'" :title="aviso(p) ?? undefined" role="img" :aria-label="aviso(p) ?? undefined">
            <Icon name="ph:warning-bold" class="h-4 w-4" />
          </span>
        </div>

        <div v-if="canEdit" class="flex justify-end gap-1">
          <button type="button" class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" :aria-label="`Historial de ${p.product.name}`" title="Historial" @click="verHistorial(p)"><Icon name="ph:clock-counter-clockwise-bold" class="h-4 w-4" /></button>
          <button type="button" class="rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" :aria-label="`Cambiar precio de ${p.product.name}`" title="Cambiar" @click="editing = p"><Icon name="ph:pencil-simple-bold" class="h-4 w-4" /></button>
          <button type="button" class="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20" :aria-label="`Quitar precio especial de ${p.product.name}`" title="Quitar (vuelve a precio de lista)" @click="removing = p"><Icon name="ph:x-circle-bold" class="h-4 w-4" /></button>
        </div>
      </li>
    </ul>

    <ClientPriceModal
      v-if="adding || editing"
      :client-name="clientName"
      :existing="existing"
      :allow-below-cost="pricingCfg?.allowBelowCost ?? false"
      :require-reason="pricingCfg?.requireReason ?? false"
      :show-cost="showCost"
      :save="guardar"
      @close="cerrarModal"
      @done="cerrarModal"
    />

    <ConfirmModal
      v-if="removing"
      title="Quitar precio especial"
      :message="`${clientName} volverá a pagar ${removing.product.name} a precio de lista (${formatCurrency(Number(removing.listPrice))}). Queda registrado en el historial.`"
      confirm-text="Quitar"
      type="warning"
      :is-loading="removingBusy"
      @confirm="confirmarQuitar"
      @cancel="removing = null"
    />

    <!-- Historial de un producto -->
    <div v-if="historyOf" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cpHistTitle" @keydown.esc="historyOf = null" @click.self="historyOf = null">
      <div class="modal-panel sm:max-w-lg">
        <div class="modal-header">
          <div class="min-w-0">
            <h2 id="cpHistTitle" class="text-lg font-bold text-gray-900 dark:text-white">Historial de precio</h2>
            <p class="truncate text-sm text-gray-500 dark:text-gray-400">{{ historyOf.product.name }} · {{ clientName }}</p>
          </div>
          <button type="button" class="-mr-2 -mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Cerrar" @click="historyOf = null"><Icon name="ph:x-bold" class="h-5 w-5" /></button>
        </div>
        <div class="modal-body">
          <p v-if="historyLoading" class="text-sm text-gray-500">Cargando…</p>
          <p v-else-if="!historyRows.length" class="text-sm text-gray-500">Sin movimientos.</p>
          <ol v-else class="space-y-3">
            <li v-for="h in historyRows" :key="h.id" class="rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-700">
              <p class="font-medium text-gray-900 dark:text-white">
                <template v-if="h.endDate && h.endDate === h.startDate">Precio especial retirado</template>
                <template v-else>{{ h.previousPrice ? `${formatCurrency(Number(h.previousPrice))} → ` : '' }}{{ formatCurrency(Number(h.price)) }}</template>
                <span v-if="!h.endDate" class="ml-1 rounded bg-success-100 px-1.5 text-[10px] font-bold uppercase text-success-700 dark:bg-success-900/40 dark:text-success-300">Vigente</span>
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ h.changedBy }} · {{ formatDateTime(h.startDate) }}
                <template v-if="h.reason"> · «{{ h.reason }}»</template>
                <template v-if="h.sale?.invoiceNumber"> · venta {{ h.sale.invoiceNumber }}</template>
              </p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>
