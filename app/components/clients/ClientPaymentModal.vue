<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      
      <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:money-bold" class="text-success-600" />
          Registrar Abono
        </h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" id="paymentForm" class="p-6 space-y-5">
        <div class="bg-error-50 dark:bg-error-900/20 p-4 rounded-xl border border-error-100 dark:border-error-800/30">
          <p class="text-sm font-medium text-error-800 dark:text-error-300">Deuda Total Actual</p>
          <p class="text-2xl font-black text-error-900 dark:text-error-100">{{ formatCurrency(Number(client?.currentDebt || 0)) }}</p>
        </div>

        <div>
          <label class="label-base">Método de Pago *</label>
          <select v-model="form.method" required class="input-base cursor-pointer">
            <option value="CASH">Efectivo (Requiere Caja Abierta)</option>
            <option value="TRANSFER">Transferencia Bancaria</option>
            <option value="CARD">Tarjeta de Crédito / Débito</option>
          </select>
          <p v-if="form.method === 'CASH'" class="text-xs text-warning-600 font-bold mt-2 flex items-center gap-1">
            <Icon name="ph:warning-circle-fill" /> El efectivo ingresará directamente a tu caja activa.
          </p>
        </div>

        <div>
          <label class="label-base">Monto a Abonar *</label>
          <div class="relative">
            <Icon name="ph:currency-dollar-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              v-model.number="form.amount" 
              type="number" 
              step="0.01" 
              min="0.01" 
              required 
              class="input-base pl-10 text-lg font-bold" 
              placeholder="0.00"
            />
          </div>
          <p class="text-[10px] text-gray-500 mt-1">Si el monto supera la deuda, el excedente no se registrará como saldo a favor.</p>
        </div>

        <div>
          <label class="label-base">Referencia / Folio <span class="text-xs text-gray-400">(Opcional)</span></label>
          <input v-model="form.reference" type="text" class="input-base" placeholder="Ej: TR-987654321" />
        </div>
      </form>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
        <button type="button" @click="close" class="btn-secondary">Cancelar</button>
        <button type="submit" form="paymentForm" :disabled="store.isActionLoading" class="btn-primary bg-success-600 hover:bg-success-700 focus:ring-success-500">
          <Icon v-if="store.isActionLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          Registrar Pago
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useClientStore, type Client, type Debtor } from '~/stores/client'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
// import Swal from 'sweetalert2' // Opcional, pero genial para mensajes con mucho detalle

const props = defineProps<{ modelValue: boolean, client: Client | Debtor | null }>()
const emit = defineEmits(['update:modelValue', 'success'])

const store = useClientStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const form = reactive({ method: 'CASH' as 'CASH'|'TRANSFER'|'CARD', amount: '', reference: '' })

watch(() => props.modelValue, (val) => {
  if (val && props.client) {
    form.method = 'CASH'
    form.amount = ''
    form.reference = ''
  }
})

const handleSubmit = async () => {
  if (!props.client || Number(form.amount) <= 0) return
  
  try {
    const response = await store.registerPayment(props.client.id, {
      method: form.method,
      amount: Number(form.amount),
      reference: form.reference.trim() || undefined
    })

    // Tu backend devuelve un mensaje muy descriptivo en res.message si hubo excedente.
    toast.success(response?.message || 'Abono aplicado correctamente.')
    emit('success')
    close()
  } catch (error: any) {
    // Interceptor atrapa "Requiere caja abierta" (409) o "Sin deuda" (400)
    console.error("Error al registrar abono")
  }
}

const close = () => emit('update:modelValue', false)
</script>