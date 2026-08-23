<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSalesStore, type PaymentMethod, type Sale } from '~/stores/sales'
import type { Client } from '~/stores/client'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  client: Client | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'completed', sale: Sale): void
}>()

const sales = useSalesStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const method = ref<PaymentMethod>('CASH')
const received = ref<number | null>(null)
const onCredit = ref(false)
const isProcessing = ref(false)
const cashInput = ref<HTMLInputElement | null>(null)

const totalDue = computed(() => sales.balance)
const clientCanCredit = computed(() => !!props.client?.hasCredit)
const creditAvailable = computed(() => {
  if (!props.client) return 0
  return Number(props.client.creditLimit) - Number(props.client.currentDebt)
})

const change = computed(() => {
  if (onCredit.value || method.value !== 'CASH' || received.value == null) return 0
  return Math.max(0, received.value - totalDue.value)
})

const canConfirm = computed(() => {
  if (isProcessing.value) return false
  if (onCredit.value) return totalDue.value <= creditAvailable.value
  if (method.value === 'CASH') return (received.value ?? 0) >= totalDue.value
  return true // tarjeta/transferencia: se asume monto exacto
})

const methods: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'CASH', label: 'Efectivo', icon: 'ph:money-bold' },
  { key: 'CARD', label: 'Tarjeta', icon: 'ph:credit-card-bold' },
  { key: 'TRANSFER', label: 'Transferencia', icon: 'ph:bank-bold' },
]

const quickAmounts = computed(() => {
  const due = totalDue.value
  const set = new Set<number>([Math.ceil(due)])
  for (const bill of [50, 100, 200, 500, 1000]) {
    if (bill >= due) set.add(bill)
  }
  return Array.from(set).sort((a, b) => a - b).slice(0, 4)
})

function selectMethod(m: PaymentMethod) {
  method.value = m
  onCredit.value = false
  if (m === 'CASH') nextTick(() => cashInput.value?.focus())
}

async function confirm() {
  if (!canConfirm.value) return
  isProcessing.value = true
  try {
    if (onCredit.value) {
      // Venta a crédito: opcionalmente registramos un abono inicial
      if (received.value && received.value > 0) {
        const abono = Math.min(received.value, totalDue.value)
        const ok = await sales.registerPayment({ method: 'CASH', amount: abono })
        if (!ok) return
      }
    } else {
      // Contado: registramos el pago por el saldo exacto (evitamos sobrepago)
      const ok = await sales.registerPayment({ method: method.value, amount: totalDue.value })
      if (!ok) return
    }

    const completed = await sales.completeSale()
    if (completed) emit('completed', completed)
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => nextTick(() => cashInput.value?.focus()))
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4" @keydown.esc="emit('close')">
    <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <!-- Header con total -->
      <div class="px-6 py-5 bg-primary-600 text-white">
        <p class="text-sm text-primary-100">Total a cobrar</p>
        <p class="text-4xl font-bold tabular-nums">{{ formatCurrency(totalDue) }}</p>
        <p v-if="client" class="text-sm text-primary-100 mt-1">Cliente: {{ client.name }}</p>
      </div>

      <div class="p-6 space-y-5">
        <!-- Métodos -->
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in methods"
            :key="m.key"
            class="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-colors"
            :class="!onCredit && method === m.key
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'"
            @click="selectMethod(m.key)"
          >
            <Icon :name="m.icon" class="w-6 h-6" />
            <span class="text-xs font-medium">{{ m.label }}</span>
          </button>
        </div>

        <!-- Crédito -->
        <button
          v-if="clientCanCredit"
          class="w-full flex items-center justify-between py-3 px-4 rounded-xl border-2 transition-colors"
          :class="onCredit
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'"
          @click="onCredit = !onCredit"
        >
          <span class="flex items-center gap-2 text-sm font-medium">
            <Icon name="ph:credit-card-bold" class="w-5 h-5" /> Cargar a crédito
          </span>
          <span class="text-xs">Disponible: {{ formatCurrency(creditAvailable) }}</span>
        </button>

        <!-- Efectivo recibido -->
        <div v-if="method === 'CASH' && !onCredit">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Efectivo recibido</label>
          <input
            ref="cashInput"
            v-model.number="received"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            class="w-full px-4 py-3 text-lg font-semibold rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div class="flex gap-2 mt-2">
            <button
              v-for="amt in quickAmounts"
              :key="amt"
              class="flex-1 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              @click="received = amt"
            >
              {{ formatCurrency(amt) }}
            </button>
          </div>
          <div class="flex justify-between items-center mt-3 px-1">
            <span class="text-sm text-gray-500 dark:text-gray-400">Cambio</span>
            <span class="text-xl font-bold text-success-600 dark:text-success-400 tabular-nums">{{ formatCurrency(change) }}</span>
          </div>
        </div>

        <!-- Abono opcional en crédito -->
        <div v-if="onCredit">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Abono inicial (opcional)</label>
          <input
            v-model.number="received"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <!-- Acciones -->
        <div class="flex gap-3 pt-1">
          <button
            class="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            class="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            :disabled="!canConfirm"
            @click="confirm"
          >
            <Icon v-if="isProcessing" name="ph:spinner-gap-bold" class="w-5 h-5 animate-spin" />
            <Icon v-else name="ph:check-circle-bold" class="w-5 h-5" />
            {{ isProcessing ? 'Procesando...' : 'Cobrar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
