<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Company, ReceiptSaleView, ReceiptTemplate } from '~/types/receipt'
import { buildThermalReceipt, type ThermalWarningKind } from '~/utils/encode-receipt'
import ThermalPreview from '~/components/receipt/ThermalPreview.vue'
import ReceiptPreview from '~/components/receipt/ReceiptPreview.vue'

/**
 * La "impresora" de la pantalla: la vista previa sobre el cuerpo oscuro del
 * equipo, con el papel saliendo de la ranura.
 *
 * Tiene DOS modos porque el ticket sale distinto según por dónde se imprima, y
 * la pantalla anterior sólo mostraba uno (el del navegador) prometiendo que era
 * lo que imprimía la térmica:
 *   - Térmica: rejilla de caracteres generada por el MISMO código que manda
 *     los bytes a la impresora. Sin logo, sin marca de agua, acentos según la
 *     opción elegida.
 *   - Navegador: el ticket en HTML, con logo, para cuando no hay térmica.
 */
const props = defineProps<{
  sale: ReceiptSaleView
  company: Company
  template: ReceiptTemplate
  printing: boolean
}>()

const emit = defineEmits<{ printTest: [previewEl: HTMLElement | null] }>()

type Modo = 'thermal' | 'browser'
const modo = ref<Modo>('thermal')
const browserEl = ref<InstanceType<typeof ReceiptPreview> | null>(null)

const receipt = computed(() => buildThermalReceipt(props.sale, props.company, props.template))

const WARNING_ICON: Record<ThermalWarningKind, string> = {
  accents: 'ph:text-aa',
  truncated: 'ph:scissors',
  logo: 'ph:image-broken',
  watermark: 'ph:seal',
}

const warnings = computed(() => (modo.value === 'thermal' ? receipt.value.warnings : []))
const tone = (k: ThermalWarningKind) => (k === 'truncated' ? 'text-warning-400' : 'text-gray-400')

function printTest() {
  const el = (browserEl.value?.$el as HTMLElement | undefined) ?? null
  emit('printTest', el)
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl bg-gray-900 text-gray-100 shadow-xl ring-1 ring-black/5 dark:bg-gray-950 dark:ring-white/5">
    <!-- Barra superior del equipo -->
    <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
      <div class="flex items-center gap-2">
        <span class="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span class="absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-60 motion-safe:animate-ping" />
          <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
        </span>
        <p class="text-sm font-medium">Vista previa</p>
        <span class="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-gray-300">
          {{ template.paperWidthMm }} mm · {{ receipt.columns }} col
        </span>
      </div>

      <div role="tablist" aria-label="Cómo se imprime" class="flex rounded-lg bg-white/5 p-0.5 text-xs">
        <button
          type="button"
          role="tab"
          :aria-selected="modo === 'thermal'"
          class="rounded-md px-2.5 py-1 font-medium transition-colors"
          :class="modo === 'thermal' ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'"
          @click="modo = 'thermal'"
        >
          Térmica
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="modo === 'browser'"
          class="rounded-md px-2.5 py-1 font-medium transition-colors"
          :class="modo === 'browser' ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'"
          @click="modo = 'browser'"
        >
          Navegador
        </button>
      </div>
    </div>

    <!-- Ranura y papel -->
    <div class="relative px-4 pb-8 pt-5">
      <div class="mx-auto h-2 max-w-[92%] rounded-full bg-black/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" aria-hidden="true" />
      <div class="-mt-1 flex max-h-[62vh] justify-center overflow-auto px-1 pt-1">
        <!-- :key reinicia la animación de salida del papel al cambiar el ancho -->
        <ThermalPreview v-if="modo === 'thermal'" :key="`t-${receipt.columns}`" :receipt="receipt" />
        <div v-else class="pt-3">
          <ReceiptPreview ref="browserEl" :sale="sale" :company="company" :template="template" />
        </div>
      </div>
      <!-- El preview de navegador se mantiene montado (oculto) para poder
           imprimir la prueba por navegador aunque se esté viendo la térmica. -->
      <div v-if="modo === 'thermal'" class="pointer-events-none absolute -left-[9999px] top-0" aria-hidden="true">
        <ReceiptPreview ref="browserEl" :sale="sale" :company="company" :template="template" />
      </div>
    </div>

    <!-- Qué cambia al imprimir -->
    <div class="border-t border-white/10 px-4 py-3">
      <ul v-if="warnings.length" class="space-y-1.5" aria-label="Diferencias al imprimir en térmica">
        <li v-for="w in warnings" :key="w.kind" class="flex items-start gap-2 text-xs leading-relaxed">
          <Icon :name="WARNING_ICON[w.kind]" class="mt-0.5 h-3.5 w-3.5 shrink-0" :class="tone(w.kind)" />
          <span :class="w.kind === 'truncated' ? 'text-warning-300' : 'text-gray-300'">{{ w.message }}</span>
        </li>
      </ul>
      <p v-else class="text-xs text-gray-400">Así se imprime desde el navegador, con logo y marca de agua.</p>

      <button
        type="button"
        class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:opacity-50"
        :disabled="printing"
        @click="printTest"
      >
        <Icon :name="printing ? 'ph:spinner-gap-bold' : 'ph:printer-bold'" :class="printing ? 'animate-spin' : ''" class="h-4 w-4" />
        {{ printing ? 'Imprimiendo…' : 'Imprimir prueba' }}
      </button>
      <p class="mt-1.5 text-center text-[11px] text-gray-500">
        Usa lo que ves ahora, aunque no lo hayas guardado. No cuenta como ticket ni consume folio.
      </p>
    </div>
  </div>
</template>
