<template>
  <!--
    Celular: a todo el ancho, bajo la barra superior (h-14) y bajo el aviso de
    conexión si lo hay (--pp-top-stack lo publica ConnectivityBanner).
    Laptop: esquina superior derecha, como siempre.
  -->
  <div
    class="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)_+_4rem_+_var(--pp-top-stack,0px))] z-[60] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:top-[calc(1rem_+_var(--pp-top-stack,0px))] sm:w-96"
  >
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto flex items-center p-3 sm:p-4 rounded-lg shadow-lg border w-full transition-all duration-300"
        :role="toast.type === 'error' ? 'alert' : 'status'"
        :class="{
          'bg-white dark:bg-gray-800 border-success-500': toast.type === 'success',
          'bg-white dark:bg-gray-800 border-error-500': toast.type === 'error',
          'bg-white dark:bg-gray-800 border-warning-500': toast.type === 'warning',
          'bg-white dark:bg-gray-800 border-primary-500': toast.type === 'info'
        }"
      >
        <Icon v-if="toast.type === 'success'" name="ph:check-circle-fill" class="text-success-500 text-2xl mr-3 shrink-0" />
        <Icon v-if="toast.type === 'error'" name="ph:warning-circle-fill" class="text-error-500 text-2xl mr-3 shrink-0" />
        <Icon v-if="toast.type === 'warning'" name="ph:warning-fill" class="text-warning-500 text-2xl mr-3 shrink-0" />
        <Icon v-if="toast.type === 'info'" name="ph:info-fill" class="text-primary-500 text-2xl mr-3 shrink-0" />

        <p class="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 wrap-break-word">
          {{ toast.message }}
        </p>

        <button type="button" aria-label="Cerrar aviso" @click="remove(toast.id)" class="-my-1 -mr-1 ml-2 shrink-0 rounded-md p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'

// Consumimos el estado reactivo que creamos en la Fase 2
const { toasts, remove } = useToast()
</script>

<style scoped>
/* Animaciones suaves de entrada y salida */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>