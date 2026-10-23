<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAppUpdate } from '~/composables/useAppUpdate'

/**
 * Aviso de versión nueva. No bloquea ni recarga: pregunta.
 * Vive en app.vue (fuera del layout) para seguir visible al cambiar de pantalla.
 */
const update = useAppUpdate()

// El aplazamiento caduca solo: este reloj hace que el aviso reaparezca sin
// depender de que el usuario navegue o interactúe.
const ahora = ref(Date.now())
let reloj: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  reloj = setInterval(() => (ahora.value = Date.now()), 15_000)
})
onBeforeUnmount(() => clearInterval(reloj))

const visible = computed(() => update.available.value && ahora.value >= update.snoozedUntil.value)
const urgente = computed(() => update.reason.value === 'chunk')
/**
 * Bloqueado por una operación en curso (p. ej. cambios sin guardar). Antes se
 * mostraba "Actualizar ahora" como botón primario deshabilitado: parecía la
 * acción a tomar y no hacía nada. Ahora el aviso se compacta, explica qué
 * falta y sólo ofrece lo que sí se puede hacer ("Más tarde").
 */
const bloqueado = computed(() => !!update.blockedBy.value)

function actualizar() {
  update.apply()
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="translate-y-4 opacity-0"
  >
    <!-- Se apila ENCIMA de la barra "Cambios sin guardar" (`--pp-save-bar`) y,
         en celular, del aviso de soporte (`--pp-bottom-stack`): antes tapaba
         el botón Guardar en laptops de ~1366 px. -->
    <div
      v-if="visible && bloqueado"
      class="fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))_+_max(var(--pp-bottom-stack,0px),var(--pp-save-bar,0px)))] z-40 flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-lg sm:inset-x-auto sm:right-4 sm:max-w-[min(24rem,calc(100vw-2rem))] lg:bottom-[calc(1rem_+_var(--pp-save-bar,0px))] dark:bg-gray-800"
      :class="urgente ? 'border-warning-500' : 'border-primary-500/60'"
      role="status"
      aria-live="polite"
      data-testid="app-update-banner"
      data-state="blocked"
    >
      <Icon
        :name="urgente ? 'ph:warning-fill' : 'ph:arrow-circle-up-fill'"
        class="shrink-0 text-xl"
        :class="urgente ? 'text-warning-500' : 'text-primary-600 dark:text-primary-400'"
      />
      <p class="min-w-0 flex-1 text-xs leading-snug text-gray-600 dark:text-gray-300">
        <strong class="font-semibold text-gray-800 dark:text-gray-100">
          {{ urgente ? 'Esta pantalla necesita la versión nueva.' : 'Hay una versión nueva.' }}
        </strong>
        {{ update.blockedBy.value }} Termina o cancela para poder actualizar.
      </p>
      <button
        v-if="!urgente"
        type="button"
        class="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        data-testid="app-update-later"
        @click="update.snooze()"
      >
        Más tarde
      </button>
    </div>

    <div
      v-else-if="visible"
      class="fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))_+_max(var(--pp-bottom-stack,0px),var(--pp-save-bar,0px)))] z-40 rounded-xl border bg-white shadow-xl sm:inset-x-auto sm:right-4 sm:w-[min(24rem,calc(100vw-2rem))] lg:bottom-[calc(1rem_+_var(--pp-save-bar,0px))] dark:bg-gray-800"
      :class="urgente ? 'border-warning-500' : 'border-primary-500'"
      role="status"
      aria-live="polite"
      data-testid="app-update-banner"
    >
      <div class="flex items-start gap-3 p-3 sm:p-4">
        <Icon
          :name="urgente ? 'ph:warning-fill' : 'ph:arrow-circle-up-fill'"
          class="mt-0.5 shrink-0 text-2xl"
          :class="urgente ? 'text-warning-500' : 'text-primary-600 dark:text-primary-400'"
        />

        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {{ urgente ? 'Esta pantalla necesita la versión nueva' : 'Hay una versión nueva de PharmaPOS' }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{
              urgente
                ? 'Se publicó una actualización y algunas pantallas ya no se pueden abrir con la versión que tienes cargada.'
                : 'Actualiza cuando termines lo que estás haciendo: la página se recargará y verás las mejoras.'
            }}
          </p>

          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="btn-primary flex-1 gap-2 py-2 text-sm sm:py-1.5"
              data-testid="app-update-apply"
              @click="actualizar"
            >
              <Icon name="ph:arrow-clockwise-bold" class="h-4 w-4" />
              Actualizar ahora
            </button>
            <button
              v-if="!urgente"
              type="button"
              class="btn-secondary py-2 text-sm sm:py-1.5"
              data-testid="app-update-later"
              @click="update.snooze()"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
