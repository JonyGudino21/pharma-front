<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { visibleSettingsSections } from '~/utils/settings-sections'

/**
 * Contenedor de Configuración: pestañas + la sección activa (<NuxtPage />).
 * Cada sección declara su propio permiso en `definePageMeta`; aquí sólo se
 * ocultan las pestañas que el usuario no podría abrir.
 */
const auth = useAuthStore()
const sections = computed(() => visibleSettingsSections((p) => auth.can(p)))
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <nav aria-label="Secciones de configuración" class="-mx-1 overflow-x-auto px-1">
      <ul class="flex w-max min-w-full gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <li v-for="s in sections" :key="s.to">
          <NuxtLink
            :to="s.to"
            class="flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-300 dark:hover:bg-gray-700/60 dark:hover:text-white"
            active-class="!bg-primary-600 !text-white shadow-sm"
          >
            <Icon :name="s.icon" class="h-4 w-4" />
            {{ s.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <NuxtPage />
  </div>
</template>
