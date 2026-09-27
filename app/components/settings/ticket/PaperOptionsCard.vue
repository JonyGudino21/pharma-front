<script setup lang="ts">
import type { TemplateForm } from '~/composables/useTicketStudio'
import type { ReceiptCharset } from '~/types/receipt'
import SettingsCard from '~/components/settings/SettingsCard.vue'
import SegmentedControl from '~/components/settings/ticket/SegmentedControl.vue'

const form = defineModel<TemplateForm>({ required: true })
defineProps<{ nameError?: string; dirty: boolean }>()

// Tipados aquí y no en la plantilla: un literal `58` dentro del template se
// infiere como `number` y no encaja con el tipo `58 | 80` del modelo.
const WIDTHS: { value: 58 | 80; title: string; hint: string }[] = [
  { value: 58, title: '58 mm', hint: '32 caracteres por renglón' },
  { value: 80, title: '80 mm', hint: '48 caracteres por renglón' },
]

const SIZES: { value: 1 | 2; title: string; hint: string }[] = [
  { value: 1, title: 'Normal', hint: 'Más contenido por ticket' },
  { value: 2, title: 'Grande', hint: 'Doble tamaño, más legible' },
]

const CHARSETS: { value: ReceiptCharset; title: string; hint: string }[] = [
  { value: 'ascii', title: 'Sin acentos', hint: 'Funciona en cualquier impresora' },
  { value: 'cp850', title: 'Con acentos y ñ', hint: 'Confírmalo con una impresión de prueba' },
]
</script>

<template>
  <SettingsCard
    title="Papel e impresión"
    description="Debe coincidir con el rollo y la impresora que tienes en la caja."
    icon="ph:printer-bold"
    :dirty="dirty"
  >
    <div class="space-y-5">
      <div>
        <label for="tk-tpl-name" class="label-base">Nombre de la plantilla</label>
        <input
          id="tk-tpl-name"
          v-model="form.name"
          maxlength="80"
          class="input-base"
          :aria-invalid="!!nameError"
          aria-describedby="tk-tpl-name-err"
        />
        <p v-if="nameError" id="tk-tpl-name-err" class="mt-1 text-xs text-error-600">{{ nameError }}</p>
      </div>

      <SegmentedControl v-model="form.paperWidthMm" label="Ancho del rollo" :options="WIDTHS" />
      <SegmentedControl v-model="form.fontScale" label="Tamaño del total y del nombre" :options="SIZES" />
      <SegmentedControl v-model="form.charset" label="Acentos y ñ en la impresora térmica" :options="CHARSETS" />
    </div>
  </SettingsCard>
</template>
