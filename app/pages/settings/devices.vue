<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useTerminal, type TerminalProfile } from '~/composables/useTerminal'
import { usePrinterDevice, bindingOf, webUsbAvailable } from '~/composables/usePrinterDevice'
import { useReceiptPrint } from '~/composables/useReceiptPrint'
import { useCashDrawer } from '~/composables/useCashDrawer'
import { useCompanyStore } from '~/stores/company'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'
import type { ReceiptSaleView } from '~/types/receipt'
import SettingsCard from '~/components/settings/SettingsCard.vue'
import SettingsSwitch from '~/components/settings/fields/SettingsSwitch.vue'
import SegmentedControl from '~/components/settings/ticket/SegmentedControl.vue'
import UnsavedChangesBar from '~/components/shared/UnsavedChangesBar.vue'
import { useUpdateHold } from '~/composables/useAppUpdate'

definePageMeta({ requiredPermission: 'canManageSettings' })

/**
 * DISPOSITIVOS DE ESTA CAJA.
 *
 * A diferencia de las demás secciones, esto se guarda en ESTA computadora
 * (la impresora y el cajón están conectados a ella). Hay que configurarlo en
 * cada caja.
 */
const { profile, save: saveProfile } = useTerminal()
const device = usePrinterDevice()
const { printTest, isPrinting } = useReceiptPrint()
const drawer = useCashDrawer()
const companyStore = useCompanyStore()
const auth = useAuthStore()
const toast = useToast()

const form = reactive<TerminalProfile>({ ...profile.value, printer: profile.value.printer ? { ...profile.value.printer } : null })
const baseline = ref(JSON.stringify(profile.value))
const dirty = computed(() => JSON.stringify(form) !== baseline.value)

// Cambios sin guardar: no se ofrece recargar para actualizar (ADR-0018).
useUpdateHold('settings:devices', () => (dirty.value ? 'Tienes cambios sin guardar en los dispositivos de esta caja.' : null))
const usb = ref(false)
const pairing = ref(false)

onMounted(() => {
  usb.value = webUsbAvailable()
  window.addEventListener('beforeunload', beforeUnload)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

function beforeUnload(e: BeforeUnloadEvent) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = ''
}
onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('Tienes cambios sin guardar. ¿Salir y descartarlos?')) return false
})

const MODES = [
  { value: 'thermal' as const, title: 'Térmica USB', hint: 'Rápida, con cajón' },
  { value: 'browser' as const, title: 'Navegador', hint: 'Cualquier impresora' },
]
const PINS = [
  { value: 0 as const, title: 'Pin 2', hint: 'La mayoría' },
  { value: 1 as const, title: 'Pin 5', hint: 'Algunos modelos' },
]

function save() {
  if (!dirty.value) return
  if (!form.name.trim()) {
    toast.warning('Ponle nombre a esta caja: aparece en la bitácora del cajón.')
    return
  }
  // Sin térmica no hay impresión automática ni cajón: se apagan para que el
  // perfil no prometa algo que no puede hacer.
  if (form.printMode === 'browser') {
    form.autoPrint = false
    form.openDrawerOnCash = false
  }
  if (saveProfile({ ...form })) {
    baseline.value = JSON.stringify(profile.value)
    Object.assign(form, profile.value)
    toast.success('Configuración de esta caja guardada.')
  } else {
    toast.error('Este navegador no permite guardar la configuración (almacenamiento bloqueado).')
  }
}
function discard() {
  Object.assign(form, JSON.parse(baseline.value) as TerminalProfile)
}
useKeyboardShortcuts({ 'ctrl+s': () => save(), 'meta+s': () => save() })

async function pair() {
  pairing.value = true
  try {
    const d = await device.requestPrinter()
    if (d) {
      form.printer = bindingOf(d)
      toast.info(`Impresora elegida: ${form.printer.label}. Guarda para usarla en esta caja.`)
    }
  } finally {
    pairing.value = false
  }
}

async function unpair() {
  if (form.printer) await device.forgetPrinter(form.printer).catch(() => undefined)
  form.printer = null
}

const muestra: ReceiptSaleView = {
  id: null,
  invoiceNumber: 'PRUEBA',
  createdAt: new Date().toISOString(),
  flowStatus: 'COMPLETED',
  items: [{ quantity: 1, name: 'Prueba de impresión: acentos áéíóú ñ', unitPrice: 10, subtotal: 10 }],
  subtotal: 10,
  total: 10,
  paidAmount: 10,
  balance: 0,
  payments: [{ method: 'Efectivo', amount: 10 }],
  clientName: 'Público General',
  clientRfc: null,
  cashierName: null,
  note: null,
  copyNumber: 0,
}

async function testPrint() {
  if (dirty.value) {
    toast.warning('Guarda primero: la prueba usa la configuración guardada de esta caja.')
    return
  }
  const cp = await companyStore.ensureProfile()
  if (!cp.company || !cp.defaultTemplate) {
    toast.error('Falta configurar la ficha de la farmacia y la plantilla del ticket.')
    return
  }
  await printTest({ sale: muestra, company: cp.company, template: cp.defaultTemplate })
}

const canOpenDrawer = computed(() => auth.can('canWithdrawCash'))
async function testDrawer() {
  if (dirty.value) {
    toast.warning('Guarda primero: la prueba usa la configuración guardada de esta caja.')
    return
  }
  try {
    const r = await drawer.openWithAudit('TEST', 'Prueba desde Configuración › Dispositivos')
    if (r === 'opened') toast.success('Pulso enviado. Si el cajón no abrió, prueba con el otro pin.')
    else toast.warning('No se encontró la impresora de esta caja. Emparéjala primero.')
  } catch {
    /* el interceptor ya explicó por qué no se registró; el cajón NO se abrió */
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h1 class="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
        <Icon name="ph:printer-bold" class="text-primary-600" /> Dispositivos de esta caja
      </h1>
      <p class="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Impresora y cajón conectados a <strong>esta computadora</strong>. Se guarda aquí, no en el servidor: configúralo en cada caja.
      </p>
    </div>

    <div class="grid items-start gap-6 lg:grid-cols-2">
      <SettingsCard title="Esta caja" description="Cómo se llama en la bitácora del cajón." icon="ph:desktop-tower-bold">
        <label for="termName" class="label-base">Nombre</label>
        <input id="termName" v-model="form.name" type="text" maxlength="60" class="input-base" placeholder="Caja 1" />
      </SettingsCard>

      <SettingsCard title="Impresora" description="Por dónde sale el ticket." icon="ph:printer-bold">
        <SegmentedControl v-model="form.printMode" label="Impresión" :options="MODES" />

        <template v-if="form.printMode === 'thermal'">
          <p v-if="!usb" class="mt-4 rounded-lg bg-warning-500/10 p-3 text-xs text-warning-800 dark:text-warning-300" role="alert">
            Este navegador no permite conectar impresoras USB. Usa Chrome o Edge actualizados, o cambia a impresión por navegador.
          </p>
          <div v-else class="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-700">
            <Icon :name="form.printer ? 'ph:check-circle-fill' : 'ph:plugs'" class="h-6 w-6" :class="form.printer ? 'text-success-500' : 'text-gray-400'" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ form.printer?.label ?? 'Sin impresora emparejada' }}</p>
              <p class="text-xs text-gray-500">{{ form.printer ? `USB ${form.printer.vendorId.toString(16)}:${form.printer.productId.toString(16)}${form.printer.serialNumber ? ' · serie ' + form.printer.serialNumber : ''}` : 'Elige la térmica conectada a esta computadora.' }}</p>
            </div>
            <button type="button" class="btn-secondary text-sm" :disabled="pairing" @click="pair">{{ form.printer ? 'Cambiar' : 'Emparejar' }}</button>
            <button v-if="form.printer" type="button" class="rounded-lg px-2 py-1 text-sm text-error-600 hover:bg-error-500/10" @click="unpair">Olvidar</button>
          </div>
        </template>
        <p v-else class="mt-4 text-xs text-gray-500 dark:text-gray-400">Se abrirá el diálogo de impresión del navegador en cada ticket. Sin impresión automática ni apertura de cajón.</p>

        <div class="mt-4 flex justify-end">
          <button type="button" class="btn-secondary gap-2 text-sm" :disabled="isPrinting" @click="testPrint">
            <Icon name="ph:printer" /> Imprimir prueba
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Al cobrar" description="Lo que hace esta caja sola al terminar una venta." icon="ph:lightning-bold">
        <div class="space-y-5">
          <SettingsSwitch v-model="form.autoPrint" label="Imprimir el ticket automáticamente" :description="form.printMode === 'thermal' ? 'Sale el ticket original al cobrar, sin pulsar Imprimir.' : 'Requiere impresora térmica USB.'" />
          <SettingsSwitch v-model="form.openDrawerOnCash" label="Abrir el cajón en cobros con efectivo" :description="form.printMode === 'thermal' ? 'Cajón conectado a la impresora (RJ-11). No se abre con tarjeta ni transferencia.' : 'Requiere impresora térmica USB.'" />
        </div>
      </SettingsCard>

      <SettingsCard title="Cajón de dinero" description="Conector del cajón en la impresora." icon="ph:vault-bold">
        <SegmentedControl v-model="form.drawerPin" label="Conector" :options="PINS" />
        <div class="mt-4 flex items-center justify-between gap-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Abrir el cajón sin venta queda registrado con tu nombre y esta caja.</p>
          <button v-if="canOpenDrawer" type="button" class="btn-secondary shrink-0 text-sm" :disabled="drawer.opening.value || form.printMode !== 'thermal'" @click="testDrawer">Probar cajón</button>
        </div>
      </SettingsCard>
    </div>

    <UnsavedChangesBar :visible="dirty" :saving="false" :can-save="true" :scopes="['los dispositivos de esta caja']" @save="save" @discard="discard" />
  </div>
</template>
