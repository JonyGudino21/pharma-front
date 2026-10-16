<template>
  <div class="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
    <div class="page-header">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:cash-register-bold" class="text-primary-600" /> Mi Turno de Caja
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Control de dinero en efectivo de tu sesión actual.</p>
      </div>
      
      <div v-if="authStore.can('canViewAllShifts')" class="page-actions">
        <NuxtLink
          to="/cash-shifts/history"
          class="btn-secondary text-sm"
        >
          <Icon name="ph:list-dashes-bold" class="mr-2" /> Ver Historial
        </NuxtLink>
      </div>
    </div>

    <!--
      No sabemos si hay turno ≠ no hay turno. Antes un error de red caía en la
      rama "Caja cerrada" y ofrecía abrir OTRA caja.
    -->
    <div v-if="store.currentShiftError && !store.currentShift" class="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-sm border border-error-500/40 text-center" role="alert">
      <Icon name="ph:cloud-slash-fill" class="w-10 h-10 mx-auto text-error-500" />
      <h2 class="mt-2 text-lg font-bold text-gray-900 dark:text-white">No pudimos consultar tu turno</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ store.currentShiftError.mensaje }} No abras otra caja hasta confirmar si ya tienes una.</p>
      <button type="button" class="mt-4 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700" @click="store.fetchCurrentShift()">
        <Icon name="ph:arrow-clockwise-bold" /> Reintentar
      </button>
    </div>

    <div v-else-if="!store.currentShift" class="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
      <div class="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-100 dark:border-gray-700">
        <Icon name="ph:lock-key-bold" class="w-10 h-10 text-gray-400" />
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Caja Cerrada</h2>
      <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 sm:mb-8">
        No tienes un turno activo. Abre tu caja declarando el monto inicial (fondo o morralla) para poder recibir pagos en efectivo.
      </p>

      <form @submit.prevent="handleOpenShift" class="max-w-xs mx-auto space-y-4 text-left">
        <div>
          <label class="label-base text-center block">Monto Inicial en Caja *</label>
          <div class="relative">
            <Icon name="ph:currency-dollar-bold" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input v-model.number="openForm.initialAmount" type="number" inputmode="decimal" step="0.01" min="0" required class="input-base pl-10 text-xl font-bold text-center h-14" placeholder="0.00" aria-describedby="fondoSugerido" />
          </div>
          <p v-if="suggestedFloat > 0" id="fondoSugerido" class="mt-1.5 text-center text-xs text-gray-500 dark:text-gray-400">
            Fondo sugerido por gerencia: {{ formatCurrency(suggestedFloat) }}. Confírmalo contando el dinero.
          </p>
        </div>
        <div>
          <input v-model="openForm.notes" type="text" class="input-base text-sm text-center dark:bg-gray-800 bg-gray-50" placeholder="Notas (Ej. Cambio en monedas)" />
        </div>
        <button type="submit" :disabled="store.isActionLoading" class="btn-primary w-full h-12 text-lg">
          <Icon v-if="store.isActionLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          <Icon v-else name="ph:lock-key-open-bold" class="mr-2" /> Abrir Caja
        </button>
      </form>
    </div>

    <div v-else class="space-y-6">
      <div class="bg-linear-to-br from-primary-600 to-primary-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <Icon name="ph:cash-register-duotone" class="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />

        <div class="relative z-10 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div class="min-w-0">
            <span class="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold tracking-widest mb-3 inline-block">
              Turno Abierto
            </span>
            <p class="text-2xl sm:text-3xl font-black mb-1">Caja Activa</p>
            <p class="text-primary-100 flex items-center gap-2 text-sm">
              <Icon name="ph:clock-bold" class="shrink-0" /> Abierta desde: {{ formatDateTime(store.currentShift.openedAt) }}
            </p>
          </div>
          <div class="sm:text-right">
            <p class="text-primary-200 text-sm font-bold uppercase tracking-wider mb-1">Monto Inicial</p>
            <p class="text-2xl font-bold">{{ formatCurrency(Number(store.currentShift.initialAmount)) }}</p>
          </div>
        </div>
      </div>

      <!-- Límite de efectivo (Configuración › Caja) -->
      <div
        v-if="store.currentShift.drawer?.overLimit"
        class="flex items-start gap-3 rounded-2xl border border-warning-500/40 bg-warning-500/10 p-4 text-sm text-warning-800 dark:text-warning-300"
        role="status"
      >
        <Icon name="ph:warning-bold" class="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p class="font-semibold">Hay más efectivo en caja del recomendado ({{ formatCurrency(store.currentShift.drawer.limit) }}).</p>
          <p class="mt-0.5">
            {{ authStore.can('canWithdrawCash') ? 'Registra un retiro (sangría) abajo para reducir el efectivo expuesto.' : 'Pide a gerencia que haga un retiro (sangría).' }}
          </p>
        </div>
      </div>

      <div
        v-if="store.currentShift.drawer && store.currentShift.drawer.cashOnHand !== null"
        class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl border border-gray-100 bg-white px-4 py-4 sm:px-6 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <span class="text-gray-500 dark:text-gray-400">Efectivo estimado en caja <span class="text-xs">(sólo gerencia)</span></span>
        <span class="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(Number(store.currentShift.drawer.cashOnHand)) }}</span>
      </div>

      <div v-if="authStore.can('canWithdrawCash')" class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon name="ph:hand-coins-bold" class="text-gray-400" /> Operaciones Manuales (Manager)
        </h3>
        
        <form @submit.prevent="handleRegisterOperation" class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div class="md:col-span-3">
            <label class="label-base text-xs">Tipo de Movimiento</label>
            <select v-model="operationForm.type" required class="input-base text-sm py-2">
              <option value="MANUAL_WITHDRAW">Sangría (Retiro)</option>
              <option value="EXPENSE">Gasto (Pago Servicios)</option>
              <option value="MANUAL_ADD">Ingreso Manual</option>
            </select>
          </div>
          <div class="md:col-span-3">
            <label class="label-base text-xs">Monto *</label>
            <div class="flex items-center gap-2">
              <span class="text-gray-500 text-base pl-2 pr-1">$</span>
              <input v-model.number="operationForm.amount" type="number" inputmode="decimal" step="0.01" min="0.01" required class="input-base text-sm py-2 flex-1" placeholder="0.00" />
            </div>
   
          </div>
          <div class="md:col-span-4">
            <label class="label-base text-xs">Motivo (Justificación) *</label>
            <input v-model="operationForm.reason" type="text" required class="input-base text-sm py-2" placeholder="Ej: Depósito bancario" />
          </div>
          <div class="md:col-span-2 flex items-end">
            <button type="submit" :disabled="store.isActionLoading" class="btn-secondary w-full py-2.5 md:py-2">
              <Icon v-if="store.isActionLoading" name="ph:spinner-gap-bold" class="animate-spin" />
              <span v-else>Registrar</span>
            </button>
          </div>
        </form>

        <!-- Apertura del cajón SIN venta: siempre con motivo y auditada -->
        <form class="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-gray-700 md:flex-row md:items-end" @submit.prevent="handleOpenDrawer">
          <div class="flex-1">
            <label for="drawerReason" class="label-base text-xs">Abrir cajón sin venta · motivo *</label>
            <input id="drawerReason" v-model="drawerReason" type="text" maxlength="200" class="input-base text-sm py-2" placeholder="Ej. cambio para cliente, revisión de billetes" />
          </div>
          <button type="submit" class="btn-secondary py-2.5 md:py-2 md:w-48" :disabled="drawer.opening.value || drawerReason.trim().length < 3">
            <Icon :name="drawer.opening.value ? 'ph:spinner-gap-bold' : 'ph:vault-bold'" :class="drawer.opening.value ? 'animate-spin' : ''" class="mr-2" /> Abrir cajón
          </button>
        </form>
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Queda registrado con tu nombre, la hora y esta caja. Gerencia lo ve en el detalle del turno.</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-error-100 dark:border-error-900/30">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Icon name="ph:lock-key-bold" class="text-error-500" /> Cierre de Turno (Arqueo Ciego)
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          <template v-if="store.currentShift.drawer?.blindClose && !authStore.can('canViewAllShifts')">
            Cuenta el dinero físico que hay en tu gaveta e ingrésalo. Al terminar sólo verás lo que contaste: gerencia revisa el arqueo.
          </template>
          <template v-else>
            Cuenta el dinero físico que hay en tu gaveta e ingrésalo. El sistema calculará automáticamente si falta o sobra dinero respecto a las ventas del día.
          </template>
        </p>

        <form @submit.prevent="handleCloseShift" class="max-w-sm mx-auto space-y-4">
          <div>
            <label class="label-base text-center block text-error-600 dark:text-error-400 font-bold">Total Físico Contado *</label>
            <div class="relative">
              <Icon name="ph:currency-dollar-bold" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input v-model.number="closeForm.realAmount" type="number" inputmode="decimal" step="0.01" min="0" required class="input-base pl-10 text-2xl font-black text-center h-16 border-gray-300 dark:border-gray-600 focus:border-error-500 focus:ring-error-500" placeholder="0.00" />
            </div>
          </div>
          <div>
            <textarea v-model="closeForm.notes" rows="2" class="input-base text-sm resize-none dark:bg-gray-800 bg-gray-50" placeholder="Notas de cierre (Opcional)..."></textarea>
          </div>
          <button type="submit" :disabled="store.isActionLoading" class="btn-primary w-full h-12 bg-error-600 hover:bg-error-700 focus:ring-error-500 text-lg">
            <Icon v-if="store.isActionLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
            <Icon v-else name="ph:flag-checkered-bold" class="mr-2" /> Realizar Corte de Caja
          </button>
        </form>
      </div>
    </div>

    <!-- Cierre ciego: el cajero sólo ve lo que contó -->
    <div v-if="blindSummary" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="corteCiegoTitulo">
      <div class="modal-panel sm:max-w-sm text-center">
        <div class="shrink-0 bg-primary-600 p-6 text-white">
          <Icon name="ph:check-circle-bold" class="w-16 h-16 mx-auto mb-2" />
          <h2 id="corteCiegoTitulo" class="text-2xl font-black">Corte registrado</h2>
          <p class="text-sm opacity-90">Gerencia revisará el arqueo.</p>
        </div>
        <div class="modal-body space-y-3 text-sm text-left">
          <div class="flex justify-between">
            <span class="text-gray-500">Monto inicial</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(Number(blindSummary.initial)) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-bold text-gray-700 dark:text-gray-300">Tú declaraste</span>
            <span class="font-black text-gray-900 dark:text-white">{{ formatCurrency(Number(blindSummary.real)) }}</span>
          </div>
        </div>
        <div class="modal-footer bg-gray-50 dark:bg-gray-900/50">
          <button @click="closeSummaryModal" class="btn-primary w-full py-2.5">Aceptar y salir</button>
        </div>
      </div>
    </div>

    <div v-if="closureSummary" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="corteTitulo">
      <div class="modal-panel sm:max-w-sm text-center">
        <div :class="closureSummary.status === 'AUDIT_REQUIRED' ? 'bg-error-500' : 'bg-success-500'" class="shrink-0 p-6 text-white">
          <Icon :name="closureSummary.status === 'AUDIT_REQUIRED' ? 'ph:warning-circle-bold' : 'ph:check-circle-bold'" class="w-16 h-16 mx-auto mb-2" />
          <h2 id="corteTitulo" class="text-2xl font-black">Corte Finalizado</h2>
          <p class="text-sm opacity-90">{{ closureSummary.status === 'AUDIT_REQUIRED' ? 'Diferencia fuera de tolerancia' : 'Caja Cuadrada' }}</p>
        </div>
        
        <div class="modal-body space-y-3 text-sm text-left">
          <div class="flex justify-between">
            <span class="text-gray-500">Monto Inicial</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(Number(closureSummary.initial)) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Ventas en Efectivo</span>
            <span class="font-bold text-success-600">+ {{ formatCurrency(Number(closureSummary.salesCash)) }}</span>
          </div>
          <div v-if="Number(closureSummary.manualIngress) > 0" class="flex justify-between">
            <span class="text-gray-500">Ingresos Manuales</span>
            <span class="font-bold text-success-600">+ {{ formatCurrency(Number(closureSummary.manualIngress)) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Salidas / Sangrías</span>
            <span class="font-bold text-error-600">- {{ formatCurrency(Number(closureSummary.withdrawals)) }}</span>
          </div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-2 flex justify-between">
            <span class="font-bold text-gray-700 dark:text-gray-300">Sistema Esperaba</span>
            <span class="font-black text-gray-900 dark:text-white">{{ formatCurrency(Number(closureSummary.expected)) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-bold text-gray-700 dark:text-gray-300">Tú Declaraste</span>
            <span class="font-black text-gray-900 dark:text-white">{{ formatCurrency(Number(closureSummary.real)) }}</span>
          </div>
          
          <div class="mt-4 p-3 rounded-xl border" :class="Number(closureSummary.difference) < 0 ? 'bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800/40' : Number(closureSummary.difference) > 0 ? 'bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-800/40' : 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800/40'">
            <div class="flex justify-between items-center font-black">
              <span :class="Number(closureSummary.difference) < 0 ? 'text-error-700' : Number(closureSummary.difference) > 0 ? 'text-warning-700' : 'text-success-700'">
                Diferencia:
              </span>
              <span :class="Number(closureSummary.difference) < 0 ? 'text-error-700' : Number(closureSummary.difference) > 0 ? 'text-warning-700' : 'text-success-700'">
                {{ Number(closureSummary.difference) > 0 ? '+' : '' }}{{ formatCurrency(Number(closureSummary.difference)) }}
              </span>
            </div>
            <p v-if="Number(closureSummary.difference) < 0" class="text-xs text-error-600 mt-1">Faltante detectado.</p>
            <p v-if="Number(closureSummary.difference) > 0" class="text-xs text-warning-600 mt-1">Sobrante detectado.</p>
          </div>
        </div>
        
        <div class="modal-footer bg-gray-50 dark:bg-gray-900/50">
          <button @click="closeSummaryModal" class="btn-primary w-full py-2.5">Aceptar y Salir</button>
        </div>
      </div>
    </div>

  </div>

  <ConfirmModal
      v-if="showConfirmClose"
      title="Corte de Caja"
      message="¿Estás 100% seguro de realizar el corte? Asegúrate de haber contado bien las monedas y billetes."
      confirmText="Sí, Realizar Corte"
      cancelText="Revisar de nuevo"
      type="warning"
      :isLoading="store.isActionLoading"
      @confirm="executeCloseShift"
      @cancel="showConfirmClose = false"
    />
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { useCashShiftStore, type CashTransactionType, type CloseShiftSummary } from '~/stores/cashShift'
import { useSettingsStore } from '~/stores/settings'
import { useCashDrawer } from '~/composables/useCashDrawer'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import { useToast } from '~/composables/useToast'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'

definePageMeta({ requiredPermission: 'canOpenShift' })

const store = useCashShiftStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()
const toast = useToast()
const showConfirmClose = ref(false)

const openForm = reactive({ initialAmount: '', notes: '' })
const closeForm = reactive({ realAmount: '', notes: '' })
const operationForm = reactive({ type: 'MANUAL_WITHDRAW' as CashTransactionType, amount: '', reason: '' })

const closureSummary = ref<CloseShiftSummary | null>(null)
const blindSummary = ref<{ initial: string | number; real: string | number } | null>(null)

const settingsStore = useSettingsStore()
const suggestedFloat = computed(() => settingsStore.valuesOf('cash')?.suggestedOpeningFloat ?? 0)

onMounted(async () => {
  // En paralelo: la configuración sólo aporta la sugerencia del fondo; si
  // falla, la caja se abre igual, sin sugerencia.
  const [, cash] = await Promise.all([
    store.fetchCurrentShift(),
    settingsStore.fetch('cash').catch(() => null),
  ])
  // Se PROPONE, no se impone: sólo si el campo está vacío y no hay turno.
  if (!store.currentShift && cash && cash.values.suggestedOpeningFloat > 0 && openForm.initialAmount === '') {
    openForm.initialAmount = String(cash.values.suggestedOpeningFloat)
  }
})

const handleOpenShift = async () => {
  if (openForm.initialAmount === '' || Number(openForm.initialAmount) < 0) return
  // Si el servidor rechaza (p. ej. ya hay un turno abierto), el interceptor
  // muestra el motivo; aquí sólo se evita anunciar un éxito que no ocurrió y
  // dejar una promesa rechazada sin atender.
  try {
    await store.openShift({
      initialAmount: Number(openForm.initialAmount),
      notes: openForm.notes.trim() || undefined
    })
  } catch {
    return
  }
  toast.success('Turno de caja abierto exitosamente.')
  openForm.initialAmount = ''
  openForm.notes = ''
}

const handleRegisterOperation = async () => {
  if (operationForm.amount === '' || Number(operationForm.amount) <= 0 || !operationForm.reason.trim()) return
  try {
    await store.registerOperation({
      type: operationForm.type,
      amount: Number(operationForm.amount),
      reason: operationForm.reason.trim()
    })
  } catch {
    return
  }
  toast.success('Operación registrada exitosamente.')
  operationForm.amount = ''
  operationForm.reason = ''
}

const handleCloseShift = () => {
  if (closeForm.realAmount === '' || Number(closeForm.realAmount) < 0) return
  showConfirmClose.value = true
}

const executeCloseShift = async () => {
  const result = await store.closeShift({
    realAmount: Number(closeForm.realAmount),
    notes: closeForm.notes.trim() || undefined
  })

  if (result) {
    if (result.blind) blindSummary.value = result.summary
    else closureSummary.value = result.summary
    closeForm.realAmount = ''
    closeForm.notes = ''
    showConfirmClose.value = false
  }
}

// ── Apertura del cajón sin venta ───────────────────────────────────────────
const drawer = useCashDrawer()
const drawerReason = ref('')

async function handleOpenDrawer() {
  const reason = drawerReason.value.trim()
  if (reason.length < 3) return
  try {
    const r = await drawer.openWithAudit('MANUAL', reason)
    if (r === 'opened') {
      toast.success('Cajón abierto. La apertura quedó registrada.')
      drawerReason.value = ''
    } else {
      toast.warning('No se encontró la impresora de esta caja (el cajón se abre a través de ella). Revisa Configuración › Dispositivos.')
    }
  } catch {
    // El registro falló: el cajón NO se abrió. El interceptor explica el motivo.
  }
}

const closeSummaryModal = () => {
  closureSummary.value = null
  blindSummary.value = null
}
</script>