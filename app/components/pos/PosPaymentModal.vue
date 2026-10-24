<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSalesStore, type PaymentMethod, type Sale } from '~/stores/sales'
import type { Client } from '~/stores/client'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
import { alcanza, restar, sumar } from '~/utils/money'
import { useReceivablesStore, type ClientCreditStatus } from '~/stores/receivables'
import { fechaCorta, ymdEnDias } from '~/utils/credit-status'

const props = defineProps<{
  client: Client | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'completed', sale: Sale): void
}>()

const sales = useSalesStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const method = ref<PaymentMethod>('CASH')
const received = ref<number | null>(null)
const onCredit = ref(false)
const isProcessing = ref(false)
const cashInput = ref<HTMLInputElement | null>(null)

const totalDue = computed(() => sales.balance)
const clientCanCredit = computed(() => !!props.client?.hasCredit)
// Dinero en CENTAVOS ENTEROS (utils/money.ts). Con `Number` a secas,
// 1000.10 - 1000.00 daba 0.0999999…: un crédito que alcanzaba justo se
// rechazaba, y el cambio podía mostrarse un centavo por debajo.
const creditAvailable = computed(() => {
  if (!props.client) return 0
  return Math.max(0, restar(props.client.creditLimit, props.client.currentDebt))
})

/** Parte de la venta que irá a crédito: el saldo menos el abono inicial. */
const montoACredito = computed(() => {
  const abono = Math.max(0, received.value ?? 0)
  return Math.max(0, restar(totalDue.value, abono))
})

const change = computed(() => {
  if (onCredit.value || method.value !== 'CASH' || received.value == null) return 0
  return Math.max(0, restar(received.value, totalDue.value))
})

/**
 * Lo pagado supera el total (venta anterior a la guarda del servidor que lo
 * impide). Cerrarla así dejaría dinero de más sin cambio registrado.
 */
const sobrepagada = computed(() => totalDue.value < 0)

/** Ya se pagó todo en un intento anterior: sólo falta cerrar la venta. */
const pagoCubierto = computed(() => totalDue.value === 0 && sales.paidAmount > 0)

// ─── Fecha de pago del crédito (opcional, ADR-0029) ───
// Se propone con los días del cliente (o los de Configuración › Crédito) y se
// puede cambiar o quitar. También dice si el cliente ya debe algo vencido.
const receivables = useReceivablesStore()
const creditStatus = ref<ClientCreditStatus | null>(null)
const dueDate = ref('')
const hoy = ymdEnDias(0)
const PLAZOS = [7, 15, 30]
const dueDateError = computed(() => (dueDate.value && dueDate.value < hoy ? 'La fecha de pago no puede ser anterior a hoy.' : ''))
const creditoBloqueado = computed(() => !!creditStatus.value?.blocksCredit)
const origenSugerencia = computed(() => {
  const st = creditStatus.value
  if (!st || st.suggestedDays <= 0) return ''
  return st.creditDays != null ? `${st.suggestedDays} días del cliente` : `${st.suggestedDays} días (configuración)`
})

async function cargarEstadoCredito() {
  if (!props.client?.hasCredit) return
  const st = await receivables.fetchCreditStatus(props.client.id)
  creditStatus.value = st
  if (st && st.suggestedDays > 0 && !dueDate.value) dueDate.value = ymdEnDias(st.suggestedDays)
}

const canConfirm = computed(() => {
  if (isProcessing.value) return false
  if (sobrepagada.value) return false
  if (pagoCubierto.value) return true
  // A crédito sólo se carga lo que queda DESPUÉS del abono inicial (así lo
  // valida el servidor al cerrar): exigir el total bloqueaba ventas válidas.
  if (onCredit.value) {
    if (creditoBloqueado.value || dueDateError.value) return false
    return alcanza(creditAvailable.value, montoACredito.value)
  }
  if (method.value === 'CASH') return alcanza(received.value ?? 0, totalDue.value)
  return true // tarjeta/transferencia: se asume monto exacto
})

const methods: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'CASH', label: 'Efectivo', icon: 'ph:money-bold' },
  { key: 'CARD', label: 'Tarjeta', icon: 'ph:credit-card-bold' },
  { key: 'TRANSFER', label: 'Transferencia', icon: 'ph:bank-bold' },
]

const quickAmounts = computed(() => {
  const due = totalDue.value
  const set = new Set<number>([Math.ceil(due)])
  for (const bill of [50, 100, 200, 500, 1000]) {
    if (bill >= due) set.add(bill)
  }
  return Array.from(set).sort((a, b) => a - b).slice(0, 4)
})

function selectMethod(m: PaymentMethod) {
  method.value = m
  onCredit.value = false
  if (m === 'CASH') nextTick(() => cashInput.value?.focus())
}

async function confirm() {
  // Enter en "Efectivo recibido" también cobra: la guarda explícita evita un
  // segundo cobro si el cajero pulsa Enter (o el botón) dos veces seguidas.
  if (isProcessing.value || !canConfirm.value) return
  isProcessing.value = true
  try {
    // PAGO YA REGISTRADO EN UN INTENTO ANTERIOR. Si el pago entró pero el
    // cierre falló, el saldo queda en 0: volver a "pagar" mandaba un pago de $0
    // que el servidor rechaza, y la venta nunca se cerraba. Con saldo cubierto
    // se va directo a cerrar.
    if (pagoCubierto.value) {
      const completed = await sales.completeSale()
      if (completed) emit('completed', completed)
      return
    }

    if (onCredit.value) {
      // Venta a crédito: opcionalmente registramos un abono inicial
      if (received.value && received.value > 0) {
        const abono = Math.min(received.value, totalDue.value)
        const ok = await sales.registerPayment({ method: 'CASH', amount: abono })
        if (!ok) return
      }
    } else {
      // Contado: registramos el pago por el saldo exacto (evitamos sobrepago)
      const ok = await sales.registerPayment({ method: method.value, amount: totalDue.value })
      if (!ok) return
    }

    // Con crédito se manda siempre la decisión: la fecha o null (sin fecha).
    const completed = await sales.completeSale(onCredit.value ? { dueDate: dueDate.value || null } : {})
    if (completed) emit('completed', completed)
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => {
  nextTick(() => cashInput.value?.focus())
  void cargarEstadoCredito()
})
</script>

<template>
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="paymentTitle"
    @keydown.esc="emit('close')"
    @click.self="emit('close')"
  >
    <div class="modal-panel sm:max-w-md sm:border sm:border-gray-100 sm:shadow-2xl dark:sm:border-gray-700">
      <!-- Header con total -->
      <div class="shrink-0 px-4 py-4 sm:px-6 sm:py-5 bg-primary-600 text-white">
        <p id="paymentTitle" class="text-sm text-primary-100">Total a cobrar</p>
        <p class="text-3xl sm:text-4xl font-bold tabular-nums">{{ formatCurrency(totalDue) }}</p>
        <p v-if="client" class="text-sm text-primary-100 mt-1 truncate">Cliente: {{ client.name }}</p>
      </div>

      <div class="modal-body space-y-5">
        <div
          v-if="sobrepagada"
          class="flex gap-3 rounded-xl border border-error-500/40 bg-error-500/10 p-4 text-sm text-error-800 dark:text-error-300"
          role="alert"
        >
          <Icon name="ph:warning-bold" class="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Lo pagado ({{ formatCurrency(sales.paidAmount) }}) supera el total de la venta.
            Agrega los productos que faltan o descarta la venta para devolver el dinero.
          </p>
        </div>

        <!-- Pago ya registrado en un intento anterior: sólo falta cerrar -->
        <div
          v-else-if="pagoCubierto"
          class="flex gap-3 rounded-xl border border-success-500/40 bg-success-500/10 p-4 text-sm text-success-800 dark:text-success-300"
          role="status"
        >
          <Icon name="ph:check-circle-fill" class="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            El pago de esta venta <strong>ya está registrado</strong> ({{ formatCurrency(sales.paidAmount) }}).
            Sólo falta cerrarla: no se volverá a cobrar.
          </p>
        </div>

        <template v-else>
        <!-- Métodos -->
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in methods"
            :key="m.key"
            class="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-colors"
            :class="!onCredit && method === m.key
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'"
            @click="selectMethod(m.key)"
          >
            <Icon :name="m.icon" class="w-6 h-6" />
            <span class="text-xs font-medium">{{ m.label }}</span>
          </button>
        </div>

        <!-- Crédito -->
        <button
          v-if="clientCanCredit"
          class="w-full flex items-center justify-between py-3 px-4 rounded-xl border-2 transition-colors"
          :class="onCredit
            ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/20 text-warning-800 dark:text-warning-300'
            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'"
          @click="onCredit = !onCredit"
        >
          <span class="flex items-center gap-2 text-sm font-medium">
            <Icon name="ph:credit-card-bold" class="w-5 h-5 shrink-0" /> Cargar a crédito
          </span>
          <span class="text-xs text-right">Disponible: {{ formatCurrency(creditAvailable) }}</span>
        </button>

        <!-- Efectivo recibido -->
        <div v-if="method === 'CASH' && !onCredit">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Efectivo recibido</label>
          <input
            ref="cashInput"
            v-model.number="received"
            @keydown.enter.prevent="confirm"
            type="number"
            inputmode="decimal"
            enterkeyhint="done"
            min="0"
            step="0.01"
            placeholder="0.00"
            aria-label="Efectivo recibido"
            class="w-full px-4 py-3 text-lg font-semibold rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div class="grid grid-cols-2 gap-2 mt-2 sm:flex">
            <button
              v-for="amt in quickAmounts"
              :key="amt"
              type="button"
              class="flex-1 py-2.5 sm:py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              @click="received = amt"
            >
              {{ formatCurrency(amt) }}
            </button>
          </div>
          <div class="flex justify-between items-center mt-3 px-1">
            <span class="text-sm text-gray-500 dark:text-gray-400">Cambio</span>
            <span class="text-xl font-bold text-success-600 dark:text-success-400 tabular-nums">{{ formatCurrency(change) }}</span>
          </div>
        </div>

        <!-- Abono opcional en crédito -->
        <div v-if="onCredit">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Abono inicial (opcional)</label>
          <input
            v-model.number="received"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            aria-label="Abono inicial"
            class="w-full px-4 py-3 text-base rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-warning-500"
          />
          <div class="flex justify-between items-center mt-3 px-1" data-testid="pos-credit-amount">
            <span class="text-sm text-gray-500 dark:text-gray-400">Se carga a crédito</span>
            <span
              class="text-lg font-bold tabular-nums"
              :class="canConfirm ? 'text-gray-900 dark:text-white' : 'text-error-600 dark:text-error-400'"
            >{{ formatCurrency(montoACredito) }}</span>
          </div>
          <p v-if="!alcanza(creditAvailable, montoACredito)" class="mt-1 px-1 text-xs text-error-600 dark:text-error-400">
            El crédito disponible no alcanza. Aumenta el abono a por lo menos {{ formatCurrency(sumar(restar(montoACredito, creditAvailable), received ?? 0)) }}.
          </p>

          <!-- Saldo vencido del cliente -->
          <div
            v-if="creditStatus && Number(creditStatus.overdue) > 0"
            class="mt-3 flex gap-2 rounded-xl px-3 py-2.5 text-xs"
            :class="creditoBloqueado ? 'bg-error-50 text-error-800 dark:bg-error-900/20 dark:text-error-200' : 'bg-warning-50 text-warning-900 dark:bg-warning-900/20 dark:text-warning-200'"
            role="alert"
            data-testid="pos-credit-overdue"
          >
            <Icon name="ph:warning-circle-bold" class="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Tiene <strong>{{ formatCurrency(Number(creditStatus.overdue)) }}</strong> vencido ({{ creditStatus.overdueCount }} {{ creditStatus.overdueCount === 1 ? 'venta' : 'ventas' }}, la más atrasada {{ creditStatus.maxDaysOverdue }} días).
              <template v-if="creditoBloqueado"> La configuración no permite crédito nuevo: cobra esta venta completa.</template>
            </span>
          </div>

          <!-- Fecha de pago: opcional -->
          <div class="mt-4" data-testid="pos-credit-due">
            <div class="mb-1.5 flex items-baseline justify-between gap-2">
              <label for="posDueDate" class="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de pago <span class="font-normal text-gray-400">(opcional)</span></label>
              <span v-if="origenSugerencia" class="text-[11px] text-gray-500 dark:text-gray-400">Sugerida: {{ origenSugerencia }}</span>
            </div>
            <input
              id="posDueDate"
              v-model="dueDate"
              type="date"
              :min="hoy"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-900 outline-none focus:ring-2 focus:ring-warning-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              :aria-invalid="!!dueDateError"
              data-testid="pos-due-date"
            />
            <div class="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Plazos rápidos">
              <button
                v-for="d in PLAZOS"
                :key="d"
                type="button"
                class="rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
                :class="dueDate === ymdEnDias(d) ? 'border-warning-500 bg-warning-50 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300' : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'"
                @click="dueDate = ymdEnDias(d)"
              >{{ d }} días</button>
              <button
                type="button"
                class="rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
                :class="!dueDate ? 'border-gray-500 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100' : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'"
                data-testid="pos-due-none"
                @click="dueDate = ''"
              >Sin fecha</button>
            </div>
            <p v-if="dueDateError" class="mt-1 px-1 text-xs text-error-600 dark:text-error-400" role="alert">{{ dueDateError }}</p>
            <p v-else class="mt-1.5 px-1 text-xs text-gray-500 dark:text-gray-400">
              {{ dueDate ? `Vence el ${fechaCorta(dueDate)}. En Cobranza se avisará antes de esa fecha.` : 'Sin fecha: en Cobranza se ordena por antigüedad de la venta.' }}
            </p>
          </div>
        </div>

        </template>
      </div>

      <!-- Acciones (pie fijo; en celular el principal arriba y a todo el ancho) -->
      <div class="modal-footer sm:gap-3">
          <button
            type="button"
            class="sm:flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="sm:flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            :disabled="!canConfirm"
            @click="confirm"
          >
            <Icon v-if="isProcessing" name="ph:spinner-gap-bold" class="w-5 h-5 animate-spin" />
            <Icon v-else name="ph:check-circle-bold" class="w-5 h-5" />
            {{ isProcessing ? 'Procesando...' : pagoCubierto ? 'Cerrar venta' : 'Cobrar' }}
          </button>
      </div>
    </div>
  </div>
</template>
