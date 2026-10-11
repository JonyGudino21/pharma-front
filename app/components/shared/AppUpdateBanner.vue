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
    <div
      v-if="visible"
      class="fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))_+_var(--pp-bottom-stack,0px))] z-40 rounded-xl border bg-white shadow-xl sm:inset-x-auto sm:right-4 sm:w-[min(24rem,calc(100vw-2rem))] lg:bottom-4 dark:bg-gray-800"
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

          <p
            v-if="update.blockedBy.value"
            class="mt-2 flex items-start gap-1.5 rounded-lg bg-warning-500/10 p-2 text-xs text-warning-800 dark:text-warning-300"
          >
            <Icon name="ph:hand-palm-bold" class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ update.blockedBy.value }} Termina o cancela para poder actualizar.</span>
          </p>

          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="btn-primary flex-1 gap-2 py-2 text-sm sm:py-1.5"
              :disabled="!!update.blockedBy.value"
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
