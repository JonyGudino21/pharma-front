<script setup lang="ts">
import { reactive, computed, onMounted, nextTick, ref } from 'vue'
import { useSalesStore, type ControlledPrescription } from '~/stores/sales'

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
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4" @keydown.esc="emit('close')">
    <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"></div>

    <div class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="px-6 py-5 bg-error-600 text-white">
        <p class="text-xs uppercase tracking-wider text-error-100 font-semibold">COFEPRIS · Receta obligatoria</p>
        <p class="text-xl font-bold mt-1">Medicamento controlado</p>
        <p class="text-sm text-error-100 mt-1">
          Captura los datos de la receta antes de cobrar. Quedan en el libro de controlados.
        </p>
      </div>

      <form class="p-6 space-y-4" @submit.prevent="confirm">
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

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 py-3 rounded-xl bg-error-600 text-white font-semibold hover:bg-error-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="!canConfirm"
          >
            Continuar a cobro
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
