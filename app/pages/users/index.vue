<script setup lang="ts">
/**
 * La administración de usuarios se mudó a Configuración › Usuarios, junto a
 * Permisos. Esta ruta se conserva para enlaces y marcadores existentes.
 */
definePageMeta({
  requiredPermission: 'canManageUsers',
  middleware: [() => navigateTo('/settings/users', { replace: true })],
})
</script>

<template>
  <div />
</template>
