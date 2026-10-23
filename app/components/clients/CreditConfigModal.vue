<template>
  <div v-if="modelValue" class="modal-overlay" role="dialog" aria-modal="true" aria-label="Crédito Autorizado" @keydown.esc="close">
    <div class="modal-panel sm:max-w-md">

      <div class="modal-header items-center bg-gray-50 dark:bg-gray-900/50">
        <h2 class="flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
          <Icon name="ph:identification-card-bold" class="text-primary-600" />
          Crédito Autorizado
        </h2>
        <button type="button" class="-mr-2 rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Cerrar" @click="close">
          <Icon name="ph:x-bold" class="h-6 w-6" />
        </button>
      </div>

      <form id="creditForm" class="modal-body space-y-5" @submit.prevent="handleSubmit">
        <div class="mb-6 text-center">
          <p class="break-words text-lg font-bold text-gray-900 dark:text-white">{{ client?.name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Deuda actual: <span class="font-black" :class="Number(client?.currentDebt) > 0 ? 'text-error-600 dark:text-error-400' : 'text-success-600 dark:text-success-400'">{{ formatCurrency(Number(client?.currentDebt || 0)) }}</span></p>
        </div>

        <!-- Desde Deudores la fila no trae `hasCredit`: se consulta el cliente antes de mostrar el estado real. -->
        <div v-if="loadingClient" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Icon name="ph:spinner-gap-bold" class="mx-auto mb-2 h-6 w-6 animate-spin text-primary-500" />
          Consultando configuración actual...
        </div>
        <div v-else-if="loadError" class="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-800/30 dark:bg-error-900/20 dark:text-error-400">
          No se pudo consultar la configuración actual del cliente. Cierra y vuelve a intentarlo.
        </div>

        <template v-else>
          <div class="flex items-center gap-3 rounded-xl border p-4" :class="form.hasCredit ? 'border-primary-200 bg-primary-50 dark:border-primary-800/30 dark:bg-primary-900/20' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'">
            <input id="hasCredit" v-model="form.hasCredit" type="checkbox" class="h-5 w-5 rounded border-gray-300 text-primary-600" />
            <label for="hasCredit" class="cursor-pointer select-none text-sm font-bold text-gray-900 dark:text-white">
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
                inputmode="decimal"
                class="input-base pl-10 text-lg font-bold"
              />
            </div>
            <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Si la deuda actual supera este límite, el POS bloqueará nuevas ventas a crédito.</p>
          </div>

          <!-- Días de crédito: OPCIONALES. Sólo proponen la fecha de pago en caja. -->
          <div v-if="form.hasCredit" class="animate-fade-in">
            <label for="creditDays" class="label-base">Días para pagar <span class="text-xs font-normal text-gray-400">(opcional)</span></label>
            <div class="relative">
              <Icon name="ph:calendar-dots-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="creditDays"
                v-model="form.creditDays"
                type="number"
                min="0"
                max="365"
                step="1"
                inputmode="numeric"
                placeholder="Sin plazo fijo"
                class="input-base pl-10"
                aria-describedby="creditDaysHelp"
                data-testid="credit-days"
              />
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Plazos comunes">
              <button
                v-for="d in [7, 15, 30, 45, 60]"
                :key="d"
                type="button"
                class="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
                :class="Number(form.creditDays) === d
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300 dark:border-gray-600 dark:text-gray-300'"
                @click="form.creditDays = d"
              >{{ d }} días</button>
            </div>
            <p id="creditDaysHelp" class="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              Al vender a crédito, la caja propone pagar en estos días. Se puede cambiar en cada venta o dejarla sin fecha. Vacío: se usa lo de Configuración › Crédito.
            </p>
          </div>
        </template>
      </form>

      <div class="modal-footer bg-gray-50 dark:bg-gray-800/80">
        <button type="button" class="btn-secondary" @click="close">Cancelar</button>
        <button type="submit" form="creditForm" :disabled="store.isActionLoading || loadingClient || loadError" class="btn-primary">
          <Icon v-if="store.isActionLoading" name="ph:spinner-gap-bold" class="mr-2 animate-spin" />
          Guardar Cambios
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useClientStore, type Client, type Debtor } from '~/stores/client'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ modelValue: boolean, client: Client | Debtor | null }>()
const emit = defineEmits(['update:modelValue', 'success'])

const store = useClientStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const form = reactive({ hasCredit: false, creditLimit: 0, creditDays: '' as number | '' })
const loadingClient = ref(false)
const loadError = ref(false)

watch(() => props.modelValue, async (val) => {
  if (!val || !props.client) return
  loadError.value = false
  form.creditLimit = Number(props.client.creditLimit) || 0
  form.creditDays = ''

  if ('hasCredit' in props.client && 'creditDays' in props.client) {
    form.hasCredit = props.client.hasCredit
    form.creditDays = props.client.creditDays ?? ''
    return
  }

  // Fila de Deudores: el backend no incluye `hasCredit`. Antes se asumía `true`
  // y guardar sin mirar volvía a autorizar crédito a quien se le había quitado.
  const id = props.client.id
  form.hasCredit = false
  loadingClient.value = true
  const full = await store.fetchClientById(id)
  // El modal pudo cerrarse o cambiar de cliente mientras se consultaba.
  if (!props.modelValue || props.client?.id !== id) return
  loadingClient.value = false
  if (!full) {
    loadError.value = true
    return
  }
  form.hasCredit = Boolean(full.hasCredit)
  form.creditLimit = Number(full.creditLimit) || 0
  form.creditDays = full.creditDays ?? ''
})

const handleSubmit = async () => {
  if (!props.client || loadingClient.value || loadError.value) return
  try {
    await store.updateCreditConfig(props.client.id, {
      hasCredit: form.hasCredit,
      creditLimit: form.hasCredit ? form.creditLimit : 0,
      // Vacío = sin días propios (rige Configuración › Crédito).
      creditDays: form.hasCredit && form.creditDays !== '' ? Number(form.creditDays) : null,
    })
    toast.success('Configuración de crédito actualizada.')
    emit('success')
    close()
  } catch (error) {
    console.error("Error updating credit config")
  }
}

const close = () => {
  loadingClient.value = false
  emit('update:modelValue', false)
}
</script>
