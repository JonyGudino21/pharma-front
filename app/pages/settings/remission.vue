<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSettingsForm } from '~/composables/useSettingsForm'
import { useCompanyStore } from '~/stores/company'
import type { FieldErrors, RemissionDensity, RemissionPaper, RemissionSettings } from '~/types/settings'
import { renderRemissionHtml } from '~/utils/remission-html'
import { sampleRemissionView } from '~/utils/remission-view'
import { remissionFontFaces } from '~/utils/remission-fonts'
import SettingsCard from '~/components/settings/SettingsCard.vue'
import SettingsPageHeader from '~/components/settings/SettingsPageHeader.vue'
import SettingsHistory from '~/components/settings/SettingsHistory.vue'
import SettingsSwitch from '~/components/settings/fields/SettingsSwitch.vue'
import SegmentedControl from '~/components/settings/ticket/SegmentedControl.vue'
import RemissionSheet from '~/components/receipt/RemissionSheet.vue'
import UnsavedChangesBar from '~/components/shared/UnsavedChangesBar.vue'

definePageMeta({ requiredPermission: 'canManageSettings' })

const LEGEND_MAX = 300
const TERMS_MAX = 600

const LABELS: Record<keyof RemissionSettings, string> = {
  enabled: 'Nota de remisión activada',
  paper: 'Tamaño de hoja',
  legend: 'Leyenda al pie',
  terms: 'Condiciones',
  showSignatures: 'Líneas de firma',
  showPayments: 'Forma de pago y saldo',
  showSku: 'Código del producto',
  showLot: 'Lote',
  showExpiry: 'Caducidad',
  showTaxBreakdown: 'Desglose de IVA',
  density: 'Densidad de la tabla',
  showLogo: 'Logo de la farmacia',
  showLegalName: 'Razón social',
  showRfc: 'RFC de la farmacia',
  showFiscalRegime: 'Régimen fiscal',
  showAddress: 'Domicilio de la farmacia',
  showPhone: 'Teléfono de la farmacia',
  showEmail: 'Correo de la farmacia',
}

function validate(v: RemissionSettings): FieldErrors<RemissionSettings> {
  const e: FieldErrors<RemissionSettings> = {}
  if (v.paper !== 'LETTER' && v.paper !== 'A4') e.paper = 'Elige Carta o A4.'
  if (v.legend.length > LEGEND_MAX) e.legend = `Máximo ${LEGEND_MAX} caracteres.`
  if (v.terms.length > TERMS_MAX) e.terms = `Máximo ${TERMS_MAX} caracteres.`
  return e
}

const history = ref<InstanceType<typeof SettingsHistory> | null>(null)
const s = useSettingsForm('remission', {
  validate,
  savedMessage: 'Configuración de la nota de remisión guardada. Aplica a las notas que se impriman desde ahora.',
  onSaved: () => history.value?.reload(),
})

const companyStore = useCompanyStore()
onMounted(() => void companyStore.ensureProfile().catch(() => null))

const PAPERS = [
  { value: 'LETTER' as RemissionPaper, title: 'Carta', hint: '8.5 × 11 in (México)' },
  { value: 'A4' as RemissionPaper, title: 'A4', hint: '210 × 297 mm' },
]

const DENSITIES = [
  { value: 'AUTO' as RemissionDensity, title: 'Automática', hint: 'Recomendada' },
  { value: 'COMFORTABLE' as RemissionDensity, title: 'Cómoda', hint: 'Letra amplia' },
  { value: 'COMPACT' as RemissionDensity, title: 'Compacta', hint: 'Más por hoja' },
]

/** La vista previa puede simular una nota corta o un pedido grande. */
const sampleLines = ref<3 | 30>(3)

const CONTENT_KEYS: Array<keyof RemissionSettings> = ['showSignatures', 'showPayments', 'showTaxBreakdown', 'density']
const DETAIL_KEYS: Array<keyof RemissionSettings> = ['showSku', 'showLot', 'showExpiry']
const detailDirty = computed(() => DETAIL_KEYS.some((k) => s.isChanged(k)))
const contentDirty = computed(() => CONTENT_KEYS.some((k) => s.isChanged(k)))

/*
 * Datos de la farmacia en el encabezado. Aquí sólo se decide si salen; el dato
 * se edita en la ficha (Ticket). Cada interruptor avisa cuando la ficha no tiene
 * ese dato: encendido pero vacío no imprime nada, y sin el aviso parecería un error.
 */
type CompanyKey = 'showLogo' | 'showLegalName' | 'showRfc' | 'showFiscalRegime' | 'showAddress' | 'showPhone' | 'showEmail'
const COMPANY_FIELDS: Array<{ key: CompanyKey; label: string; description: string; hasValue: () => boolean }> = [
  {
    key: 'showLogo',
    label: 'Logo',
    description: 'Tu logo, o la marca de PharmaPOS si no tienes uno. Apagado, el nombre ocupa su lugar.',
    hasValue: () => true,
  },
  {
    key: 'showLegalName',
    label: 'Razón social',
    description: 'Bajo el nombre comercial, sólo si es distinta de él.',
    hasValue: () => !!companyStore.company?.legalName,
  },
  { key: 'showRfc', label: 'RFC', description: 'Lo piden clínicas y empresas para su control de compras.', hasValue: () => !!companyStore.company?.rfc },
  {
    key: 'showFiscalRegime',
    label: 'Régimen fiscal',
    description: 'Como lo capturaste en la ficha, p. ej. «Régimen: 612 · Personas Físicas con Actividades Empresariales».',
    hasValue: () => !!companyStore.company?.fiscalRegime?.trim(),
  },
  { key: 'showAddress', label: 'Domicilio', description: 'Dirección de la farmacia.', hasValue: () => !!companyStore.company?.address },
  { key: 'showPhone', label: 'Teléfono', description: 'Para que el cliente pueda llamar.', hasValue: () => !!companyStore.company?.phone },
  { key: 'showEmail', label: 'Correo', description: 'Va junto al teléfono, en el mismo renglón.', hasValue: () => !!companyStore.company?.email },
]
const companyDirty = computed(() => COMPANY_FIELDS.some((f) => s.isChanged(f.key)))

/** La vista previa usa lo que está en el formulario, guardado o no: sirve para decidir. */
const previewHtml = computed(() =>
  s.snapshot.value
    ? renderRemissionHtml(sampleRemissionView(sampleLines.value), companyStore.company, { ...s.form }, { title: 'Vista previa', fontFaces: remissionFontFaces() })
    : '',
)

function format(key: string, value: unknown) {
  if (key === 'paper') return value === 'A4' ? 'A4' : 'Carta'
  if (key === 'density') return DENSITIES.find((d) => d.value === value)?.title ?? String(value)
  if (key === 'legend' || key === 'terms') {
    const text = String(value ?? '')
    return text ? `“${text.slice(0, 60)}${text.length > 60 ? '…' : ''}”` : '(vacío)'
  }
  return value ? 'Sí' : 'No'
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <SettingsPageHeader
      title="Nota de remisión"
      description="Documento en hoja completa con los datos de la farmacia y del cliente, el listado de productos y el total con letra. No es una factura (CFDI): sirve para entregas a clientes, empresas y crédito."
      icon="ph:file-text-bold"
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

    <div v-else-if="s.snapshot.value" class="grid items-start gap-4 sm:gap-6 [&>*]:min-w-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <div class="space-y-6">
        <SettingsCard title="Documento" description="Si la apagas, el botón desaparece del punto de venta y del historial." icon="ph:file-text-bold" :dirty="s.isChanged('enabled') || s.isChanged('paper')">
          <div class="space-y-5">
            <SettingsSwitch v-model="s.form.enabled" label="Permitir imprimir notas de remisión" description="Cajeros y gerentes con permiso de impresión podrán emitirla desde una venta cobrada." :changed="s.isChanged('enabled')" />
            <SegmentedControl v-model="s.form.paper" label="Tamaño de hoja" :options="PAPERS" />
          </div>
        </SettingsCard>

        <SettingsCard title="Contenido" description="Qué lleva la hoja además de las partidas y el total." icon="ph:list-checks-bold" :dirty="contentDirty">
          <div class="space-y-5">
            <SettingsSwitch v-model="s.form.showPayments" label="Forma de pago, pagado y saldo" description="Imprescindible para ventas a crédito: el cliente ve cuánto debe." :changed="s.isChanged('showPayments')" />
            <SettingsSwitch v-model="s.form.showSignatures" label="Líneas de firma" description="“Entregó” y “Recibí de conformidad”, para que quede constancia de la entrega." :changed="s.isChanged('showSignatures')" />
            <SettingsSwitch v-model="s.form.showTaxBreakdown" label="Desglose de IVA incluido" description="Muestra, bajo el total, cuánto IVA contiene la venta en cada tasa. Los precios ya lo incluyen." :changed="s.isChanged('showTaxBreakdown')" />
            <div>
              <SegmentedControl v-model="s.form.density" label="Densidad de la tabla de productos" :options="DENSITIES" />
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Automática: renglones amplios hasta 7 productos (caben en una hoja); con más, renglones de una línea: unos 22 productos caben en una sola hoja con totales y firmas, y un pedido de 50 ocupa 2 hojas en lugar de 4. Cambia el ejemplo de la vista previa a 30 productos para verla.
              </p>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Datos de la farmacia en la nota" description="Qué datos de tu farmacia salen en el encabezado. El nombre siempre se imprime." icon="ph:storefront-bold" :dirty="companyDirty">
          <div class="space-y-5">
            <SettingsSwitch
              v-for="f in COMPANY_FIELDS"
              :key="f.key"
              v-model="s.form[f.key]"
              :label="f.label"
              :description="companyStore.company && !f.hasValue() ? `${f.description} Tu ficha no lo tiene: no se imprimirá.` : f.description"
              :changed="s.isChanged(f.key)"
            />
            <p class="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
              Los datos se editan en
              <NuxtLink to="/settings/ticket" class="font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400">Configuración › Ticket › Datos de la farmacia</NuxtLink>.
              Aquí sólo eliges si aparecen en la nota.
            </p>
          </div>
        </SettingsCard>

        <SettingsCard title="Detalle de cada producto" description="Qué aparece bajo el nombre de cada producto. El nombre, la cantidad y el precio siempre se imprimen." icon="ph:list-magnifying-glass-bold" :dirty="detailDirty">
          <div class="space-y-5">
            <SettingsSwitch v-model="s.form.showSku" label="Código del producto" description="El SKU, útil para que el cliente concilie con su inventario." :changed="s.isChanged('showSku')" />
            <SettingsSwitch v-model="s.form.showLot" label="Lote" description="Número de lote del laboratorio. Sirve si hay un retiro de producto o si el cliente lleva trazabilidad." :changed="s.isChanged('showLot')" />
            <SettingsSwitch v-model="s.form.showExpiry" label="Caducidad" description="Mes y año de caducidad de cada lote. Apágalo si prefieres no mostrarla al cliente: el sistema la sigue usando para vender primero lo que caduca antes." :changed="s.isChanged('showExpiry')" />
            <p v-if="!s.form.showSku && !s.form.showLot && !s.form.showExpiry" class="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
              Cada producto mostrará sólo su nombre: una nota más limpia y compacta.
            </p>
          </div>
        </SettingsCard>

        <SettingsCard title="Textos" description="Se imprimen tal cual, al pie de la hoja." icon="ph:text-aa-bold" :dirty="s.isChanged('legend') || s.isChanged('terms')">
          <div class="space-y-5">
            <div>
              <label for="legend" class="label-base">Leyenda</label>
              <textarea id="legend" v-model="s.form.legend" rows="2" class="input-base" :aria-invalid="!!s.errors.value.legend" />
              <p class="mt-1 flex justify-between gap-3 text-xs" :class="s.errors.value.legend ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'">
                <span>{{ s.errors.value.legend || 'Por defecto aclara que no es un CFDI: déjala así salvo que tu contador indique otra cosa.' }}</span>
                <span class="tabular-nums">{{ s.form.legend.length }}/{{ LEGEND_MAX }}</span>
              </p>
            </div>
            <div>
              <label for="terms" class="label-base">Condiciones (opcional)</label>
              <textarea id="terms" v-model="s.form.terms" rows="3" class="input-base" placeholder="Ej.: Cambios y devoluciones dentro de 7 días con esta nota." :aria-invalid="!!s.errors.value.terms" />
              <p class="mt-1 flex justify-between gap-3 text-xs" :class="s.errors.value.terms ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'">
                <span>{{ s.errors.value.terms || 'Vacío = no se imprime.' }}</span>
                <span class="tabular-nums">{{ s.form.terms.length }}/{{ TERMS_MAX }}</span>
              </p>
            </div>
          </div>
        </SettingsCard>

        <SettingsHistory ref="history" namespace="remission" :labels="LABELS" :format="format" />
      </div>

      <SettingsCard class="xl:sticky xl:top-20" title="Vista previa" description="Venta de ejemplo con tu ficha de farmacia y lo que tienes en pantalla, guardado o no." icon="ph:eye-bold">
        <div class="mb-3 flex items-center justify-between gap-3">
          <span class="text-xs text-gray-500 dark:text-gray-400">Ejemplo:</span>
          <div class="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs dark:border-gray-600" role="group" aria-label="Tamaño del ejemplo">
            <button v-for="n in [3, 30] as const" :key="n" type="button" class="rounded-md px-3 py-1.5 font-medium transition-colors sm:py-1" :class="sampleLines === n ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'" :aria-pressed="sampleLines === n" @click="sampleLines = n">
              {{ n }} productos
            </button>
          </div>
        </div>
        <RemissionSheet :html="previewHtml" :paper="s.form.paper" />
        <p v-if="!companyStore.company" class="mt-3 text-xs text-warning-700 dark:text-warning-300">
          Falta la ficha de la farmacia: captúrala en Configuración › Ticket para que aparezca en el encabezado.
        </p>
      </SettingsCard>
    </div>

    <UnsavedChangesBar :visible="s.dirty.value" :saving="s.saving.value" :can-save="s.valid.value" :scopes="['la configuración de la nota de remisión']" @save="s.save()" @discard="s.discard()" />
  </div>
</template>
