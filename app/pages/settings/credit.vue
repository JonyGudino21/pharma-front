<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsForm } from '~/composables/useSettingsForm'
import type { CreditSettings, FieldErrors } from '~/types/settings'
import SettingsCard from '~/components/settings/SettingsCard.vue'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import SettingsHistory from '~/components/settings/SettingsHistory.vue'
import SettingsSwitch from '~/components/settings/fields/SettingsSwitch.vue'
import SettingsNumberField from '~/components/settings/fields/SettingsNumberField.vue'
import UnsavedChangesBar from '~/components/shared/UnsavedChangesBar.vue'

/**
 * CRÉDITO Y COBRANZA (ADR-0029). La fecha de pago de una venta a crédito es
 * opcional: aquí se decide qué se propone en caja, cuándo una cuenta está
 * "por vencer" y qué pasa con quien ya tiene saldo vencido.
 */
definePageMeta({ requiredPermission: 'canManageSettings' })

const LABELS: Record<keyof CreditSettings, string> = {
  defaultCreditDays: 'Días sugeridos para pagar',
  dueSoonDays: 'Aviso de «por vencer»',
  warnOverdueAtPos: 'Avisar saldo vencido en caja',
  blockCreditWhenOverdue: 'Bloquear crédito con saldo vencido',
}

const entero = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max

function validate(v: CreditSettings): FieldErrors<CreditSettings> {
  const e: FieldErrors<CreditSettings> = {}
  if (!entero(v.defaultCreditDays, 0, 365)) e.defaultCreditDays = 'Número entero de 0 a 365 días.'
  if (!entero(v.dueSoonDays, 1, 60)) e.dueSoonDays = 'Número entero de 1 a 60 días.'
  return e
}

const history = ref<InstanceType<typeof SettingsHistory> | null>(null)
const s = useSettingsForm('credit', {
  validate,
  savedMessage: 'Configuración de crédito guardada. Aplica desde la siguiente venta en todas las cajas.',
  onSaved: () => history.value?.reload(),
})

/** Ejemplo vivo de lo que verá la caja. */
const ejemplo = computed(() => {
  const d = s.form.defaultCreditDays
  if (!Number.isInteger(d)) return null
  if (d === 0) return 'Si el cliente no tiene días propios, la venta a crédito se propone sin fecha de pago (la caja puede poner una).'
  const f = new Date()
  f.setDate(f.getDate() + d)
  const fecha = f.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
  return `Una venta a crédito de hoy se propondría para pagar el ${fecha} (${d} días), salvo que el cliente tenga días propios.`
})

function format(key: string, value: unknown) {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  const n = Number(value)
  if (key === 'defaultCreditDays' && n === 0) return 'Sin sugerencia'
  return `${n} días`
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <SettingsPageHeader
      title="Crédito y cobranza"
      description="La fecha de pago de una venta a crédito es opcional: aquí decides qué fecha se propone en caja, cuándo avisar que una cuenta está por vencer y qué hacer con quien ya debe vencido."
      icon="ph:calendar-check-bold"
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
        title="Fecha de pago"
        description="Lo que la caja propone al cargar una venta a crédito. Siempre se puede cambiar o quitar en cada venta."
        icon="ph:calendar-dots-bold"
        :dirty="s.isChanged('defaultCreditDays') || s.isChanged('dueSoonDays')"
      >
        <div class="space-y-5">
          <SettingsNumberField
            v-model="s.form.defaultCreditDays"
            label="Días sugeridos para pagar"
            hint="Para clientes sin días propios (se ponen en su ficha › Crédito). 0 = no proponer fecha."
            suffix="días"
            :min="0"
            :max="365"
            :error="s.errors.value.defaultCreditDays"
            :changed="s.isChanged('defaultCreditDays')"
            :default-value="s.snapshot.value.defaults.defaultCreditDays"
            @restore="s.restoreDefault('defaultCreditDays')"
          />
          <p v-if="ejemplo" class="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900/40 dark:text-gray-300" data-testid="credit-example">
            {{ ejemplo }}
          </p>
          <SettingsNumberField
            v-model="s.form.dueSoonDays"
            label="Marcar «por vencer» con"
            hint="Días antes de la fecha de pago en que la cuenta aparece como «Por vencer» en Cobranza y en el panel."
            suffix="días de anticipación"
            :min="1"
            :max="60"
            :error="s.errors.value.dueSoonDays"
            :changed="s.isChanged('dueSoonDays')"
            :default-value="s.snapshot.value.defaults.dueSoonDays"
            @restore="s.restoreDefault('dueSoonDays')"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Clientes con saldo vencido"
        description="Qué pasa en caja cuando el cliente elegido ya tiene una venta con la fecha de pago pasada."
        icon="ph:warning-circle-bold"
        :dirty="s.isChanged('warnOverdueAtPos') || s.isChanged('blockCreditWhenOverdue')"
      >
        <div class="space-y-5">
          <SettingsSwitch v-model="s.form.warnOverdueAtPos" label="Avisar en caja" description="Al elegir al cliente aparece cuánto tiene vencido y desde cuándo, para cobrarlo de una vez." :changed="s.isChanged('warnOverdueAtPos')" />
          <SettingsSwitch v-model="s.form.blockCreditWhenOverdue" tone="warning" label="No permitir crédito nuevo" description="Con saldo vencido, la venta nueva se tiene que pagar completa (de contado). Las ventas sin fecha de pago nunca cuentan como vencidas." :changed="s.isChanged('blockCreditWhenOverdue')" />
        </div>
      </SettingsCard>

      <SettingsHistory ref="history" class="lg:col-span-2" namespace="credit" :labels="LABELS" :format="format" />
    </div>

    <UnsavedChangesBar :visible="s.dirty.value" :saving="s.saving.value" :can-save="s.valid.value" :scopes="['la configuración de crédito']" @save="s.save()" @discard="s.discard()" />
  </div>
</template>
