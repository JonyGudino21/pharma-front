<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsForm } from '~/composables/useSettingsForm'
import { useCurrency } from '~/composables/useCurrency'
import type { CashSettings, FieldErrors } from '~/types/settings'
import SettingsCard from '~/components/settings/SettingsCard.vue'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import SettingsHistory from '~/components/settings/SettingsHistory.vue'
import SettingsNumberField from '~/components/settings/fields/SettingsNumberField.vue'
import SettingsSwitch from '~/components/settings/fields/SettingsSwitch.vue'
import UnsavedChangesBar from '~/components/shared/UnsavedChangesBar.vue'

definePageMeta({ requiredPermission: 'canManageSettings' })

const { formatCurrency } = useCurrency()

const LABELS: Record<keyof CashSettings, string> = {
  closeTolerance: 'Tolerancia del arqueo',
  suggestedOpeningFloat: 'Fondo sugerido',
  maxCashInDrawer: 'Límite de efectivo en caja',
  blindClose: 'Cierre ciego',
}

/**
 * ¿Importe con máximo 2 decimales dentro del rango?
 * Con margen: en coma flotante 1.15 × 100 = 114.99999999999999, y una
 * comparación exacta rechazaría $1.15.
 */
const importe = (n: number, max: number) =>
  Number.isFinite(n) && n >= 0 && n <= max && Math.abs(Math.round(n * 100) - n * 100) < 1e-6

/** Mismos rangos y reglas que `CashSettings` en el backend. */
function validate(v: CashSettings): FieldErrors<CashSettings> {
  const e: FieldErrors<CashSettings> = {}
  if (!importe(v.closeTolerance, 100000)) e.closeTolerance = 'Importe entre $0 y $100,000, con máximo 2 decimales.'
  if (!importe(v.suggestedOpeningFloat, 1000000)) e.suggestedOpeningFloat = 'Importe entre $0 y $1,000,000, con máximo 2 decimales.'
  if (!importe(v.maxCashInDrawer, 10000000)) e.maxCashInDrawer = 'Importe entre $0 y $10,000,000, con máximo 2 decimales.'
  if (!e.maxCashInDrawer && !e.suggestedOpeningFloat && v.maxCashInDrawer > 0 && v.maxCashInDrawer < v.suggestedOpeningFloat) {
    e.maxCashInDrawer = 'No puede ser menor que el fondo sugerido: la caja abriría ya pasada del límite.'
  }
  return e
}

const history = ref<InstanceType<typeof SettingsHistory> | null>(null)
const s = useSettingsForm('cash', {
  validate,
  savedMessage: 'Configuración de caja guardada. Aplica desde el siguiente cierre y en todas las cajas.',
  onSaved: () => history.value?.reload(),
})

/** Ejemplo vivo con la tolerancia que se está escribiendo. */
const ejemplo = computed(() => {
  const t = s.form.closeTolerance
  if (!Number.isFinite(t)) return null
  if (t === 0) return 'Con $0, cualquier centavo de diferencia marca el turno como "Requiere auditoría".'
  const dentro = Math.round(t * 0.75 * 100) / 100
  const fuera = Math.round((t + Math.max(1, t * 0.25)) * 100) / 100
  return `Con ${formatCurrency(t)}: un faltante de ${formatCurrency(dentro)} cierra normal; uno de ${formatCurrency(fuera)} queda como "Requiere auditoría".`
})

function format(key: string, value: unknown) {
  if (key === 'blindClose') return value ? 'Activado' : 'Desactivado'
  const n = Number(value)
  if ((key === 'maxCashInDrawer' || key === 'suggestedOpeningFloat') && n === 0) return 'Sin definir'
  return formatCurrency(n)
}
</script>

<template>
  <div class="space-y-6">
    <SettingsPageHeader
      title="Caja"
      description="Controles del arqueo, del fondo inicial y del efectivo en el cajón. Aplican a todos los turnos de todas las cajas."
      icon="ph:cash-register-bold"
      :snapshot="s.snapshot.value"
      :conflict="s.conflict.value"
      @reload="s.load()"
    />

    <div v-if="s.loading.value && !s.snapshot.value" class="grid gap-6 lg:grid-cols-2" aria-busy="true">
      <div v-for="n in 3" :key="n" class="h-56 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    </div>

    <div v-else-if="s.loadError.value" class="rounded-2xl border border-error-500/40 bg-white p-8 text-center dark:bg-gray-800" role="alert">
      <Icon name="ph:cloud-slash-fill" class="mx-auto h-10 w-10 text-error-500" />
      <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ s.loadError.value }}</p>
      <button type="button" class="btn-primary mx-auto mt-4 gap-2" @click="s.load()">
        <Icon name="ph:arrow-clockwise-bold" /> Reintentar
      </button>
    </div>

    <div v-else-if="s.snapshot.value" class="grid items-start gap-6 lg:grid-cols-2">
      <SettingsCard
        title="Arqueo al cerrar turno"
        description="Diferencia que se acepta entre lo contado y lo esperado antes de pedir revisión de gerencia."
        icon="ph:scales-bold"
        :dirty="s.isChanged('closeTolerance')"
      >
        <SettingsNumberField
          v-model="s.form.closeTolerance"
          label="Tolerancia (±)"
          prefix="$"
          :step="0.01"
          :min="0"
          :max="100000"
          :error="s.errors.value.closeTolerance"
          :changed="s.isChanged('closeTolerance')"
          :default-value="s.snapshot.value.defaults.closeTolerance"
          :format-default="formatCurrency"
          @restore="s.restoreDefault('closeTolerance')"
        />
        <p v-if="ejemplo" class="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
          {{ ejemplo }}
        </p>
      </SettingsCard>

      <SettingsCard
        title="Cierre ciego"
        description="El cajero cuenta sin saber cuánto debería haber."
        icon="ph:eye-slash-bold"
        :dirty="s.isChanged('blindClose')"
      >
        <SettingsSwitch
          v-model="s.form.blindClose"
          tone="warning"
          label="Ocultar el esperado y la diferencia al cajero"
          description="Al cerrar, el cajero sólo ve lo que contó; gerencia ve el arqueo completo en el detalle del turno. Evita que el conteo se ajuste para cuadrar."
          :changed="s.isChanged('blindClose')"
        />
        <ul class="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <li class="flex gap-2"><Icon name="ph:check" class="h-4 w-4 shrink-0 text-success-600" /> El arqueo se calcula y se guarda igual.</li>
          <li class="flex gap-2"><Icon name="ph:check" class="h-4 w-4 shrink-0 text-success-600" /> Gerencia y administración siempre ven la diferencia.</li>
          <li class="flex gap-2"><Icon name="ph:check" class="h-4 w-4 shrink-0 text-success-600" /> El historial del cajero tampoco muestra el esperado.</li>
        </ul>
      </SettingsCard>

      <SettingsCard
        class="lg:col-span-2"
        title="Fondo y efectivo en el cajón"
        description="Con qué abre cada turno y cuánto efectivo es prudente acumular antes de un retiro."
        icon="ph:coins-bold"
        :dirty="s.isChanged('suggestedOpeningFloat') || s.isChanged('maxCashInDrawer')"
      >
        <div class="grid gap-5 md:grid-cols-2">
          <SettingsNumberField
            v-model="s.form.suggestedOpeningFloat"
            label="Fondo sugerido al abrir"
            prefix="$"
            :step="0.01"
            :min="0"
            :error="s.errors.value.suggestedOpeningFloat"
            :changed="s.isChanged('suggestedOpeningFloat')"
            hint="Se propone al abrir turno; el cajero lo confirma o corrige. $0 = sin sugerencia."
          />
          <SettingsNumberField
            v-model="s.form.maxCashInDrawer"
            label="Límite de efectivo en caja"
            prefix="$"
            :step="0.01"
            :min="0"
            :error="s.errors.value.maxCashInDrawer"
            :changed="s.isChanged('maxCashInDrawer')"
            hint="Al rebasarlo, la pantalla de Caja avisa que toca hacer un retiro. $0 = sin límite."
          />
        </div>
      </SettingsCard>

      <SettingsHistory ref="history" class="lg:col-span-2" namespace="cash" :labels="LABELS" :format="format" />
    </div>

    <UnsavedChangesBar
      :visible="s.dirty.value"
      :saving="s.saving.value"
      :can-save="s.valid.value"
      :scopes="['la configuración de caja']"
      @save="s.save()"
      @discard="s.discard()"
    />
  </div>
</template>
