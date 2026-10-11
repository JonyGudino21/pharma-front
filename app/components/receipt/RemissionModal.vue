<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Sale } from '~/stores/sales'
import type { Client } from '~/stores/client'
import { useReceiptPrint } from '~/composables/useReceiptPrint'
import { useToast } from '~/composables/useToast'
import { DEFAULT_REMISSION_SETTINGS, type RemissionSettings } from '~/types/settings'
import RemissionSheet from '~/components/receipt/RemissionSheet.vue'

/**
 * Vista previa e impresión de la NOTA DE REMISIÓN (hoja completa).
 *
 * La vista previa es un iframe con el MISMO documento que se imprime
 * (`remissionHtml`): lo que se ve aquí es lo que sale en papel o en el PDF.
 * `sandbox` sin scripts: el documento sólo lleva datos, nunca debe ejecutar nada.
 */
const props = defineProps<{
  sale: Sale
  /** Cuántas veces se ha impreso ya esta nota (para anunciar "Original"/"Copia n"). */
  printedCopies?: number
  /** Importe ya devuelto de la venta, para advertirlo en la nota. */
  returnedTotal?: number
  /** Cliente completo cuando la venta recién cobrada no trae su domicilio. */
  fallbackClient?: Client | null
}>()

const emit = defineEmits<{
  close: []
  printed: [copyNumber: number]
}>()

const toast = useToast()
const { printRemission, remissionHtml, remissionSettings, isPrinting } = useReceiptPrint()

const cfg = ref<RemissionSettings>(DEFAULT_REMISSION_SETTINGS)
const html = ref('')
const loading = ref(true)
const failed = ref(false)
/**
 * Último número de copia que REGISTRÓ el servidor desde que se abrió el modal.
 * La fuente de verdad es el servidor: antes se sumaba un contador local a
 * `printedCopies`, que el padre también incrementaba, y la misma impresión se
 * contaba dos veces ("se imprimirá como COPIA 5" tras dos impresiones).
 */
const lastRegistered = ref(0)

const nextCopy = computed(() => Math.max(props.printedCopies ?? 0, lastRegistered.value) + 1)

async function loadPreview() {
  loading.value = true
  failed.value = false
  try {
    cfg.value = await remissionSettings()
    html.value = await remissionHtml(props.sale, {
      copyNumber: 0,
      returnedTotal: props.returnedTotal,
      fallbackClient: props.fallbackClient,
    })
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

async function imprimir() {
  try {
    const ok = await printRemission(props.sale, {
      returnedTotal: props.returnedTotal,
      fallbackClient: props.fallbackClient,
      onRegistered: (n) => {
        lastRegistered.value = n
        emit('printed', n)
      },
    })
    if (ok) toast.success(lastRegistered.value > 1 ? `Copia ${lastRegistered.value} enviada a la impresión.` : 'Original enviado a la impresión.')
  } catch {
    // El interceptor de $api ya explicó el motivo (sin conexión, sin permiso…).
  }
}

onMounted(() => {
  void loadPreview()
  // Capture: Escape cierra SOLO este modal y no llega al POS (que lo usaría
  // para cerrar otra cosa o volver al escáner).
  window.addEventListener('keydown', onKey, true)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
watch(() => props.sale, () => void loadPreview())

function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  e.stopPropagation()
  emit('close')
}
</script>

<template>
  <div
    class="modal-overlay z-60 bg-gray-900/60"
    role="dialog"
    aria-modal="true"
    aria-labelledby="remission-title"
    data-testid="remission-modal"
    @click.self="emit('close')"
  >
    <!-- Celular: hoja a pantalla completa (la vista previa necesita todo el alto). -->
    <div class="modal-panel h-dvh max-h-dvh rounded-none shadow-2xl sm:h-auto sm:max-h-[94vh] sm:max-w-4xl sm:rounded-2xl">
      <header class="modal-header border-gray-200 dark:border-gray-700">
        <div class="min-w-0">
          <h2 id="remission-title" class="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <Icon name="ph:file-text-bold" class="h-5 w-5 text-primary-600" />
            Nota de remisión
          </h2>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Hoja {{ cfg.paper === 'A4' ? 'A4' : 'Carta' }} · se imprimirá como
            <strong>{{ nextCopy === 1 ? 'ORIGINAL' : `COPIA ${nextCopy}` }}</strong>.
            Para descargarla, elige “Guardar como PDF” como impresora en el diálogo.
          </p>
        </div>
        <button type="button" class="-mr-2 shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="Cerrar" @click="emit('close')">
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-2 sm:p-4 dark:bg-gray-900">
        <div v-if="loading" class="py-24 text-center text-sm text-gray-500" aria-busy="true">
          <Icon name="ph:spinner-gap-bold" class="mx-auto mb-2 h-8 w-8 animate-spin" />
          Preparando la nota…
        </div>

        <div v-else-if="failed" class="py-16 text-center" role="alert">
          <Icon name="ph:warning-bold" class="mx-auto h-10 w-10 text-error-500" />
          <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">No se pudo preparar la nota.</p>
          <p class="mt-1 text-xs text-gray-500">Revisa la conexión con el servidor y vuelve a intentarlo.</p>
          <button type="button" class="btn-primary mx-auto mt-4 gap-2" @click="loadPreview">
            <Icon name="ph:arrow-clockwise-bold" /> Reintentar
          </button>
        </div>

        <RemissionSheet v-else :html="html" :paper="cfg.paper" />
      </div>

      <footer class="modal-footer border-gray-200 dark:border-gray-700">
        <button type="button" class="btn-secondary" @click="emit('close')">Cerrar</button>
        <button
          type="button"
          class="btn-primary gap-2"
          :disabled="loading || failed || isPrinting"
          data-testid="remission-print"
          @click="imprimir"
        >
          <Icon :name="isPrinting ? 'ph:spinner-gap-bold' : 'ph:printer-bold'" :class="{ 'animate-spin': isPrinting }" class="h-5 w-5" />
          {{ isPrinting ? 'Preparando…' : 'Imprimir o guardar PDF' }}
        </button>
      </footer>
    </div>
  </div>
</template>
