<script setup lang="ts">
/**
 * Barra de cambios pendientes para pantallas de configuración.
 *
 * Aparece sólo cuando hay algo que guardar, fija abajo, para que el botón
 * esté siempre a la vista aunque se haya bajado por el formulario. Reutilizable
 * por las siguientes pantallas de Configuración.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  saving: boolean
  canSave: boolean
  /** Qué cambió, en palabras del usuario: "datos de la farmacia", "plantilla". */
  scopes: string[]
  /**
   * Campos con error, en orden de pantalla. Opcional: sin esto la barra dice
   * "Corrige los campos marcados", como antes, para las pantallas que no lo pasan.
   */
  invalidFields?: { label: string; inputId?: string }[]
}>()

const emit = defineEmits<{ save: []; discard: [] }>()

const nombresInvalidos = computed(() => (props.invalidFields ?? []).map((f) => f.label).join(', '))
const primerInvalido = computed(() => props.invalidFields?.find((f) => f.inputId) ?? null)

/** Lleva al primer campo con error: con el formulario largo, no se veía cuál era. */
function irAlPrimero() {
  const id = primerInvalido.value?.inputId
  const el = id ? document.getElementById(id) : null
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
}

// ── Alto ocupado abajo ─────────────────────────────────────────────────────
// El aviso de versión nueva es `fixed` abajo a la derecha y, en laptops de
// ~1366 px, tapaba "Guardar cambios"; a la vez decía "tienes cambios sin
// guardar": no se podía ni guardar ni actualizar. Se publica cuánto ocupa la
// barra desde el borde inferior de la ventana (`--pp-save-bar`) para que el
// aviso se coloque ENCIMA. Se mide la posición real y no sólo el alto porque
// la barra es `sticky`: en una página corta queda más arriba del borde.
const root = ref<HTMLElement | null>(null)
let ro: ResizeObserver | undefined
let frame = 0

function publicar(px: number) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--pp-save-bar', px > 0 ? `${Math.ceil(px) + 8}px` : '0px')
}

function medir() {
  frame = 0
  const el = root.value
  if (!el) return publicar(0)
  const r = el.getBoundingClientRect()
  const alto = window.innerHeight
  // Fuera de la ventana (o aún sin pintar) no estorba a nadie.
  publicar(r.bottom <= 0 || r.top >= alto || r.height === 0 ? 0 : alto - r.top)
}

function programarMedida() {
  if (!frame) frame = requestAnimationFrame(medir)
}

watch(root, (el) => {
  ro?.disconnect()
  if (!el) return publicar(0)
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(programarMedida)
    ro.observe(el)
  }
  programarMedida()
})

onMounted(() => {
  // `capture`: el que hace scroll es el contenedor del layout, no `window`.
  window.addEventListener('scroll', programarMedida, { capture: true, passive: true })
  window.addEventListener('resize', programarMedida, { passive: true })
})

onBeforeUnmount(() => {
  ro?.disconnect()
  if (frame) cancelAnimationFrame(frame)
  window.removeEventListener('scroll', programarMedida, { capture: true })
  window.removeEventListener('resize', programarMedida)
  publicar(0)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="translate-y-4 opacity-0"
    @after-enter="programarMedida"
  >
    <div
      v-if="visible"
      ref="root"
      class="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto mt-6 flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-800/95"
      role="region"
      aria-label="Cambios sin guardar"
    >
      <span class="h-2 w-2 shrink-0 rounded-full bg-warning-500" aria-hidden="true" />
      <p class="min-w-0 flex-1 basis-48 text-sm text-gray-700 dark:text-gray-200">
        Cambios sin guardar en
        <strong class="font-semibold">{{ scopes.join(' y ') }}</strong>.
        <template v-if="!canSave">
          <span v-if="nombresInvalidos" class="text-error-600 dark:text-error-400" data-testid="unsaved-invalid-fields">
            Corrige: {{ nombresInvalidos }}.
          </span>
          <span v-else class="text-error-600 dark:text-error-400">Corrige los campos marcados.</span>
          <button
            v-if="primerInvalido"
            type="button"
            class="ml-1 font-medium text-error-700 underline underline-offset-2 hover:text-error-800 dark:text-error-300"
            @click="irAlPrimero"
          >
            Ir al campo
          </button>
        </template>
      </p>
      <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
        <button
          type="button"
          class="min-h-10 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 sm:min-h-0 sm:border-0 dark:border-gray-600 hover:text-gray-900 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          :disabled="saving"
          @click="emit('discard')"
        >
          Descartar
        </button>
        <button
          type="button"
          class="btn-primary gap-2 text-sm"
          :disabled="saving || !canSave"
          @click="emit('save')"
        >
          <Icon v-if="saving" name="ph:spinner-gap-bold" class="h-4 w-4 animate-spin" />
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          <kbd v-if="!saving" class="hidden rounded border border-white/30 px-1 font-sans text-[10px] font-normal opacity-80 sm:inline">Ctrl S</kbd>
        </button>
      </div>
    </div>
  </Transition>
</template>
