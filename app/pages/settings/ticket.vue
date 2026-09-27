<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useTicketStudio } from '~/composables/useTicketStudio'
import { useReceiptPrint } from '~/composables/useReceiptPrint'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'
import TemplateTabs from '~/components/settings/ticket/TemplateTabs.vue'
import CompanyFiscalCard from '~/components/settings/ticket/CompanyFiscalCard.vue'
import PaperOptionsCard from '~/components/settings/ticket/PaperOptionsCard.vue'
import BlockOrderCard from '~/components/settings/ticket/BlockOrderCard.vue'
import PrinterStage from '~/components/settings/ticket/PrinterStage.vue'
import UnsavedChangesBar from '~/components/shared/UnsavedChangesBar.vue'

definePageMeta({ requiredPermission: 'canManageCompany' })

/**
 * CONFIGURACIÓN DEL TICKET.
 *
 * Esta página sólo compone: la lógica vive en `useTicketStudio` y cada bloque
 * visual en su componente. Así la regla "no se puede quitar Totales" o "el RFC
 * se valida igual que en el servidor" está en un solo sitio.
 */
const s = useTicketStudio()
const { printTest, isPrinting } = useReceiptPrint()

onMounted(() => s.load())

const scopes = computed(() => {
  const out: string[] = []
  if (s.companyDirty.value) out.push('los datos de la farmacia')
  if (s.templateDirty.value) out.push('la plantilla')
  return out
})

// ── No perder cambios ──────────────────────────────────────────────────────
// Antes, cambiar de plantilla o salir de la pantalla descartaba lo editado sin
// preguntar. Ahora se pide confirmación en los tres caminos: otra plantilla,
// otra pantalla, y cerrar o recargar la pestaña.

const CONFIRM = 'Tienes cambios sin guardar. ¿Salir y descartarlos?'

function onSelect(id: number) {
  if (id === s.templateId.value) return
  if (s.templateDirty.value && !window.confirm('La plantilla actual tiene cambios sin guardar. ¿Cambiar de plantilla y descartarlos?')) return
  s.selectTemplate(id)
}

async function onCreate(width: 58 | 80) {
  if (s.templateDirty.value && !window.confirm('La plantilla actual tiene cambios sin guardar. La copia se hará con lo que ves en pantalla. ¿Continuar?')) return
  await s.createTemplate(width)
}

async function onDeactivate() {
  if (!window.confirm(`¿Desactivar la plantilla "${s.template.name}"? Dejará de estar disponible para imprimir.`)) return
  await s.deactivate()
}

onBeforeRouteLeave(() => {
  if (s.dirty.value && !window.confirm(CONFIRM)) return false
})

function beforeUnload(e: BeforeUnloadEvent) {
  if (!s.dirty.value) return
  e.preventDefault()
  e.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

// Ctrl+S / Cmd+S guarda sin buscar el botón.
useKeyboardShortcuts({
  'ctrl+s': () => void s.save(),
  'meta+s': () => void s.save(),
})

function onPrintTest(previewEl: HTMLElement | null) {
  void printTest({
    sale: s.sampleSale.value,
    company: s.liveCompany.value,
    template: s.liveTemplate.value,
    previewEl,
  })
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <!-- Encabezado, con la misma estructura que el resto de pantallas -->
    <div class="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Configuración</p>
        <h1 class="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Icon name="ph:receipt-bold" class="text-primary-600" /> Ticket de venta
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Lo que imprime cada caja al cobrar. La vista previa se actualiza mientras editas y
          muestra exactamente lo que sale por la impresora térmica.
        </p>
      </div>
      <TemplateTabs
        v-if="s.store.activeTemplates.length"
        class="lg:max-w-[55%]"
        :templates="s.store.activeTemplates"
        :selected-id="s.templateId.value"
        :busy="s.saving.value || s.store.isSaving"
        @select="onSelect"
        @create="onCreate"
        @make-default="s.makeDefault"
        @deactivate="onDeactivate"
      />
    </div>

    <!-- Cargando / error / contenido -->
    <div v-if="s.store.isLoading && !s.store.company" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]" aria-busy="true">
      <div class="space-y-6">
        <div v-for="n in 3" :key="n" class="h-56 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
      <div class="h-[520px] animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
    </div>

    <div v-else-if="s.loadError.value" class="rounded-2xl border border-error-500/40 bg-white p-8 text-center dark:bg-gray-800" role="alert">
      <Icon name="ph:cloud-slash-fill" class="mx-auto h-10 w-10 text-error-500" />
      <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ s.loadError.value }}</p>
      <button type="button" class="btn-primary mx-auto mt-4 gap-2" @click="s.load()">
        <Icon name="ph:arrow-clockwise-bold" /> Reintentar
      </button>
    </div>

    <div v-else class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div class="space-y-6">
        <CompanyFiscalCard v-model="s.company" :errors="s.companyErrors.value" :dirty="s.companyDirty.value" />
        <PaperOptionsCard v-model="s.template" :name-error="s.templateErrors.value.name" :dirty="s.templateDirty.value" />
        <BlockOrderCard
          v-model="s.template"
          :ordered="s.orderedBlocks.value"
          :is-required="s.isRequired"
          :dirty="s.templateDirty.value"
          @toggle="s.toggleBlock"
          @move="s.moveBlock"
          @drop="s.dropBlock"
        />
      </div>

      <div class="lg:sticky lg:top-24">
        <PrinterStage
          :sale="s.sampleSale.value"
          :company="s.liveCompany.value"
          :template="s.liveTemplate.value"
          :printing="isPrinting"
          @print-test="onPrintTest"
        />
      </div>
    </div>

    <UnsavedChangesBar
      :visible="s.dirty.value"
      :saving="s.saving.value"
      :can-save="s.valid.value"
      :scopes="scopes"
      @save="s.save()"
      @discard="s.discard()"
    />
  </div>
</template>
