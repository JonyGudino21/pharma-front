<template>
  <div v-if="modelValue" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="purchasePaymentTitle">
    <div class="modal-panel sm:max-w-md">

      <div class="modal-header bg-gray-50 dark:bg-gray-900/50">
        <h2 id="purchasePaymentTitle" class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:wallet-bold" class="text-primary-600" /> Registrar Pago
        </h2>
        <button type="button" aria-label="Cerrar" @click="close" class="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" id="paymentForm" class="modal-body space-y-5">
        <div class="bg-linear-to-br from-primary-50 to-primary-100/60 dark:from-primary-900/30 dark:to-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-800/30">
          <p class="text-sm font-medium text-primary-800 dark:text-primary-300">Saldo Pendiente</p>
          <p class="text-2xl font-black text-primary-900 dark:text-primary-100">{{ formatCurrency(Number(balance)) }}</p>
        </div>

        <div>
          <label for="purchasePayMethod" class="label-base">Método de Pago *</label>
          <select id="purchasePayMethod" v-model="form.method" required class="input-base cursor-pointer">
            <option value="CASH">Efectivo (Requiere Caja Abierta)</option>
            <option value="TRANSFER">Transferencia Bancaria</option>
            <option value="CARD">Tarjeta de Crédito / Débito</option>
          </select>
          <p v-if="form.method === 'CASH'" class="text-xs text-warning-600 dark:text-warning-400 font-bold mt-2 flex items-center gap-1">
            <Icon name="ph:warning-circle-fill" class="shrink-0" /> El dinero se descontará de tu caja actual.
          </p>
        </div>

        <div>
          <label for="purchasePayAmount" class="label-base">Monto a Pagar *</label>
          <div class="relative">
            <Icon name="ph:currency-dollar-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="purchasePayAmount"
              v-model.number="form.amount"
              type="number"
              inputmode="decimal"
              step="0.01"
              min="0.01"
              :max="Number(balance)"
              required
              class="input-base pl-10 text-lg font-bold"
            />
          </div>
        </div>

        <div>
          <label for="purchasePayRef" class="label-base">Referencia / Folio <span class="text-xs text-gray-400">(Opcional)</span></label>
          <input id="purchasePayRef" v-model="form.references" type="text" maxlength="120" class="input-base" placeholder="Ej: TR-987654321" />
        </div>
      </form>

      <div class="modal-footer bg-gray-50 dark:bg-gray-800/80">
        <button type="button" @click="close" class="btn-secondary">Cancelar</button>
        <button type="submit" form="paymentForm" :disabled="isLoading" class="btn-primary">
          <Icon v-if="isLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          Registrar Abono
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { usePurchaseStore, type PaymentMethod } from '~/stores/purchase'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ modelValue: boolean, purchaseId: number, balance: number | string }>()
const emit = defineEmits(['update:modelValue'])

const store = usePurchaseStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const isLoading = ref(false)
const form = reactive({ method: 'TRANSFER' as PaymentMethod, amount: 0, references: '' })

watch(() => props.modelValue, (val) => {
  if (val) {
    form.method = 'TRANSFER'
    form.amount = Number(props.balance) // Sugerimos liquidar por defecto
    form.references = ''
  }
})

const handleSubmit = async () => {
  if (form.amount <= 0 || form.amount > Number(props.balance)) {
    toast.warning('El monto es inválido o supera la deuda.')
    return
  }
  
  isLoading.value = true
  try {
    await store.addPayment(props.purchaseId, {
      method: form.method,
      amount: form.amount,
      references: form.references.trim() || undefined
    })
    toast.success('Pago registrado correctamente.')
    close()
  } catch (error) {
    console.error("Error validando el pago")
  } finally {
    isLoading.value = false
  }
}

const close = () => emit('update:modelValue', false)
</script>