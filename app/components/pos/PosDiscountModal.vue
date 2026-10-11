<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import { describirFallo } from '~/composables/useRequestState'
import { discountAmount, previewDiscount, capForRole } from '~/utils/discount-policy'
import type { DiscountRequest } from '~/stores/sales'
import type { DiscountSettings } from '~/types/settings'

/**
 * Descuento en una línea o en toda la venta.
 *
 * Dos pasos cuando hace falta: (1) porcentaje y motivo; (2) si rebasa el tope
 * del rol, un gerente teclea SU usuario y contraseña en esta misma caja. Las
 * credenciales viajan una vez, el servidor las verifica y las descarta: no
 * abren sesión ni se guardan en el navegador.
 */
const props = defineProps<{
  /** Qué se descuenta: "Ibuprofeno 400 mg" o "Toda la venta". */
  label: string
  /** Importe bruto afectado (precio × cantidad, o subtotal de la venta). */
  gross: number
  /** Costo de lo afectado, para avisar si quedaría bajo costo. */
  cost?: number
  currentPercent: number
  role?: string
  settings: DiscountSettings | null
  /** Aplica en el servidor. Debe lanzar si falla. */
  apply: (req: DiscountRequest) => Promise<void>
}>()

const emit = defineEmits<{ close: []; done: [] }>()

const { formatCurrency } = useCurrency()

const percent = ref<number>(props.currentPercent || 0)
const reason = ref('')
const step = ref<'edit' | 'authorize'>('edit')
const login = ref('')
const password = ref('')
const busy = ref(false)
const serverError = ref<string | null>(null)
const percentInput = ref<HTMLInputElement | null>(null)
const loginInput = ref<HTMLInputElement | null>(null)

const cfg = computed(() => props.settings)
const cap = computed(() => (cfg.value ? capForRole(props.role, cfg.value) : 0))
const quick = computed(() => [5, 10, 15, 20].filter((p) => !cfg.value || p <= cfg.value.maxPercent))

const validPercent = computed(
  () => Number.isFinite(percent.value) && percent.value >= 0 && percent.value <= 100 && Math.abs(Math.round(percent.value * 100) - percent.value * 100) < 1e-6,
)
const amount = computed(() => (validPercent.value ? discountAmount(props.gross, percent.value) : 0))
const net = computed(() => props.gross - amount.value)
const belowCost = computed(
  () => props.cost !== undefined && percent.value > 0 && net.value < props.cost && !cfg.value?.allowBelowCost,
)

const decision = computed(() =>
  cfg.value && validPercent.value
    ? previewDiscount({ role: props.role, percent: percent.value, previousPercent: props.currentPercent, cfg: cfg.value })
    : null,
)
const needsReason = computed(() => percent.value > 0 && (cfg.value?.requireReason ?? true))

const canContinue = computed(
  () =>
    !busy.value &&
    validPercent.value &&
    percent.value !== props.currentPercent &&
    decision.value?.kind !== 'rejected' &&
    !belowCost.value &&
    (!needsReason.value || reason.value.trim().length > 0),
)

async function submit() {
  if (step.value === 'edit') {
    if (!canContinue.value) return
    if (decision.value?.kind === 'needs-authorization') {
      step.value = 'authorize'
      await nextTick()
      loginInput.value?.focus()
      return
    }
    await send()
  } else {
    if (!login.value.trim() || !password.value) return
    await send({ login: login.value.trim(), password: password.value })
  }
}

async function send(authorizer?: { login: string; password: string }) {
  busy.value = true
  serverError.value = null
  try {
    await props.apply({
      percent: percent.value,
      reason: percent.value > 0 ? reason.value.trim() || undefined : undefined,
      authorizer,
    })
    emit('done')
  } catch (e) {
    const f = describirFallo(e)
    serverError.value = f.mensaje
    // La configuración pudo cambiar: si el servidor exige autorización, se
    // pasa al paso de credenciales en vez de dejar al cajero atorado.
    if (f.estado === 403 && step.value === 'edit' && /autorizaci/i.test(f.mensaje)) {
      step.value = 'authorize'
      await nextTick()
      loginInput.value?.focus()
    }
  } finally {
    // La contraseña no se conserva ni un intento más de lo necesario.
    password.value = ''
    busy.value = false
  }
}

function removeDiscount() {
  percent.value = 0
  void send()
}

onMounted(() => nextTick(() => percentInput.value?.select()))
</script>

<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="discountTitle" @keydown.esc="emit('close')" @click.self="emit('close')">
    <form class="modal-panel sm:max-w-md sm:border sm:border-gray-100 sm:shadow-2xl dark:sm:border-gray-700" @submit.prevent="submit">
      <div class="modal-header">
        <div class="min-w-0">
          <h2 id="discountTitle" class="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <Icon name="ph:percent-bold" class="text-primary-600" /> Descuento
          </h2>
          <p class="truncate text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
        </div>
        <button type="button" class="-mr-2 -mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200" aria-label="Cerrar" @click="emit('close')">
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>
      </div>

      <div v-if="!cfg" class="modal-body text-sm text-gray-500 dark:text-gray-400">Cargando reglas de descuento…</div>

      <div v-else-if="step === 'edit'" class="modal-body space-y-4">
        <div>
          <label for="discPct" class="label-base">Porcentaje</label>
          <div class="relative">
            <input id="discPct" ref="percentInput" v-model.number="percent" type="number" min="0" :max="cfg.maxPercent" step="0.5" inputmode="decimal" class="input-base pr-10 text-xl font-bold tabular-nums" />
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
          <div class="mt-2 flex gap-2">
            <button v-for="q in quick" :key="q" type="button" class="flex-1 rounded-lg bg-gray-100 py-2.5 sm:py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200" @click="percent = q">{{ q }}%</button>
          </div>
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Tu tope: {{ cap }}%<template v-if="cfg.allowAuthorization"> · arriba de eso, con autorización de gerente</template> · máximo {{ cfg.maxPercent }}%
          </p>
        </div>

        <dl class="space-y-1 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-900/40">
          <div class="flex justify-between"><dt class="text-gray-500 dark:text-gray-400">Importe</dt><dd class="tabular-nums">{{ formatCurrency(gross) }}</dd></div>
          <div class="flex justify-between"><dt class="text-gray-500 dark:text-gray-400">Descuento</dt><dd class="tabular-nums text-error-600 dark:text-error-400">− {{ formatCurrency(amount) }}</dd></div>
          <div class="flex justify-between border-t border-gray-200 pt-1 font-semibold dark:border-gray-700"><dt>Queda en</dt><dd class="tabular-nums">{{ formatCurrency(net) }}</dd></div>
        </dl>

        <div v-if="percent > 0">
          <label for="discReason" class="label-base">Motivo{{ needsReason ? ' *' : '' }}</label>
          <input id="discReason" v-model="reason" type="text" maxlength="200" class="input-base" placeholder="Ej. cliente frecuente, producto próximo a caducar" />
        </div>

        <p v-if="belowCost" class="rounded-lg bg-error-500/10 p-3 text-xs text-error-700 dark:text-error-300" role="alert">Con este descuento quedaría por debajo del costo. No está permitido en Configuración › Descuentos.</p>
        <p v-else-if="decision?.kind === 'rejected'" class="rounded-lg bg-error-500/10 p-3 text-xs text-error-700 dark:text-error-300" role="alert">{{ decision.message }}</p>
        <p v-else-if="decision?.kind === 'needs-authorization'" class="flex gap-2 rounded-lg bg-warning-500/10 p-3 text-xs text-warning-800 dark:text-warning-300">
          <Icon name="ph:shield-warning-bold" class="h-4 w-4 shrink-0" /> Supera tu tope ({{ decision.cap }}%): en el siguiente paso un gerente lo autoriza.
        </p>
        <p v-if="serverError" class="text-xs text-error-600 dark:text-error-400" role="alert">{{ serverError }}</p>
      </div>

      <div v-else class="modal-body space-y-4">
        <p class="rounded-xl bg-warning-500/10 p-3 text-sm text-warning-900 dark:text-warning-200">
          Autorización de <strong>{{ percent }}%</strong> sobre {{ formatCurrency(gross) }}. Que el gerente escriba sus datos; no se guardan.
        </p>
        <div>
          <label for="authLogin" class="label-base">Usuario o correo del gerente</label>
          <input id="authLogin" ref="loginInput" v-model="login" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" class="input-base" />
        </div>
        <div>
          <label for="authPass" class="label-base">Contraseña</label>
          <input id="authPass" v-model="password" type="password" autocomplete="off" class="input-base" />
        </div>
        <p v-if="serverError" class="text-xs text-error-600 dark:text-error-400" role="alert">{{ serverError }}</p>
      </div>

      <div class="modal-footer bg-gray-50 dark:bg-gray-800/80">
        <button v-if="currentPercent > 0 && step === 'edit'" type="button" class="sm:mr-auto rounded-lg px-3 py-2.5 sm:py-2 text-sm font-medium text-error-600 hover:bg-error-500/10" :disabled="busy" @click="removeDiscount">Quitar descuento</button>
        <button v-if="step === 'authorize'" type="button" class="sm:mr-auto rounded-lg px-3 py-2.5 sm:py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" :disabled="busy" @click="step = 'edit'">Atrás</button>
        <button type="button" class="btn-secondary py-2.5 sm:py-2" :disabled="busy" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary gap-2 py-2.5 sm:py-2" :disabled="step === 'edit' ? !canContinue : busy || !login.trim() || !password">
          <Icon v-if="busy" name="ph:spinner-gap-bold" class="h-4 w-4 animate-spin" />
          {{ step === 'authorize' ? 'Autorizar y aplicar' : decision?.kind === 'needs-authorization' ? 'Continuar' : 'Aplicar' }}
        </button>
      </div>
    </form>
  </div>
</template>
