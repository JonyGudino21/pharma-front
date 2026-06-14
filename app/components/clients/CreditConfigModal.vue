<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      
      <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:identification-card-bold" class="text-blue-600" />
          Crédito Autorizado
        </h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" id="creditForm" class="p-6 space-y-5">
        <div class="text-center mb-6">
          <p class="font-bold text-lg text-gray-900 dark:text-white">{{ client?.name }}</p>
          <p class="text-xs text-gray-500">Deuda actual: <span class="font-black" :class="Number(client?.currentDebt) > 0 ? 'text-error-600' : 'text-success-600'">{{ formatCurrency(Number(client?.currentDebt || 0)) }}</span></p>
        </div>

        <div class="flex items-center gap-2 p-4 rounded-xl border" :class="form.hasCredit ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'">
          <input v-model="form.hasCredit" type="checkbox" id="hasCredit" class="w-5 h-5 text-blue-600 rounded border-gray-300" />
          <label for="hasCredit" class="text-sm font-bold text-gray-900 dark:text-white cursor-pointer select-none">
            Autorizar compras a crédito
          </label>
        </div>

        <div v-if="form.hasCredit" class="animate-fade-in">
          <label class="label-base">Límite de Crédito Permitido *</label>
          <div class="relative">
            <Icon name="ph:currency-dollar-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              v-model.number="form.creditLimit" 
              type="number" 
              step="100" 
              min="0" 
              required 
              class="input-base pl-10 text-lg font-bold" 
            />
          </div>
          <p class="text-[10px] text-gray-500 mt-1">Si la deuda actual supera este límite, el POS bloqueará nuevas ventas a crédito.</p>
        </div>
      </form>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
        <button type="button" @click="close" class="btn-secondary">Cancelar</button>
        <button type="submit" form="creditForm" :disabled="store.isActionLoading" class="btn-primary">
          <Icon v-if="store.isActionLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          Guardar Cambios
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

const props = defineProps<{ modelValue: boolean, client: Client | Debtor | null }>()
const emit = defineEmits(['update:modelValue', 'success'])

const store = useClientStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const form = reactive({ hasCredit: false, creditLimit: 0 })

watch(() => props.modelValue, (val) => {
  if (val && props.client) {
    // Si viene del listado normal tiene hasCredit, si viene de Debtors asumimos (aunque Debtors siempre tienen deuda)
    form.hasCredit = (props.client as any).hasCredit ?? true 
    form.creditLimit = Number(props.client.creditLimit) || 0
  }
})

const handleSubmit = async () => {
  if (!props.client) return
  try {
    await store.updateCreditConfig(props.client.id, {
      hasCredit: form.hasCredit,
      creditLimit: form.hasCredit ? form.creditLimit : 0
    })
    toast.success('Configuración de crédito actualizada.')
    emit('success')
    close()
  } catch (error) {
    console.error("Error updating credit config")
  }
}

const close = () => emit('update:modelValue', false)
</script>