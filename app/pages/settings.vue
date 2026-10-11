<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { visibleSettingsSections } from '~/utils/settings-sections'

/**
 * Contenedor de Configuración: pestañas + la sección activa (<NuxtPage />).
 * Cada sección declara su propio permiso en `definePageMeta`; aquí sólo se
 * ocultan las pestañas que el usuario no podría abrir.
 */
const auth = useAuthStore()
const route = useRoute()
const sections = computed(() => visibleSettingsSections((p) => auth.can(p)))

// En celular las pestañas se desplazan de lado: la activa se trae a la vista
// para que no quede escondida fuera de la pantalla al entrar a una sección.
const nav = ref<HTMLElement | null>(null)
function revealActive() {
  nextTick(() => {
    const active = nav.value?.querySelector<HTMLElement>('[aria-current="page"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center' })
  })
}
onMounted(revealActive)
watch(() => route.path, revealActive)
</script>

<template>
  <div class="mx-auto min-w-0 max-w-7xl space-y-4 sm:space-y-6">
    <nav
      ref="nav"
      aria-label="Secciones de configuración"
      class="-mx-1 snap-x overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul class="flex w-max min-w-full gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <li v-for="s in sections" :key="s.to" class="snap-start">
          <NuxtLink
            :to="s.to"
            class="flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-300 dark:hover:bg-gray-700/60 dark:hover:text-white"
            active-class="!bg-primary-600 !text-white shadow-sm"
          >
            <Icon :name="s.icon" class="h-4 w-4 shrink-0" />
            {{ s.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <NuxtPage />
  </div>
</template>
