<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { visibleSettingsSections } from '~/utils/settings-sections'

/**
 * /settings a secas: lleva a la primera sección que el usuario puede abrir.
 * Sin ninguna, al inicio (el menú ni siquiera muestra Configuración).
 */
definePageMeta({
  middleware: [
    () => {
      const auth = useAuthStore()
      const first = visibleSettingsSections((p) => auth.can(p))[0]
      return navigateTo(first?.to ?? '/', { replace: true })
    },
  ],
})
</script>

<template>
  <div />
</template>
