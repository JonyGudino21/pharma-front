<template>
  <div class="space-y-6 pb-20" v-if="purchase">
    
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <NuxtLink to="/purchases" class="text-sm text-gray-500 hover:text-primary-600 flex items-center mb-2 transition-colors">
          <Icon name="ph:arrow-left-bold" class="mr-1" /> Volver a compras
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Orden #{{ purchase.invoiceNumber }}
        </h1>
        <p class="text-sm text-gray-500 flex items-center mt-1">
          <Icon name="ph:buildings-bold" class="mr-1" /> {{ purchase.supplier?.name }} 
          <span class="mx-2">•</span> 
          <Icon name="ph:calendar-blank-bold" class="mr-1" /> {{ formatDateTime(purchase.createdAt) }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="px-3 py-1.5 rounded-lg text-sm font-bold border" :class="[
          purchase.status === 'PAID' ? 'bg-success-50 text-success-700 border-success-200' :
          purchase.status === 'PARTIAL' ? 'bg-warning-50 text-warning-700 border-warning-200' :
          purchase.status === 'CANCELLED' ? 'bg-error-50 text-error-700 border-error-200' :
          'bg-gray-50 text-blue-700 border-blue-200'
        ]">
          {{ purchase.status }}
        </span>
        <span class="px-3 py-1.5 rounded-lg text-sm font-bold border" :class="[
          purchase.deliveryStatus === 'RECEIVED' ? 'bg-success-50 text-success-700 border-success-200' :
          purchase.deliveryStatus === 'CANCELLED' ? 'bg-error-50 text-error-700 border-error-200' :
          'bg-warning-50 text-warning-700 border-warning-200'
        ]">
          {{ purchase.deliveryStatus === 'RECEIVED' ? 'REGISTRADO' : purchase.deliveryStatus === 'PENDING' ? 'EN TRÁNSITO' : 'ANULADO' }}
        </span>
      </div>
    </div>

    <div v-if="!isCancelled" class="flex flex-wrap gap-3">
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
        class="btn-secondary text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 border-error-200 dark:border-error-800/30"
      >
        <Icon name="ph:prohibit-bold" class="mr-2 w-5 h-5" /> Cancelar Compra
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h2 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="ph:list-dashes-bold" /> Partidas ({{ purchase.items?.length || 0 }})
          </h2>
          <button v-if="canEditItems" @click="openItemModal(null)" class="text-sm font-bold text-primary-600 hover:text-primary-700 cursor-pointer">
            + Agregar
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left whitespace-nowrap">
            <thead>
              <tr class="bg-gray-50/50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase">
                <th class="px-4 py-3">Producto</th>
                <th class="px-4 py-3 text-center">Cant.</th>
                <th class="px-4 py-3 text-right">Costo Unit.</th>
                <th class="px-4 py-3 text-right">Subtotal</th>
                <th v-if="canEditItems" class="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="item in purchase.items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-4 py-3">
                  <p class="font-bold text-sm text-gray-900 dark:text-white">{{ item.product?.name }}</p>
                  <p class="text-xs text-gray-500 font-mono">{{ item.product?.sku }}</p>
                </td>
                <td class="px-4 py-3 text-center font-bold">{{ item.quantity }}</td>
                <td class="px-4 py-3 text-right text-sm">{{ formatCurrency(Number(item.cost)) }}</td>
                <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{{ formatCurrency(Number(item.subtotal)) }}</td>
                <td v-if="canEditItems" class="px-4 py-3 text-right">
                  <button @click="openItemModal(item)" class="text-blue-500 hover:text-blue-700 mr-3 cursor-pointer"><Icon name="ph:pencil-simple-bold" /></button>
                  <button @click="confirmAction('removeItem', item.id)" class="text-error-500 hover:text-error-700 cursor-pointer"><Icon name="ph:trash-bold" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-6">
        
        <div class="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white">
          <h2 class="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Resumen</h2>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between text-gray-300">
              <span>Total Compra</span>
              <span class="font-bold text-white">{{ formatCurrency(Number(purchase.total)) }}</span>
            </div>
            <div class="flex justify-between text-success-400">
              <span>Abonado</span>
              <span>- {{ formatCurrency(Number(purchase.paidAmount)) }}</span>
            </div>
            <div class="pt-3 mt-3 border-t border-gray-700 flex justify-between items-center">
              <span class="font-bold text-warning-400 uppercase text-xs">Saldo Pendiente</span>
              <span class="text-2xl font-black text-warning-400">{{ formatCurrency(Number(purchase.balance)) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="ph:wallet-bold" /> Historial de Pagos
            </h2>
            <button v-if="!isCancelled && Number(purchase.balance) > 0" @click="showPaymentModal = true" class="text-xs font-bold text-primary-600 hover:bg-primary-50 px-2 py-1 rounded cursor-pointer">
              + Abonar
            </button>
          </div>

          <div v-if="purchase.payments?.length === 0" class="text-sm text-center text-gray-500 italic py-4">
            Sin pagos registrados.
          </div>
          <div v-else class="space-y-3">
            <div v-for="pay in purchase.payments" :key="pay.id" class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <p class="font-bold text-sm text-gray-900 dark:text-white">{{ formatCurrency(Number(pay.amount)) }}</p>
                <p class="text-[10px] uppercase text-gray-500 font-bold mt-0.5">{{ pay.method }} • {{ formatDate(pay.createdAt) }}</p>
              </div>
              <button v-if="!isCancelled" @click="confirmAction('removePayment', pay.id)" class="text-error-400 hover:text-error-600" title="Revertir Pago">
                <Icon name="ph:trash-bold" class="w-4 h-4" />
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
  
  <div v-else class="min-h-screen flex items-center justify-center">
    <Icon name="ph:spinner-gap-bold" class="w-10 h-10 animate-spin text-primary-600" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from '#app'
import { usePurchaseStore, type PurchaseItem } from '~/stores/purchase'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import { useToast } from '~/composables/useToast'

import PaymentModal from '~/components/purchases/PaymentModal.vue'
import PurchaseItemModal from '~/components/purchases/PurchaseItemModal.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'

definePageMeta({ requiredPermission: 'canManagePurchases' })

const route = useRoute()
const purchaseStore = usePurchaseStore()
const { formatCurrency } = useCurrency()
const { formatDateTime, formatDate } = useDate()
const toast = useToast()

const purchase = computed(() => purchaseStore.currentPurchase)

onMounted(async () => {
  const id = Number(route.params.id)
  await purchaseStore.fetchPurchaseById(id)
})

// Reglas de Negocio Reactivas
const isCancelled = computed(() => purchase.value?.status === 'CANCELLED')
const isReceived = computed(() => purchase.value?.deliveryStatus === 'RECEIVED')
const canEditItems = computed(() => !isCancelled.value && !isReceived.value)

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