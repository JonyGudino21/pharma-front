<template>
  <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
    <div 
      class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all"
    >
      <div class="p-6 text-center">
        <div 
          class="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4"
          :class="{
            'bg-error-100 dark:bg-error-900/30 text-error-600': type === 'danger',
            'bg-warning-100 dark:bg-warning-900/30 text-warning-600': type === 'warning',
            'bg-primary-100 dark:bg-primary-900/30 text-primary-600': type === 'info'
          }"
        >
          <Icon v-if="type === 'danger'" name="ph:warning-circle-bold" class="h-8 w-8" />
          <Icon v-if="type === 'warning'" name="ph:warning-bold" class="h-8 w-8" />
          <Icon v-if="type === 'info'" name="ph:info-bold" class="h-8 w-8" />
        </div>
        
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ title }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">{{ message }}</p>
        
        <div class="flex justify-center gap-3">
          <button @click="$emit('cancel')" class="btn-secondary w-full sm:w-auto">
            {{ cancelText }}
          </button>
          <button 
            @click="$emit('confirm')" 
            :disabled="isLoading"
            class="w-full sm:w-auto text-white flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
            :class="{
              'bg-error-600 hover:bg-error-700 focus:ring-error-500': type === 'danger',
              'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500': type === 'warning',
              'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500': type === 'info'
            }"
          >
            <Icon v-if="isLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
            {{ isLoading ? 'Procesando...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  type: { type: String, default: 'danger', validator: (val: string) => ['danger', 'warning', 'info'].includes(val) },
  isLoading: { type: Boolean, default: false }
})

defineEmits(['confirm', 'cancel'])
</script>