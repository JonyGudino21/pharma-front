<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSettingsForm } from '~/composables/useSettingsForm'
import { useCategoryStore } from '~/stores/category'
import { useProductStore } from '~/stores/product'
import { useToast } from '~/composables/useToast'
import type { FieldErrors, TaxCategory, TaxSettings } from '~/types/settings'
import { TAX_CATEGORY_META } from '~/utils/tax-categories'
import SettingsCard from '~/components/settings/SettingsCard.vue'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import SettingsHistory from '~/components/settings/SettingsHistory.vue'
import SettingsSwitch from '~/components/settings/fields/SettingsSwitch.vue'
import SegmentedControl from '~/components/settings/ticket/SegmentedControl.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import UnsavedChangesBar from '~/components/shared/UnsavedChangesBar.vue'

definePageMeta({ requiredPermission: 'canManageSettings' })

const LABELS: Record<keyof TaxSettings, string> = {
  generalRate: 'Tasa general',
  defaultCategory: 'IVA de productos nuevos',
  showBreakdownOnTicket: 'Desglose en el ticket',
}

function validate(v: TaxSettings): FieldErrors<TaxSettings> {
  const e: FieldErrors<TaxSettings> = {}
  if (v.generalRate !== 16 && v.generalRate !== 8) e.generalRate = 'Debe ser 16% u 8%.'
  if (!(v.defaultCategory in TAX_CATEGORY_META)) e.defaultCategory = 'Tratamiento inválido.'
  return e
}

const history = ref<InstanceType<typeof SettingsHistory> | null>(null)
const s = useSettingsForm('taxes', {
  validate,
  savedMessage: 'Configuración de impuestos guardada. Aplica a los productos que se agreguen a una venta desde ahora.',
  onSaved: () => history.value?.reload(),
})

const RATES = [
  { value: 16 as const, title: '16 %', hint: 'Tasa general' },
  { value: 8 as const, title: '8 %', hint: 'Región fronteriza (estímulo)' },
]
const CATEGORIES = (Object.keys(TAX_CATEGORY_META) as TaxCategory[]).map((k) => ({
  value: k,
  title: TAX_CATEGORY_META[k].short,
  hint: TAX_CATEGORY_META[k].hint,
}))

function format(key: string, value: unknown) {
  if (key === 'generalRate') return `${String(value)}%`
  if (key === 'defaultCategory') return TAX_CATEGORY_META[value as TaxCategory]?.label ?? String(value)
  return value ? 'Sí' : 'No'
}

// ── Asignación masiva por categoría (acción, no ajuste) ────────────────────
const categoryStore = useCategoryStore()
const productStore = useProductStore()
const toast = useToast()
const bulkCategoryId = ref<number | null>(null)
const bulkTax = ref<TaxCategory>('GENERAL')
const confirmBulk = ref(false)
const applying = ref(false)

const bulkCategoryName = computed(() => categoryStore.options.find((c) => c.id === bulkCategoryId.value)?.name ?? '')

onMounted(() => void categoryStore.fetchCategoryOptions())

async function applyBulk() {
  if (!bulkCategoryId.value || applying.value) return
  applying.value = true
  try {
    const n = await productStore.setTaxCategory({ taxCategory: bulkTax.value, categoryId: bulkCategoryId.value })
    toast.success(n > 0 ? `IVA actualizado en ${n} productos de "${bulkCategoryName.value}".` : `Todos los productos de "${bulkCategoryName.value}" ya tenían ese tratamiento.`)
    confirmBulk.value = false
  } catch {
    /* el interceptor muestra el motivo */
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <SettingsPageHeader
      title="Impuestos"
      description="Tasa de IVA, con qué tratamiento nacen los productos y qué muestra el ticket. Los precios siempre se capturan y cobran con IVA incluido: el impuesto se desglosa hacia dentro."
      icon="ph:receipt-x-bold"
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

    <div v-else-if="s.snapshot.value" class="grid items-start gap-6 lg:grid-cols-2">
      <SettingsCard title="Tasa general" description="La que se aplica a los productos marcados como General." icon="ph:scales-bold" :dirty="s.isChanged('generalRate')">
        <SegmentedControl v-model="s.form.generalRate" label="IVA general" :options="RATES" />
        <p v-if="s.form.generalRate === 8" class="mt-4 flex gap-2 rounded-lg bg-warning-500/10 p-3 text-xs text-warning-800 dark:text-warning-300">
          <Icon name="ph:warning-bold" class="h-4 w-4 shrink-0" />
          El 8 % sólo aplica si la farmacia está en la región fronteriza y registrada en el padrón del estímulo del SAT. Confírmalo con tu contador antes de activarlo.
        </p>
      </SettingsCard>

      <SettingsCard title="Productos nuevos" description="Tratamiento con el que se da de alta un producto si no se indica otro." icon="ph:package-bold" :dirty="s.isChanged('defaultCategory')">
        <SegmentedControl v-model="s.form.defaultCategory" label="IVA por defecto" :options="CATEGORIES" />
      </SettingsCard>

      <SettingsCard class="lg:col-span-2" title="¿Qué lleva IVA en una farmacia?" description="Guía rápida según la Ley del IVA (art. 2o.-A). Ante la duda, consulta con tu contador." icon="ph:book-open-text-bold">
        <div class="grid gap-4 text-sm md:grid-cols-2">
          <div class="rounded-xl border border-success-500/30 bg-success-500/5 p-4">
            <p class="font-semibold text-success-800 dark:text-success-300">Tasa 0 %</p>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
              <li>Medicinas de patente</li>
              <li>Alimentos (incluida la leche)</li>
              <li>Toallas sanitarias, tampones y copas menstruales</li>
            </ul>
          </div>
          <div class="rounded-xl border border-primary-500/30 bg-primary-500/5 p-4">
            <p class="font-semibold text-primary-800 dark:text-primary-300">General (16 % / 8 %)</p>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
              <li>Perfumería, cosméticos, cuidado personal</li>
              <li>Refrescos, jugos, néctares y bebidas distintas de la leche</li>
              <li>Chicles; suplementos que no sean alimento ni medicina</li>
            </ul>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard class="lg:col-span-2" title="Asignar IVA por categoría" description="Aplica un tratamiento a todos los productos de una categoría. No cambia precios: el precio sigue siendo con IVA incluido; cambia cuánto de él es impuesto. Las ventas ya hechas conservan su tasa." icon="ph:tag-bold">
        <div class="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label for="bulkCat" class="label-base">Categoría</label>
            <select id="bulkCat" v-model="bulkCategoryId" class="input-base">
              <option :value="null" disabled>Elige una categoría…</option>
              <option v-for="c in categoryStore.options" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label for="bulkTax" class="label-base">Tratamiento</label>
            <select id="bulkTax" v-model="bulkTax" class="input-base">
              <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ TAX_CATEGORY_META[c.value].label }}</option>
            </select>
          </div>
          <button type="button" class="btn-primary" :disabled="!bulkCategoryId || applying" @click="confirmBulk = true">Aplicar</button>
        </div>
      </SettingsCard>

      <SettingsCard title="Ticket" description="Informativo: el total ya incluye el impuesto." icon="ph:receipt-bold" :dirty="s.isChanged('showBreakdownOnTicket')">
        <SettingsSwitch v-model="s.form.showBreakdownOnTicket" label="Mostrar “IVA incluido” por tasa" description="Imprime, bajo el total, cuánto IVA contiene la venta en cada tasa. Sin productos gravados no se imprime nada." :changed="s.isChanged('showBreakdownOnTicket')" />
      </SettingsCard>

      <SettingsHistory ref="history" namespace="taxes" :labels="LABELS" :format="format" />
    </div>

    <ConfirmModal
      v-if="confirmBulk"
      title="Asignar IVA por categoría"
      :message="`Todos los productos de “${bulkCategoryName}” quedarán como ${TAX_CATEGORY_META[bulkTax].label}. Afecta a las ventas que se hagan desde ahora.`"
      confirm-text="Sí, aplicar"
      cancel-text="Cancelar"
      type="warning"
      :is-loading="applying"
      @confirm="applyBulk"
      @cancel="confirmBulk = false"
    />

    <UnsavedChangesBar :visible="s.dirty.value" :saving="s.saving.value" :can-save="s.valid.value" :scopes="['la configuración de impuestos']" @save="s.save()" @discard="s.discard()" />
  </div>
</template>
