<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsForm } from '~/composables/useSettingsForm'
import type { FieldErrors, InventorySettings } from '~/types/settings'
import SettingsCard from '~/components/settings/SettingsCard.vue'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import SettingsHistory from '~/components/settings/SettingsHistory.vue'
import SettingsNumberField from '~/components/settings/fields/SettingsNumberField.vue'
import SettingsSwitch from '~/components/settings/fields/SettingsSwitch.vue'
import SegmentedControl from '~/components/settings/ticket/SegmentedControl.vue'
import ExpiryScale from '~/components/settings/ExpiryScale.vue'
import UnsavedChangesBar from '~/components/shared/UnsavedChangesBar.vue'

definePageMeta({ requiredPermission: 'canManageSettings' })

const LABELS: Record<keyof InventorySettings, string> = {
  expiryAlertDays: 'Horizonte de alerta',
  expiryCriticalDays: 'Días críticos',
  expiryWarningDays: 'Días de advertencia',
  expiryInclusive: 'Criterio de caducidad',
  requireLotForAll: 'Exigir lote en toda entrada',
  defaultMinStock: 'Stock mínimo sugerido',
}

/** Mismos rangos y reglas que `InventorySettings` en el backend. */
function validate(v: InventorySettings): FieldErrors<InventorySettings> {
  const e: FieldErrors<InventorySettings> = {}
  const entero = (n: number, min: number, max: number) =>
    Number.isInteger(n) && n >= min && n <= max
  if (!entero(v.expiryAlertDays, 7, 365)) e.expiryAlertDays = 'Entre 7 y 365 días.'
  if (!entero(v.expiryCriticalDays, 1, 180)) e.expiryCriticalDays = 'Entre 1 y 180 días.'
  if (!entero(v.expiryWarningDays, 2, 365)) e.expiryWarningDays = 'Entre 2 y 365 días.'
  if (!e.expiryCriticalDays && !e.expiryWarningDays && v.expiryCriticalDays >= v.expiryWarningDays) {
    e.expiryCriticalDays = 'Debe ser menor que los días de advertencia.'
  }
  if (!e.expiryWarningDays && !e.expiryAlertDays && v.expiryWarningDays > v.expiryAlertDays) {
    e.expiryWarningDays = 'No puede pasar del horizonte de alerta.'
  }
  if (!entero(v.defaultMinStock, 0, 100000)) e.defaultMinStock = 'Entero entre 0 y 100,000.'
  return e
}

const history = ref<InstanceType<typeof SettingsHistory> | null>(null)
const s = useSettingsForm('inventory', {
  validate,
  savedMessage: 'Configuración de inventario guardada. Ya aplica en caducidades, compras y ventas.',
  onSaved: () => history.value?.reload(),
})

// El SegmentedControl trabaja con cadenas; el ajuste es booleano.
const criterio = computed<'inclusive' | 'exclusive'>({
  get: () => (s.form.expiryInclusive ? 'inclusive' : 'exclusive'),
  set: (v) => (s.form.expiryInclusive = v === 'inclusive'),
})
const CRITERIOS = [
  { value: 'inclusive' as const, title: 'Se vende hasta el día impreso', hint: 'La fecha es el último día válido' },
  { value: 'exclusive' as const, title: 'Deja de venderse ese día', hint: 'La fecha es el primer día no válido' },
]

const dias = (n: number) => `${n} días`
function format(key: string, value: unknown) {
  if (key === 'expiryInclusive') return value ? 'Hasta el día impreso' : 'Deja de venderse ese día'
  if (key === 'requireLotForAll') return value ? 'Sí' : 'No'
  if (key === 'defaultMinStock') return `${String(value)} u.`
  return typeof value === 'number' ? dias(value) : String(value)
}
</script>

<template>
  <div class="space-y-6">
    <SettingsPageHeader
      title="Inventario y caducidad"
      description="Cómo se clasifican los lotes por caducar, qué lote se considera vencido y qué se exige al recibir mercancía. Aplica en todas las cajas."
      icon="ph:hourglass-medium-bold"
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
        class="lg:col-span-2"
        title="Alertas de caducidad"
        description="El semáforo de la pantalla Caducidades y el horizonte que muestra por defecto."
        icon="ph:traffic-signal-bold"
        :dirty="s.isChanged('expiryAlertDays') || s.isChanged('expiryCriticalDays') || s.isChanged('expiryWarningDays')"
      >
        <div class="grid gap-5 md:grid-cols-3">
          <SettingsNumberField
            v-model="s.form.expiryCriticalDays"
            label="Rojo: menos de"
            suffix="días"
            :min="1"
            :max="180"
            :error="s.errors.value.expiryCriticalDays"
            :changed="s.isChanged('expiryCriticalDays')"
            :default-value="s.snapshot.value.defaults.expiryCriticalDays"
            hint="Urgente: devolver al proveedor o liquidar."
            @restore="s.restoreDefault('expiryCriticalDays')"
          />
          <SettingsNumberField
            v-model="s.form.expiryWarningDays"
            label="Amarillo: hasta"
            suffix="días"
            :min="2"
            :max="365"
            :error="s.errors.value.expiryWarningDays"
            :changed="s.isChanged('expiryWarningDays')"
            :default-value="s.snapshot.value.defaults.expiryWarningDays"
            hint="Planear su salida: promoción o rotación."
            @restore="s.restoreDefault('expiryWarningDays')"
          />
          <SettingsNumberField
            v-model="s.form.expiryAlertDays"
            label="Horizonte de alerta"
            suffix="días"
            :min="7"
            :max="365"
            :error="s.errors.value.expiryAlertDays"
            :changed="s.isChanged('expiryAlertDays')"
            :default-value="s.snapshot.value.defaults.expiryAlertDays"
            hint="Hasta dónde mira la lista Por caducar."
            @restore="s.restoreDefault('expiryAlertDays')"
          />
        </div>
        <ExpiryScale
          class="mt-5"
          :critical="s.form.expiryCriticalDays"
          :warning="s.form.expiryWarningDays"
          :horizon="s.form.expiryAlertDays"
        />
      </SettingsCard>

      <SettingsCard
        title="Criterio sanitario"
        description="Qué significa la fecha impresa en la caja. Define si un lote que caduca HOY se puede vender."
        icon="ph:first-aid-kit-bold"
        :dirty="s.isChanged('expiryInclusive')"
      >
        <SegmentedControl v-model="criterio" label="La fecha de caducidad impresa…" :options="CRITERIOS" />
        <p class="mt-4 flex gap-2 rounded-lg bg-warning-500/10 p-3 text-xs text-warning-800 dark:text-warning-300">
          <Icon name="ph:warning-bold" class="h-4 w-4 shrink-0" />
          Es una regla sanitaria: confírmala con el responsable sanitario según el PNO de la farmacia. Aplica de inmediato al vender, en todas las cajas.
        </p>
      </SettingsCard>

      <SettingsCard
        title="Entradas de mercancía"
        description="Qué se exige al recibir compras y al dar de alta productos con existencias."
        icon="ph:package-bold"
        :dirty="s.isChanged('requireLotForAll') || s.isChanged('defaultMinStock')"
      >
        <div class="space-y-5">
          <SettingsSwitch
            v-model="s.form.requireLotForAll"
            label="Exigir lote y caducidad en toda entrada"
            description="Los controlados siempre lo exigen. Activado, también los demás: sin lote, las unidades quedan fuera del FEFO y de la alerta de caducidad."
            :changed="s.isChanged('requireLotForAll')"
          />
          <SettingsNumberField
            v-model="s.form.defaultMinStock"
            label="Stock mínimo sugerido"
            suffix="unidades"
            :min="0"
            :max="100000"
            :error="s.errors.value.defaultMinStock"
            :changed="s.isChanged('defaultMinStock')"
            :default-value="s.snapshot.value.defaults.defaultMinStock"
            hint="Se propone al dar de alta un producto. Por debajo de él, aparece en Stock bajo."
            @restore="s.restoreDefault('defaultMinStock')"
          />
        </div>
      </SettingsCard>

      <SettingsHistory ref="history" class="lg:col-span-2" namespace="inventory" :labels="LABELS" :format="format" />
    </div>

    <UnsavedChangesBar
      :visible="s.dirty.value"
      :saving="s.saving.value"
      :can-save="s.valid.value"
      :scopes="['la configuración de inventario']"
      @save="s.save()"
      @discard="s.discard()"
    />
  </div>
</template>
