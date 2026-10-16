<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsForm } from '~/composables/useSettingsForm'
import type { DiscountSettings, FieldErrors } from '~/types/settings'
import SettingsCard from '~/components/settings/SettingsCard.vue'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import SettingsHistory from '~/components/settings/SettingsHistory.vue'
import SettingsNumberField from '~/components/settings/fields/SettingsNumberField.vue'
import SettingsSwitch from '~/components/settings/fields/SettingsSwitch.vue'
import UnsavedChangesBar from '~/components/shared/UnsavedChangesBar.vue'

definePageMeta({ requiredPermission: 'canManageSettings' })

const LABELS: Record<keyof DiscountSettings, string> = {
  enabled: 'Descuentos en caja',
  cashierMaxPercent: 'Tope del cajero',
  pharmacistMaxPercent: 'Tope del farmacéutico',
  managerMaxPercent: 'Tope del gerente',
  maxPercent: 'Descuento máximo',
  requireReason: 'Motivo obligatorio',
  allowAuthorization: 'Autorización de gerente',
  allowBelowCost: 'Vender bajo costo',
}

const pct = (n: number) => Number.isFinite(n) && n >= 0 && n <= 100 && Math.abs(Math.round(n * 100) - n * 100) < 1e-6

/** Mismas reglas que `DiscountSettings` en el backend. */
function validate(v: DiscountSettings): FieldErrors<DiscountSettings> {
  const e: FieldErrors<DiscountSettings> = {}
  const keys = ['cashierMaxPercent', 'pharmacistMaxPercent', 'managerMaxPercent', 'maxPercent'] as const
  for (const k of keys) if (!pct(v[k])) e[k] = 'Entre 0 y 100, con máximo 2 decimales.'
  if (!e.maxPercent) {
    for (const k of keys.slice(0, 3)) {
      if (!e[k] && v[k] > v.maxPercent) e[k] = `No puede superar el máximo (${v.maxPercent}%).`
    }
  }
  return e
}

const history = ref<InstanceType<typeof SettingsHistory> | null>(null)
const s = useSettingsForm('discounts', {
  validate,
  savedMessage: 'Reglas de descuento guardadas. Aplican al siguiente descuento en cualquier caja.',
  onSaved: () => history.value?.reload(),
})

/** Escalera de topes: cada rol como barra sobre el máximo. */
const ladder = computed(() => {
  const f = s.form
  const max = Number.isFinite(f.maxPercent) && f.maxPercent > 0 ? f.maxPercent : 100
  return [
    { role: 'Cajero', value: f.cashierMaxPercent, cls: 'bg-yellow-400' },
    { role: 'Farmacéutico', value: f.pharmacistMaxPercent, cls: 'bg-purple-500' },
    { role: 'Gerente', value: f.managerMaxPercent, cls: 'bg-primary-600' },
    { role: 'Administrador', value: f.maxPercent, cls: 'bg-error-500' },
  ].map((r) => ({ ...r, width: `${Math.min(100, Math.max(0, (Number.isFinite(r.value) ? r.value : 0) / max * 100))}%` }))
})

function format(key: string, value: unknown) {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return `${String(value)}%`
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <SettingsPageHeader
      title="Descuentos"
      description="Cuánto puede descontar cada rol, cuándo hace falta autorización de gerente y qué se exige en cada descuento. Todo queda registrado en la venta."
      icon="ph:percent-bold"
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
      <button type="button" class="btn-primary mx-auto mt-4 gap-2" @click="s.load()"><Icon name="ph:arrow-clockwise-bold" /> Reintentar</button>
    </div>

    <div v-else-if="s.snapshot.value" class="grid items-start gap-4 sm:gap-6 [&>*]:min-w-0 lg:grid-cols-2">
      <SettingsCard
        class="lg:col-span-2"
        title="Topes por rol"
        description="Hasta dónde descuenta cada rol por sí mismo. Arriba de su tope, un gerente autoriza con sus credenciales en la misma caja."
        icon="ph:stairs-bold"
        :dirty="['cashierMaxPercent', 'pharmacistMaxPercent', 'managerMaxPercent', 'maxPercent'].some((k) => s.isChanged(k as keyof DiscountSettings))"
      >
        <div class="grid gap-5 md:grid-cols-4">
          <SettingsNumberField v-model="s.form.cashierMaxPercent" label="Cajero" suffix="%" :step="0.5" :min="0" :max="100" :error="s.errors.value.cashierMaxPercent" :changed="s.isChanged('cashierMaxPercent')" hint="0 = siempre con autorización." />
          <SettingsNumberField v-model="s.form.pharmacistMaxPercent" label="Farmacéutico" suffix="%" :step="0.5" :min="0" :max="100" :error="s.errors.value.pharmacistMaxPercent" :changed="s.isChanged('pharmacistMaxPercent')" />
          <SettingsNumberField v-model="s.form.managerMaxPercent" label="Gerente" suffix="%" :step="0.5" :min="0" :max="100" :error="s.errors.value.managerMaxPercent" :changed="s.isChanged('managerMaxPercent')" hint="También lo que puede autorizar." />
          <SettingsNumberField v-model="s.form.maxPercent" label="Máximo (administrador)" suffix="%" :step="0.5" :min="0" :max="100" :error="s.errors.value.maxPercent" :changed="s.isChanged('maxPercent')" hint="Nadie descuenta más." />
        </div>

        <figure class="mt-5 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <figcaption class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quién descuenta cuánto sin pedir permiso</figcaption>
          <div v-for="r in ladder" :key="r.role" class="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3 text-sm">
            <span class="text-gray-600 dark:text-gray-300">{{ r.role }}</span>
            <span class="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <span class="block h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none" :class="r.cls" :style="{ width: r.width }" />
            </span>
            <span class="text-right tabular-nums font-semibold text-gray-800 dark:text-gray-100">{{ Number.isFinite(r.value) ? r.value : '—' }}%</span>
          </div>
        </figure>
      </SettingsCard>

      <SettingsCard title="En la caja" description="Si se puede descontar y qué se pide cada vez." icon="ph:cash-register-bold" :dirty="s.isChanged('enabled') || s.isChanged('requireReason')">
        <div class="space-y-5">
          <SettingsSwitch v-model="s.form.enabled" label="Permitir descuentos" description="Apagado, nadie aplica descuentos nuevos. Quitar uno ya aplicado siempre se puede." :changed="s.isChanged('enabled')" />
          <SettingsSwitch v-model="s.form.requireReason" label="Motivo obligatorio" description="Se pide al aplicar el descuento y queda en la venta junto a quién lo dio." :changed="s.isChanged('requireReason')" />
        </div>
      </SettingsCard>

      <SettingsCard title="Controles" description="Protecciones contra descuentos que hacen perder dinero." icon="ph:shield-check-bold" :dirty="s.isChanged('allowAuthorization') || s.isChanged('allowBelowCost')">
        <div class="space-y-5">
          <SettingsSwitch v-model="s.form.allowAuthorization" label="Autorización de gerente" description="Un gerente puede aprobar en la caja un descuento mayor al tope del cajero, hasta su propio tope." :changed="s.isChanged('allowAuthorization')" />
          <SettingsSwitch v-model="s.form.allowBelowCost" tone="warning" label="Permitir vender bajo costo" description="Apagado (recomendado), se rechaza cualquier descuento que deje el precio por debajo del costo del producto." :changed="s.isChanged('allowBelowCost')" />
          <p class="flex gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
            <Icon name="ph:info" class="h-4 w-4 shrink-0" />
            Una vez registrado un pago, el descuento de esa venta queda congelado. Las devoluciones reembolsan lo que el cliente pagó, con su descuento.
          </p>
        </div>
      </SettingsCard>

      <SettingsHistory ref="history" class="lg:col-span-2" namespace="discounts" :labels="LABELS" :format="format" />
    </div>

    <UnsavedChangesBar :visible="s.dirty.value" :saving="s.saving.value" :can-save="s.valid.value" :scopes="['las reglas de descuento']" @save="s.save()" @discard="s.discard()" />
  </div>
</template>
