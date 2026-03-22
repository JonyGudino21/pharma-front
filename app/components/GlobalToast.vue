<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="flex items-center p-4 rounded-lg shadow-lg border max-w-sm w-full transition-all duration-300"
        :class="{
          'bg-white dark:bg-gray-800 border-success-500': toast.type === 'success',
          'bg-white dark:bg-gray-800 border-error-500': toast.type === 'error',
          'bg-white dark:bg-gray-800 border-warning-500': toast.type === 'warning'
        }"
      >
        <Icon v-if="toast.type === 'success'" name="ph:check-circle-fill" class="text-success-500 text-2xl mr-3 shrink-0" />
        <Icon v-if="toast.type === 'error'" name="ph:warning-circle-fill" class="text-error-500 text-2xl mr-3 shrink-0" />
        <Icon v-if="toast.type === 'warning'" name="ph:warning-fill" class="text-warning-500 text-2xl mr-3 shrink-0" />

        <p class="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 wrap-break-word">
          {{ toast.message }}
        </p>

        <button @click="remove(toast.id)" class="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
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