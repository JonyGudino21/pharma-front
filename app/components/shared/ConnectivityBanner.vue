<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useConnectivity } from '~/composables/useConnectivity'
import { useDate } from '~/composables/useDate'

/**
 * Aviso de falta de conexión con el servidor. Sólo aparece cuando se SABE que
 * no se puede operar (dos sondeos fallidos); en el resto del tiempo no existe.
 * Lo que está en pantalla se conserva: no se recarga nada.
 */
const conn = useConnectivity()
const { formatDateTime } = useDate()

const visible = computed(() => !conn.canOperate.value)
const titulo = computed(() =>
  conn.status.value === 'db-down'
    ? 'El servidor no puede acceder a su base de datos'
    : 'Sin conexión con el servidor',
)
const desde = computed(() => (conn.lastOkAt.value ? formatDateTime(conn.lastOkAt.value) : null))

// En celular el aviso va bajo la barra superior; publica su alto (más un margen)
// para que los toasts se acomoden debajo y no se encimen.
const root = ref<HTMLElement | null>(null)
let ro: ResizeObserver | undefined
function publicarAlto(px: number) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--pp-top-stack', px > 0 ? `${px + 8}px` : '0px')
}
watch(root, (el) => {
  ro?.disconnect()
  if (!el) return publicarAlto(0)
  if (typeof ResizeObserver === 'undefined') return publicarAlto(el.offsetHeight)
  ro = new ResizeObserver(() => publicarAlto(el.offsetHeight))
  ro.observe(el)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  publicarAlto(0)
})
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    class="fixed inset-x-3 top-[calc(env(safe-area-inset-top)_+_4rem)] z-50 rounded-xl border border-error-500 bg-white shadow-xl sm:inset-x-auto sm:left-1/2 sm:top-3 sm:w-[min(42rem,calc(100vw-2rem))] sm:-translate-x-1/2 dark:bg-gray-800"
    role="alert"
    data-testid="connectivity-banner"
  >
    <div class="flex flex-wrap items-start gap-x-3 gap-y-2 p-3 sm:flex-nowrap sm:p-4">
      <Icon name="ph:wifi-slash-fill" class="mt-0.5 shrink-0 text-2xl text-error-500" />
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ titulo }}</p>
        <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
          No se pueden registrar ventas ni cobros hasta que regrese. <strong>No cierres esta ventana</strong>:
          lo que tienes en pantalla se conserva y se reintenta solo.
          <span v-if="desde">Última conexión correcta: {{ desde }}.</span>
        </p>
        <p class="mt-1 hidden text-xs text-gray-500 sm:block dark:text-gray-400">
          Mientras tanto, anota la venta a mano y captúrala al volver.
        </p>
      </div>
      <button
        type="button"
        class="btn-secondary w-full shrink-0 gap-1.5 px-3 py-2 text-xs sm:w-auto sm:py-1.5"
        :disabled="conn.checking.value"
        @click="conn.recheck()"
      >
        <Icon name="ph:arrow-clockwise-bold" class="h-4 w-4" :class="{ 'animate-spin': conn.checking.value }" />
        Reintentar
      </button>
    </div>
  </div>
</template>
