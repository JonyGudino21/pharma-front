<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsForm } from '~/composables/useSettingsForm'
import type { PricingSettings } from '~/types/settings'
import SettingsCard from '~/components/settings/SettingsCard.vue'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import SettingsHistory from '~/components/settings/SettingsHistory.vue'
import SettingsSwitch from '~/components/settings/fields/SettingsSwitch.vue'
import UnsavedChangesBar from '~/components/shared/UnsavedChangesBar.vue'

/**
 * PRECIOS EN CAJA (ADR-0025). Quién puede cambiar el precio de una línea en
 * el punto de venta, qué se exige y si el precio queda como precio especial
 * del cliente.
 */
definePageMeta({ requiredPermission: 'canManageSettings' })

const LABELS: Record<keyof PricingSettings, string> = {
  enabled: 'Cambiar precios en caja',
  cashierCanEdit: 'El cajero puede cambiar precios',
  pharmacistCanEdit: 'El farmacéutico puede cambiar precios',
  requireReason: 'Motivo obligatorio',
  saveForClientByDefault: 'Guardar para el cliente (marcado de inicio)',
  allowBelowCost: 'Vender bajo costo',
}

const history = ref<InstanceType<typeof SettingsHistory> | null>(null)
const s = useSettingsForm('pricing', {
  savedMessage: 'Reglas de precios guardadas. Aplican al siguiente cambio en cualquier caja.',
  onSaved: () => history.value?.reload(),
})

/** Quién puede, en palabras: lo que verá cada rol. */
const quienes = computed(() => {
  const f = s.form
  if (!f.enabled) return 'Nadie (el cambio de precios está apagado).'
  const roles = ['Administrador', 'Gerente']
  if (f.pharmacistCanEdit) roles.push('Farmacéutico')
  if (f.cashierCanEdit) roles.push('Cajero')
  return roles.join(', ') + '.'
})

function format(_key: string, value: unknown) {
  return typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <SettingsPageHeader
      title="Precios en caja"
      description="Quién puede cambiar el precio de un producto al vender y cómo se guarda el precio especial de cada cliente. Cada cambio queda registrado: quién, cuándo, de cuánto a cuánto y por qué."
      icon="ph:tag-bold"
      :snapshot="s.snapshot.value"
      :conflict="s.conflict.value"
      @reload="s.load()"
    />

    <div v-if="s.loading.value && !s.snapshot.value" class="grid gap-6 lg:grid-cols-2" aria-busy="true">
      <div v-for="n in 2" :key="n" class="h-56 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    </div>

    <div v-else-if="s.loadError.value" class="rounded-2xl border border-error-500/40 bg-white p-8 text-center dark:bg-gray-800" role="alert">
      <Icon name="ph:cloud-slash-fill" class="mx-auto h-10 w-10 text-error-500" />
      <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ s.loadError.value }}</p>
      <button type="button" class="btn-primary mx-auto mt-4 gap-2" @click="s.load()"><Icon name="ph:arrow-clockwise-bold" /> Reintentar</button>
    </div>

    <div v-else-if="s.snapshot.value" class="grid items-start gap-4 sm:gap-6 [&>*]:min-w-0 lg:grid-cols-2">
      <SettingsCard
        title="Quién puede"
        description="Gerencia y administración siempre pueden (si está activo). Para los demás roles, decides aquí."
        icon="ph:users-three-bold"
        :dirty="s.isChanged('enabled') || s.isChanged('pharmacistCanEdit') || s.isChanged('cashierCanEdit')"
      >
        <div class="space-y-5">
          <SettingsSwitch v-model="s.form.enabled" label="Permitir cambiar precios en caja" description="Apagado, nadie cambia precios al vender; los precios especiales ya guardados se siguen aplicando." :changed="s.isChanged('enabled')" />
          <SettingsSwitch v-model="s.form.pharmacistCanEdit" :disabled="!s.form.enabled" label="Farmacéutico" description="Puede cambiar el precio de una línea en el punto de venta." :changed="s.isChanged('pharmacistCanEdit')" />
          <SettingsSwitch v-model="s.form.cashierCanEdit" :disabled="!s.form.enabled" label="Cajero" description="Puede cambiar el precio de una línea en el punto de venta." :changed="s.isChanged('cashierCanEdit')" />
          <p class="flex gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900/40 dark:text-gray-300" data-testid="pricing-who">
            <Icon name="ph:info" class="h-4 w-4 shrink-0" />
            <span><strong>Pueden cambiar precios:</strong> {{ quienes }}</span>
          </p>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Al cambiar un precio"
        description="Qué se pide y qué se guarda."
        icon="ph:clipboard-text-bold"
        :dirty="s.isChanged('requireReason') || s.isChanged('saveForClientByDefault') || s.isChanged('allowBelowCost')"
      >
        <div class="space-y-5">
          <SettingsSwitch v-model="s.form.saveForClientByDefault" label="Guardar como precio especial del cliente" description="Con un cliente seleccionado, la casilla «Guardar para este cliente» aparece marcada: la próxima vez se le cobra ese precio solo." :changed="s.isChanged('saveForClientByDefault')" />
          <SettingsSwitch v-model="s.form.requireReason" label="Motivo obligatorio" description="Se pide al cambiar el precio y queda en la venta y en el historial del cliente." :changed="s.isChanged('requireReason')" />
          <SettingsSwitch v-model="s.form.allowBelowCost" tone="warning" label="Permitir vender bajo costo" description="Apagado (recomendado), se rechaza un precio menor al costo. Un precio IGUAL al costo se permite, con el aviso «sin ganancia»." :changed="s.isChanged('allowBelowCost')" />
          <p class="flex gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
            <Icon name="ph:info" class="h-4 w-4 shrink-0" />
            Un precio especial igual al de lista no se guarda como especial: así el cliente sigue los cambios futuros de la lista en lugar de quedar con un precio congelado. Los precios de cada cliente se ven y se editan en su ficha (Clientes).
          </p>
        </div>
      </SettingsCard>

      <SettingsHistory ref="history" class="lg:col-span-2" namespace="pricing" :labels="LABELS" :format="format" />
    </div>

    <UnsavedChangesBar :visible="s.dirty.value" :saving="s.saving.value" :can-save="s.valid.value" :scopes="['las reglas de precios']" @save="s.save()" @discard="s.discard()" />
  </div>
</template>
