<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      
      <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:wallet-bold" class="text-primary-600" /> Registrar Pago
        </h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" id="paymentForm" class="p-6 space-y-5">
        <div class="bg-linear-to-br from-primary-50 to-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800/30">
          <p class="text-sm font-medium text-primary-800 dark:text-primary-300">Saldo Pendiente</p>
          <p class="text-2xl font-black text-primary-900 dark:text-primary-100">{{ formatCurrency(Number(balance)) }}</p>
        </div>

        <div>
          <label class="label-base">Método de Pago *</label>
          <select v-model="form.method" required class="input-base cursor-pointer">
            <option value="CASH">Efectivo (Requiere Caja Abierta)</option>
            <option value="TRANSFER">Transferencia Bancaria</option>
            <option value="CARD">Tarjeta de Crédito / Débito</option>
          </select>
          <p v-if="form.method === 'CASH'" class="text-xs text-warning-600 font-bold mt-2 flex items-center gap-1">
            <Icon name="ph:warning-circle-fill" /> El dinero se descontará de tu caja actual.
          </p>
        </div>

        <div>
          <label class="label-base">Monto a Pagar *</label>
          <div class="relative">
            <Icon name="ph:currency-dollar-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              v-model.number="form.amount" 
              type="number" 
              step="0.01" 
              min="0.01" 
              :max="Number(balance)" 
              required 
              class="input-base pl-10 text-lg font-bold" 
            />
          </div>
        </div>

        <div>
          <label class="label-base">Referencia / Folio <span class="text-xs text-gray-400">(Opcional)</span></label>
          <input v-model="form.references" type="text" class="input-base" placeholder="Ej: TR-987654321" />
        </div>
      </form>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
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