<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:cash-register-bold" class="text-primary-600" /> Mi Turno de Caja
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Control de dinero en efectivo de tu sesión actual.</p>
      </div>
      
      <NuxtLink 
        v-if="authStore.can('canViewAllShifts')" 
        to="/cash-shifts/history"
        class="btn-secondary shrink-0 text-sm"
      >
        <Icon name="ph:list-dashes-bold" class="mr-2" /> Ver Historial
      </NuxtLink>
    </div>

    <div v-if="!store.currentShift" class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
      <div class="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-100 dark:border-gray-700">
        <Icon name="ph:lock-key-bold" class="w-10 h-10 text-gray-400" />
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Caja Cerrada</h2>
      <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
        No tienes un turno activo. Abre tu caja declarando el monto inicial (fondo o morralla) para poder recibir pagos en efectivo.
      </p>

      <form @submit.prevent="handleOpenShift" class="max-w-xs mx-auto space-y-4 text-left">
        <div>
          <label class="label-base text-center block">Monto Inicial en Caja *</label>
          <div class="relative">
            <Icon name="ph:currency-dollar-bold" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input v-model.number="openForm.initialAmount" type="number" step="0.01" min="0" required class="input-base pl-10 text-xl font-bold text-center h-14" placeholder="0.00" />
          </div>
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
      <div class="relative rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden px-6 py-8">
        <!-- Sutil decorativo fondo -->
        <Icon 
          name="ph:cash-register-duotone" 
          class="absolute -bottom-4 -right-4 w-40 h-40 opacity-10 text-primary-300 dark:text-primary-800 pointer-events-none"
        />
        <div class="flex flex-col sm:flex-row justify-between items-center relative z-10">
          <div class="mb-6 sm:mb-0">
            <span class="px-4 py-1.5 bg-primary-50 dark:bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-full text-xs font-bold tracking-widest mb-6 inline-block shadow-sm border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300 transition-colors">
              Turno Abierto
            </span>
            <p class="text-3xl sm:text-4xl font-extrabold mb-2 text-gray-900 dark:text-white drop-shadow mt-3">
              Caja Activa
            </p>
            <p class="text-primary-700 dark:text-primary-200 flex items-center gap-2 text-base font-medium">
              <Icon name="ph:clock-bold" class="text-primary-500 dark:text-primary-200" />
              Abierta desde: <span class="font-semibold">{{ formatDateTime(store.currentShift.openedAt) }}</span>
            </p>
          </div>
          <div class="text-right bg-primary-50 dark:bg-gray-900 rounded-xl px-6 py-4 shadow-sm border border-primary-100 dark:border-gray-600">
            <p class="text-primary-600 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-1">Monto Inicial</p>
            <p class="text-3xl font-black text-gray-900 dark:text-white drop-shadow-sm">
              {{ formatCurrency(Number(store.currentShift.initialAmount)) }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="authStore.can('canWithdrawCash')" class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
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
              <input v-model.number="operationForm.amount" type="number" step="0.01" min="0.01" required class="input-base text-sm py-2 flex-1" placeholder="0.00" />
            </div>
   
          </div>
          <div class="md:col-span-4">
            <label class="label-base text-xs">Motivo (Justificación) *</label>
            <input v-model="operationForm.reason" type="text" required class="input-base text-sm py-2" placeholder="Ej: Depósito bancario" />
          </div>
          <div class="md:col-span-2 flex items-end">
            <button type="submit" :disabled="store.isActionLoading" class="btn-secondary w-full py-2">
              <Icon v-if="store.isActionLoading" name="ph:spinner-gap-bold" class="animate-spin" />
              <span v-else>Registrar</span>
            </button>
          </div>
        </form>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-error-100 dark:border-error-900/30">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Icon name="ph:lock-key-bold" class="text-error-500" /> Cierre de Turno (Arqueo Ciego)
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Cuenta el dinero físico que hay en tu gaveta e ingrésalo. El sistema calculará automáticamente si falta o sobra dinero respecto a las ventas del día.
        </p>

        <form @submit.prevent="handleCloseShift" class="max-w-sm mx-auto space-y-4">
          <div>
            <label class="label-base text-center block text-error-600 dark:text-error-400 font-bold">Total Físico Contado *</label>
            <div class="relative">
              <Icon name="ph:currency-dollar-bold" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input v-model.number="closeForm.realAmount" type="number" step="0.01" min="0" required class="input-base pl-10 text-2xl font-black text-center h-16 border-gray-300 dark:border-gray-600 focus:border-error-500 focus:ring-error-500" placeholder="0.00" />
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

    <div v-if="closureSummary" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center">
        <div :class="closureSummary.status === 'AUDIT_REQUIRED' ? 'bg-error-500' : 'bg-success-500'" class="p-6 text-white">
          <Icon :name="closureSummary.status === 'AUDIT_REQUIRED' ? 'ph:warning-circle-bold' : 'ph:check-circle-bold'" class="w-16 h-16 mx-auto mb-2" />
          <h2 class="text-2xl font-black">Corte Finalizado</h2>
          <p class="text-sm opacity-90">{{ closureSummary.status === 'AUDIT_REQUIRED' ? 'Diferencia fuera de tolerancia' : 'Caja Cuadrada' }}</p>
        </div>
        
        <div class="p-6 space-y-3 text-sm text-left">
          <div class="flex justify-between">
            <span class="text-gray-500">Monto Inicial</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(Number(closureSummary.initial)) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Ingresos en Efectivo</span>
            <span class="font-bold text-success-600">+ {{ formatCurrency(Number(closureSummary.salesCash)) }}</span>
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
          
          <div class="mt-4 p-3 rounded-xl border" :class="Number(closureSummary.difference) < 0 ? 'bg-error-50 border-error-200' : Number(closureSummary.difference) > 0 ? 'bg-warning-50 border-warning-200' : 'bg-success-50 border-success-200'">
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
        
        <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button @click="closeSummaryModal" class="btn-primary w-full">Aceptar y Salir</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useCashShiftStore, type CashTransactionType, type CloseShiftSummary } from '~/stores/cashShift'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import { useToast } from '~/composables/useToast'

definePageMeta({ requiredPermission: 'canOpenShift' })

const store = useCashShiftStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const { formatDateTime } = useDate()
const toast = useToast()

const openForm = reactive({ initialAmount: '', notes: '' })
const closeForm = reactive({ realAmount: '', notes: '' })
const operationForm = reactive({ type: 'MANUAL_WITHDRAW' as CashTransactionType, amount: '', reason: '' })

const closureSummary = ref<CloseShiftSummary | null>(null)

onMounted(async () => {
  await store.fetchCurrentShift()
})

const handleOpenShift = async () => {
  if (openForm.initialAmount === '' || Number(openForm.initialAmount) < 0) return
  await store.openShift({
    initialAmount: Number(openForm.initialAmount),
    notes: openForm.notes.trim() || undefined
  })
  toast.success('Turno de caja abierto exitosamente.')
  openForm.initialAmount = ''
  openForm.notes = ''
}

const handleRegisterOperation = async () => {
  if (operationForm.amount === '' || Number(operationForm.amount) <= 0 || !operationForm.reason.trim()) return
  await store.registerOperation({
    type: operationForm.type,
    amount: Number(operationForm.amount),
    reason: operationForm.reason.trim()
  })
  toast.success('Operación registrada exitosamente.')
  operationForm.amount = ''
  operationForm.reason = ''
}

const handleCloseShift = async () => {
  if (closeForm.realAmount === '' || Number(closeForm.realAmount) < 0) return
  
  if (confirm("¿Estás 100% seguro de realizar el corte? Asegúrate de haber contado bien las monedas y billetes.")) {
    const summary = await store.closeShift({
      realAmount: Number(closeForm.realAmount),
      notes: closeForm.notes.trim() || undefined
    })
    
    if (summary) {
      closureSummary.value = summary
      closeForm.realAmount = ''
      closeForm.notes = ''
    }
  }
}

const closeSummaryModal = () => {
  closureSummary.value = null
}
</script>