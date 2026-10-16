<template>
  <div class="space-y-6 pb-20" v-if="purchase">

    <div class="page-header md:items-center">
      <div class="min-w-0">
        <NuxtLink to="/purchases" class="text-sm text-gray-500 hover:text-primary-600 inline-flex items-center mb-2 py-1 transition-colors">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver a compras
        </NuxtLink>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 break-all">
          Orden #{{ purchase.invoiceNumber }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          <span class="inline-flex items-center min-w-0"><Icon name="ph:buildings-bold" class="mr-1 shrink-0" /> <span class="truncate">{{ purchase.supplier?.name }}</span></span>
          <span class="hidden sm:inline">•</span>
          <span class="inline-flex items-center"><Icon name="ph:calendar-blank-bold" class="mr-1" /> {{ formatDateTime(purchase.createdAt) }}</span>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:gap-3 sm:shrink-0">
        <span class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold" :class="PURCHASE_STATUS_META[purchase.status]?.tone" title="Estado de pago">
          <Icon :name="PURCHASE_STATUS_META[purchase.status]?.icon ?? ''" class="mr-1" />
          {{ purchaseStatusLabel(purchase.status) }}
        </span>
        <span class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border" :class="DELIVERY_STATUS_META[purchase.deliveryStatus]?.tone" title="Recepción">
          <Icon :name="DELIVERY_STATUS_META[purchase.deliveryStatus]?.icon ?? ''" class="mr-1" />
          {{ deliveryStatusLabel(purchase.deliveryStatus) }}
        </span>
      </div>
    </div>

    <div v-if="!isCancelled && canManage" class="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
      <button
        v-if="!isReceived"
        @click="confirmAction('receive', null)"
        :disabled="purchaseStore.isActionLoading"
        class="btn-primary bg-success-600 hover:bg-success-700 focus:ring-success-500"
      >
        <Icon name="ph:package-bold" class="mr-2 w-5 h-5" /> Ingresar a Almacén (Recibir)
      </button>

      <button
        @click="confirmAction('cancel', null)"
        :disabled="purchaseStore.isActionLoading"
        class="btn-secondary text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20"
      >
        <Icon name="ph:prohibit-bold" class="mr-2 w-5 h-5" /> Cancelar Compra
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center gap-3 bg-gray-50 dark:bg-gray-900/50">
          <h2 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="ph:list-dashes-bold" /> Partidas ({{ purchase.items?.length || 0 }})
          </h2>
          <button v-if="canEditItems" type="button" @click="openItemModal(null)" class="inline-flex items-center rounded-lg px-3 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/30 cursor-pointer">
            <Icon name="ph:plus-bold" class="mr-1" /> Agregar
          </button>
        </div>

        <p v-if="!purchase.items?.length" class="px-4 py-8 text-center text-sm text-gray-500">Esta orden no tiene partidas.</p>

        <template v-else>
          <!-- Laptop y tableta: tabla -->
          <div class="table-wrap hidden @4xl:block">
            <table class="w-full text-left whitespace-nowrap">
              <thead>
                <tr class="bg-gray-50/50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase">
                  <th class="px-4 py-3">Producto</th>
                  <th class="px-4 py-3">Lote / caducidad</th>
                  <th class="px-4 py-3 text-center">Cant.</th>
                  <th class="px-4 py-3 text-right">Costo Unit.</th>
                  <th class="px-4 py-3 text-right">Subtotal</th>
                  <th v-if="canEditItems" class="px-4 py-3 text-right"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                <tr v-for="item in purchase.items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3">
                    <p class="font-bold text-sm text-gray-900 dark:text-white">{{ item.product?.name }}</p>
                    <p class="text-xs text-gray-500 font-mono">{{ item.product?.sku }}</p>
                  </td>
                  <td class="px-4 py-3 text-xs">
                    <p class="font-mono">{{ item.lotNumber || '—' }}</p>
                    <p class="text-gray-500">{{ item.expiryDate ? formatDate(item.expiryDate) : '' }}</p>
                  </td>
                  <td class="px-4 py-3 text-center font-bold">{{ item.quantity }}</td>
                  <td class="px-4 py-3 text-right text-sm">{{ formatCurrency(Number(item.cost)) }}</td>
                  <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{{ formatCurrency(Number(item.subtotal)) }}</td>
                  <td v-if="canEditItems" class="px-4 py-3 text-right">
                    <button type="button" @click="openItemModal(item)" class="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 cursor-pointer" title="Editar partida" aria-label="Editar partida"><Icon name="ph:pencil-simple-bold" /></button>
                    <button type="button" @click="confirmAction('removeItem', item.id)" class="p-2 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/30 cursor-pointer" title="Quitar partida" aria-label="Quitar partida"><Icon name="ph:trash-bold" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Celular: tarjetas -->
          <ul class="card-list @4xl:hidden" data-testid="purchase-items-cards">
            <li v-for="item in purchase.items" :key="item.id" class="px-4 py-3">
              <div class="card-row">
                <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">{{ item.product?.name }}</p>
                <p class="shrink-0 font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(item.subtotal)) }}</p>
              </div>
              <div class="card-row mt-0.5">
                <p class="min-w-0 truncate text-xs font-mono text-gray-500">{{ item.product?.sku }}</p>
                <p class="shrink-0 text-xs text-gray-500">{{ item.quantity }} × {{ formatCurrency(Number(item.cost)) }}</p>
              </div>
              <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span class="card-label">Lote</span> <span class="font-mono">{{ item.lotNumber || '—' }}</span>
                <template v-if="item.expiryDate"> · <span class="card-label">Cad.</span> {{ formatDate(item.expiryDate) }}</template>
              </p>
              <div v-if="canEditItems" class="mt-2 flex gap-2">
                <button type="button" class="btn-secondary flex-1" @click="openItemModal(item)">
                  <Icon name="ph:pencil-simple-bold" class="mr-2" /> Editar
                </button>
                <button type="button" class="btn-secondary flex-1 text-error-600 dark:text-error-400" @click="confirmAction('removeItem', item.id)">
                  <Icon name="ph:trash-bold" class="mr-2" /> Quitar
                </button>
              </div>
            </li>
          </ul>
        </template>
      </div>

      <div class="space-y-6">

        <div class="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-5 sm:p-6 text-white">
          <h2 class="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Resumen</h2>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between gap-3 text-gray-300">
              <span>Total Compra</span>
              <span class="font-bold text-white tabular-nums">{{ formatCurrency(Number(purchase.total)) }}</span>
            </div>
            <div class="flex justify-between gap-3 text-success-400">
              <span>Abonado</span>
              <span class="tabular-nums">- {{ formatCurrency(Number(purchase.paidAmount)) }}</span>
            </div>
            <div class="pt-3 mt-3 border-t border-gray-700 flex justify-between items-center gap-3">
              <span class="font-bold text-warning-400 uppercase text-xs">Saldo Pendiente</span>
              <span class="text-2xl font-black text-warning-400 tabular-nums">{{ formatCurrency(Number(purchase.balance)) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h2 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="ph:wallet-bold" /> Historial de Pagos
            </h2>
            <button v-if="canManage && !isCancelled && Number(purchase.balance) > 0" type="button" @click="showPaymentModal = true" class="inline-flex items-center text-sm font-bold text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 px-3 py-2 rounded-lg cursor-pointer">
              <Icon name="ph:plus-bold" class="mr-1" /> Abonar
            </button>
          </div>

          <div v-if="!purchase.payments?.length" class="text-sm text-center text-gray-500 italic py-4">
            Sin pagos registrados.
          </div>
          <div v-else class="space-y-3">
            <div v-for="pay in purchase.payments" :key="pay.id" class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="font-bold text-sm text-gray-900 dark:text-white">{{ formatCurrency(Number(pay.amount)) }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{{ paymentMethodLabel(pay.method) }} • {{ formatDate(pay.createdAt) }}</p>
                <p v-if="pay.references" class="text-xs text-gray-500 dark:text-gray-400 truncate">Ref. {{ pay.references }}</p>
              </div>
              <button v-if="canManage && !isCancelled" type="button" @click="confirmAction('removePayment', pay.id)" class="shrink-0 p-2 rounded-lg text-error-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30" title="Revertir Pago" aria-label="Revertir pago">
                <Icon name="ph:arrow-counter-clockwise-bold" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <PaymentModal v-model="showPaymentModal" :purchase-id="purchase.id" :balance="purchase.balance" />
    <PurchaseItemModal v-model="showItemModal" :purchase-id="purchase.id" :item-to-edit="selectedItem" />

    <ConfirmModal
      v-if="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type as any"
      :confirm-text="confirmDialog.confirmText"
      :is-loading="purchaseStore.isActionLoading"
      @confirm="executeConfirmAction"
      @cancel="confirmDialog.show = false"
    />

  </div>

  <!-- Falló la carga: antes el spinner giraba para siempre. -->
  <div v-else-if="purchaseStore.detailError && !purchaseStore.isLoading" class="min-h-[50vh] flex items-center justify-center px-4">
    <span class="flex flex-col gap-2 items-center text-center">
      <Icon name="ph:cloud-slash-fill" class="w-10 h-10 text-error-500" />
      <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ purchaseStore.detailError.mensaje }}</span>
      <div class="mt-1 flex flex-wrap justify-center gap-2">
        <button v-if="purchaseStore.detailError.reintentable" type="button" class="btn-primary" @click="load">
          <Icon name="ph:arrow-clockwise-bold" class="mr-2" /> Reintentar
        </button>
        <NuxtLink to="/purchases" class="btn-secondary">Volver a compras</NuxtLink>
      </div>
    </span>
  </div>

  <div v-else class="min-h-[50vh] flex items-center justify-center">
    <Icon name="ph:spinner-gap-bold" class="w-10 h-10 animate-spin text-primary-600" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from '#app'
import {
  usePurchaseStore,
  PURCHASE_STATUS_META,
  DELIVERY_STATUS_META,
  purchaseStatusLabel,
  deliveryStatusLabel,
  paymentMethodLabel,
  type PurchaseItem,
} from '~/stores/purchase'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import { useToast } from '~/composables/useToast'

import PaymentModal from '~/components/purchases/PaymentModal.vue'
import PurchaseItemModal from '~/components/purchases/PurchaseItemModal.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import { useAuthStore } from '~/stores/auth'

// Ver el detalle basta con poder ver compras (el listado enlaza aquí para todo
// el que tenga `canViewPurchases`); OPERAR exige `canManagePurchases`. Antes la
// página exigía gestionar, y un rol de sólo consulta recibía "Acceso denegado"
// al abrir una compra desde el listado.
definePageMeta({ requiredPermission: 'canViewPurchases' })

const route = useRoute()
const purchaseStore = usePurchaseStore()
const { formatCurrency } = useCurrency()
const { formatDateTime, formatDate } = useDate()
const toast = useToast()
const authStore = useAuthStore()
const canManage = computed(() => authStore.can('canManagePurchases'))

const routeId = computed(() => Number(route.params.id))
// Sólo la orden de ESTA ruta: el store puede conservar la última abierta y,
// si su consulta falla, se veía la orden anterior con el folio equivocado.
const purchase = computed(() =>
  purchaseStore.currentPurchase?.id === routeId.value ? purchaseStore.currentPurchase : null
)

const load = () => purchaseStore.fetchPurchaseById(routeId.value)

onMounted(load)

// Reglas de Negocio Reactivas
const isCancelled = computed(() => purchase.value?.status === 'CANCELLED')
const isReceived = computed(() => purchase.value?.deliveryStatus === 'RECEIVED')
const canEditItems = computed(() => canManage.value && !isCancelled.value && !isReceived.value)

// Estado de Modales
const showPaymentModal = ref(false)
const showItemModal = ref(false)
const selectedItem = ref<PurchaseItem | null>(null)

const openItemModal = (item: PurchaseItem | null) => {
  selectedItem.value = item
  showItemModal.value = true
}

// Lógica del ConfirmModal Reutilizable
const confirmDialog = ref({ show: false, action: '', payload: null as any, title: '', message: '', type: 'danger', confirmText: '' })

const confirmAction = (action: string, payload: any) => {
  confirmDialog.value.action = action
  confirmDialog.value.payload = payload
  confirmDialog.value.show = true

  switch (action) {
    case 'receive':
      confirmDialog.value.title = 'Recibir Mercancía'
      confirmDialog.value.message = '¿Estás seguro? Esto ingresará el stock al inventario, recalculará costos promedio y registrará la deuda oficial con el proveedor. Esta acción no se puede deshacer (solo cancelar).'
      confirmDialog.value.type = 'warning'
      confirmDialog.value.confirmText = 'Sí, Ingresar a Almacén'
      break
    case 'cancel':
      confirmDialog.value.title = 'Cancelar Compra'
      confirmDialog.value.message = 'Si la mercancía ya fue recibida, se revertirá el stock y se anulará la deuda. Los pagos adelantados quedarán a favor o deberán devolverse.'
      confirmDialog.value.type = 'danger'
      confirmDialog.value.confirmText = 'Sí, Cancelar Compra'
      break
    case 'removeItem':
      confirmDialog.value.title = 'Quitar Partida'
      confirmDialog.value.message = '¿Eliminar este producto de la orden de compra?'
      confirmDialog.value.type = 'danger'
      confirmDialog.value.confirmText = 'Eliminar'
      break
    case 'removePayment':
      confirmDialog.value.title = 'Revertir Pago'
      confirmDialog.value.message = 'Si fue en efectivo, asegúrate de tener la caja abierta para que el dinero regrese físicamente.'
      confirmDialog.value.type = 'danger'
      confirmDialog.value.confirmText = 'Revertir Pago'
      break
  }
}

const executeConfirmAction = async () => {
  if (!purchase.value) return
  const id = purchase.value.id
  const payload = confirmDialog.value.payload

  try {
    switch (confirmDialog.value.action) {
      case 'receive':
        await purchaseStore.receivePurchase(id)
        toast.success('¡Mercancía recibida e inventariada con éxito!')
        break
      case 'cancel':
        await purchaseStore.cancelPurchase(id)
        toast.success('Compra cancelada.')
        break
      case 'removeItem':
        await purchaseStore.removeItem(id, payload)
        toast.success('Producto eliminado de la orden.')
        break
      case 'removePayment':
        await purchaseStore.removePayment(id, payload)
        toast.success('Pago revertido. Dinero devuelto/restaurado.')
        break
    }
    confirmDialog.value.show = false
  } catch (error) {
    console.error("Error ejecutando acción de compra")
  }
}
</script>