<script setup lang="ts">
import { reactive, computed, onMounted, nextTick, ref } from 'vue'
import { useSalesStore, type ControlledPrescription } from '~/stores/sales'

const props = defineProps<{
  /** Revisión de una receta ya capturada (desde el resumen), no camino al cobro. */
  editing?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirmed'): void
}>()

const sales = useSalesStore()
const firstInput = ref<HTMLInputElement | null>(null)

const form = reactive<ControlledPrescription>({
  prescriptionNo: sales.prescription?.prescriptionNo ?? '',
  doctorName: sales.prescription?.doctorName ?? '',
  doctorLicense: sales.prescription?.doctorLicense ?? '',
  patientName: sales.prescription?.patientName ?? '',
})

const canConfirm = computed(() =>
  form.prescriptionNo.trim().length > 0
  && form.doctorName.trim().length > 0
  && form.doctorLicense.trim().length > 0
  && form.patientName.trim().length > 0,
)

function confirm() {
  if (!canConfirm.value) return
  sales.setPrescription({
    prescriptionNo: form.prescriptionNo.trim(),
    doctorName: form.doctorName.trim(),
    doctorLicense: form.doctorLicense.trim(),
    patientName: form.patientName.trim(),
  })
  emit('confirmed')
}

onMounted(() => nextTick(() => firstInput.value?.focus()))
</script>

<template>
  <!-- Sin cierre al tocar fuera: se perderían los datos a medio capturar. -->
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="rxTitle" @keydown.esc="emit('close')">
    <form class="modal-panel sm:max-w-md sm:border sm:border-gray-100 sm:shadow-2xl dark:sm:border-gray-700" @submit.prevent="confirm">
      <div class="shrink-0 px-4 py-4 sm:px-6 sm:py-5 bg-error-600 text-white">
        <p class="text-xs uppercase tracking-wider text-error-100 font-semibold">COFEPRIS · Receta obligatoria</p>
        <p id="rxTitle" class="text-xl font-bold mt-1">Medicamento controlado</p>
        <p class="text-sm text-error-100 mt-1">
          {{ props.editing
            ? 'Revisa o corrige los datos de la receta. Quedan en el libro de controlados.'
            : 'Captura los datos de la receta antes de cobrar. Quedan en el libro de controlados.' }}
        </p>
      </div>

      <div class="modal-body space-y-4">
        <div>
          <label class="label-base">Folio de receta *</label>
          <input
            ref="firstInput"
            v-model="form.prescriptionNo"
            type="text"
            maxlength="40"
            required
            class="input-base"
            placeholder="Ej. RX-45821"
          />
        </div>
        <div>
          <label class="label-base">Médico *</label>
          <input v-model="form.doctorName" type="text" maxlength="120" required class="input-base" placeholder="Nombre completo" />
        </div>
        <div>
          <label class="label-base">Cédula profesional *</label>
          <input v-model="form.doctorLicense" type="text" maxlength="40" required class="input-base" placeholder="Cédula" />
        </div>
        <div>
          <label class="label-base">Paciente *</label>
          <input v-model="form.patientName" type="text" maxlength="120" required class="input-base" placeholder="Nombre del paciente" />
        </div>

      </div>

      <div class="modal-footer sm:gap-3">
          <button
            type="button"
            class="sm:flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="sm:flex-1 py-3 rounded-xl bg-error-600 text-white font-semibold hover:bg-error-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="!canConfirm"
          >
            {{ props.editing ? 'Guardar receta' : 'Continuar a cobro' }}
          </button>
      </div>
    </form>
  </div>
</template>
