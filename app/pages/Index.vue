<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 class="text-2xl font-bold dark:text-white mb-2">Bienvenido, {{ authStore.user?.userName }} 👋</h2>
      <p class="text-gray-600 dark:text-gray-400">Rol actual: <span class="font-semibold text-primary-600">{{ authStore.user?.role }}</span></p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="bg-gray-200 dark:bg-gray-700 h-32 rounded-xl animate-pulse"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
</script>