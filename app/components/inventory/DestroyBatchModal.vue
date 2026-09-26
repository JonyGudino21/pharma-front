<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center">
            <Icon name="ph:trash-bold" class="w-5 h-5 text-error-600 dark:text-error-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Merma de lote</h2>
            <p class="text-xs text-gray-500">Sale del Kardex como LOSS y, si es controlado, del libro</p>
          </div>
        </div>
        <button class="text-gray-400 hover:text-gray-600" @click="close">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <form id="destroyForm" class="p-6 space-y-4" @submit.prevent="handleSubmit">
        <div v-if="batch" class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <p class="font-bold text-gray-900 dark:text-white">{{ batch.product.name }}</p>
          <p class="text-xs font-mono text-gray-500 mt-1">Lote {{ batch.lotNumber }} · {{ batch.quantity }} uds.</p>
        </div>
        <div>
          <label class="label-base">Cantidad a destruir *</label>
          <input v-model.number="form.quantity" type="number" min="1" :max="batch?.quantity ?? 1" required class="input-base" />
        </div>
        <div>
          <label class="label-base">Motivo (auditoría) *</label>
          <textarea v-model="form.reason" rows="2" required maxlength="240" class="input-base resize-none" placeholder="Caducado, roto, destrucción COFEPRIS..." />
        </div>
      </form>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
        <button type="button" class="btn-secondary" @click="close">Cancelar</button>
        <button form="destroyForm" type="submit" class="btn-primary bg-error-600 hover:bg-error-700" :disabled="isLoading || !form.reason.trim()">
          <Icon v-if="isLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          Registrar merma
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useInventoryStore, type ExpiringBatch } from '~/stores/inventory'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ modelValue: boolean; batch: ExpiringBatch | null }>()
const emit = defineEmits(['update:modelValue', 'success'])

const inventoryStore = useInventoryStore()
const toast = useToast()
const isLoading = ref(false)
const form = reactive({ quantity: 1, reason: '' })

watch(() => props.modelValue, (open) => {
  if (open && props.batch) {
    form.quantity = props.batch.quantity
    form.reason = ''
  }
})

async function handleSubmit() {
  if (!props.batch || !form.reason.trim()) return
  isLoading.value = true
  try {
    await inventoryStore.destroyBatch({
      batchId: props.batch.id,
      quantity: form.quantity,
      reason: form.reason.trim(),
    })
    toast.success('Merma de lote registrada en el Kardex.')
    emit('success')
    close()
  } catch {
    // el interceptor ya mostró el error
  } finally {
    isLoading.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>
