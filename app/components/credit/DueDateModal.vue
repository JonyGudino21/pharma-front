<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import { fechaCorta, ymdEnDias } from '~/utils/credit-status'

/**
 * Cambiar la fecha de pago de una venta a crédito ("acordamos que paga el
 * viernes") o dejarla sin fecha. No cambia montos.
 */
const props = defineProps<{
  open: boolean
  folio: string
  clientName: string
  balance: string
  current: string | null
  saving?: boolean
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', dueDate: string | null): void
}>()

const { formatCurrency } = useCurrency()

const fecha = ref('')
const hoy = computed(() => ymdEnDias(0))
watch(() => props.open, (v) => { if (v) fecha.value = props.current ?? '' })

const error = computed(() => (fecha.value && fecha.value < hoy.value ? 'La fecha de pago no puede ser anterior a hoy.' : ''))
const PLAZOS = [7, 15, 30]
</script>

<template>
  <div v-if="open" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="dueDateTitle" @keydown.esc="emit('close')" @click.self="emit('close')">
    <div class="modal-panel sm:max-w-sm">
      <div class="modal-header">
        <div class="min-w-0">
          <h2 id="dueDateTitle" class="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <Icon name="ph:calendar-dots-bold" class="text-primary-600" /> Fecha de pago
          </h2>
          <p class="truncate text-sm text-gray-500 dark:text-gray-400">{{ folio }} · {{ clientName }} · debe {{ formatCurrency(Number(balance)) }}</p>
        </div>
        <button type="button" class="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" aria-label="Cerrar" @click="emit('close')">
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>
      </div>

      <form id="dueDateForm" class="modal-body space-y-4" @submit.prevent="!error && emit('save', fecha || null)">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Hoy: <strong>{{ current ? fechaCorta(current) : 'sin fecha de pago' }}</strong>
        </p>
        <div>
          <label for="dueDateInput" class="label-base">Nueva fecha</label>
          <input id="dueDateInput" v-model="fecha" type="date" :min="hoy" class="input-base" :aria-invalid="!!error" data-testid="due-date-input" />
          <p v-if="error" class="mt-1 text-xs text-error-600 dark:text-error-400" role="alert">{{ error }}</p>
        </div>
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Plazos rápidos">
          <button
            v-for="d in PLAZOS"
            :key="d"
            type="button"
            class="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-700 dark:border-gray-600 dark:text-gray-300"
            @click="fecha = ymdEnDias(d)"
          >En {{ d }} días</button>
          <button
            type="button"
            class="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300"
            data-testid="due-date-clear"
            @click="fecha = ''"
          >Sin fecha</button>
        </div>
      </form>

      <div class="modal-footer">
        <button type="button" class="btn-secondary" @click="emit('close')">Cancelar</button>
        <button type="submit" form="dueDateForm" class="btn-primary" :disabled="saving || !!error" data-testid="due-date-save">
          <Icon v-if="saving" name="ph:spinner-gap-bold" class="mr-2 animate-spin" />
          {{ fecha ? 'Guardar fecha' : 'Dejar sin fecha' }}
        </button>
      </div>
    </div>
  </div>
</template>
