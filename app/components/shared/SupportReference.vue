<template>
  <!--
    AVISO DE SOPORTE PERSISTENTE.

    El toast de un 500 duraba cuatro segundos y mostraba ocho caracteres del
    requestId. Con eso el cajero no podía dictar nada por teléfono y el soporte
    no podía buscar nada en los logs: la referencia existía para tranquilizar,
    no para diagnosticar.

    Este aviso sobrevive al F5 (sessionStorage), muestra la referencia COMPLETA
    y se copia con un clic. Sólo aparece cuando hay algo que reportar.
  -->
  <div
    v-if="ui.hayIncidentes && !oculto"
    ref="root"
    class="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-lg border border-error-500 bg-white shadow-lg sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm dark:bg-gray-800"
    role="status"
    aria-live="polite"
  >
    <div class="flex items-start gap-3 p-3 sm:p-4">
      <Icon
        name="ph:lifebuoy-fill"
        class="mt-0.5 shrink-0 text-2xl text-error-500"
      />

      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Referencia para soporte
        </p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Hubo un fallo en el servidor. Comparte este código con soporte para que
          puedan localizar exactamente qué ocurrió.
        </p>

        <code
          class="mt-2 block wrap-break-word rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800 select-all dark:bg-gray-900 dark:text-gray-200"
        >
          {{ ui.ultimoIncidente?.requestId }}
        </code>

        <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {{ horaLegible }}
          <span v-if="ui.incidentes.length > 1">
            · {{ ui.incidentes.length }} fallos en esta sesión
          </span>
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white sm:py-1.5 hover:bg-gray-700 disabled:opacity-60 dark:bg-gray-700 dark:hover:bg-gray-600"
            :disabled="copiando"
            @click="copiar"
          >
            {{ copiado ? '¡Copiado!' : 'Copiar referencia' }}
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 sm:py-1.5 dark:text-gray-400 dark:hover:text-gray-300"
            @click="descartar"
          >
            Ya lo reporté
          </button>
        </div>
      </div>

      <button
        type="button"
        class="-m-2 shrink-0 rounded-md p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label="Ocultar aviso"
        @click="oculto = true"
      >
        <Icon name="ph:x-bold" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useUIStore } from '~/stores/ui'
import { useToast } from '~/composables/useToast'

const ui = useUIStore()
const toast = useToast()

/**
 * Ocultar es distinto de descartar: ocultar quita el aviso de en medio de la
 * pantalla del cajero (que está cobrando) sin borrar la referencia, que sigue
 * disponible al recargar. Descartar sí la borra.
 */
const oculto = ref(false)
const copiando = ref(false)
const copiado = ref(false)

// La lectura desde sessionStorage ocurre en onMounted, nunca durante el SSR:
// en el servidor no existe sessionStorage y leer allí produciría un desajuste
// de hidratación (HTML con aviso, cliente sin él).
onMounted(() => ui.leerDeSesion())

// En celular y tableta este aviso y el de versión nueva comparten la parte de
// abajo: se publica el alto (más un margen) para que el otro se apile encima.
const root = ref<HTMLElement | null>(null)
let ro: ResizeObserver | undefined
function publicarAlto(px: number) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--pp-bottom-stack', px > 0 ? `${px + 8}px` : '0px')
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

const horaLegible = computed(() => {
  const iso = ui.ultimoIncidente?.ocurridoEn
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

async function copiar() {
  const incidente = ui.ultimoIncidente
  if (!incidente) return

  copiando.value = true
  const texto = ui.textoParaSoporte(incidente)

  try {
    // El portapapeles requiere contexto seguro (HTTPS o localhost). En una
    // terminal de farmacia servida por HTTP plano falla, así que hay respaldo.
    await navigator.clipboard.writeText(texto)
    copiado.value = true
    setTimeout(() => (copiado.value = false), 2000)
  } catch {
    toast.info(
      'No se pudo copiar automáticamente. Selecciona el código y cópialo con Ctrl+C.',
    )
  } finally {
    copiando.value = false
  }
}

function descartar() {
  ui.limpiarIncidentes()
  oculto.value = false
}
</script>
