<template>
  <div>
    <NuxtRouteAnnouncer />

    <GlobalToast />

    <!-- Estado del servidor y versión nueva: fuera del layout para verse siempre. -->
    <SharedConnectivityBanner />
    <SharedAppUpdateBanner />
    <!-- Ayuda contextual: una sola instancia, se abre desde la barra superior. -->
    <HelpPanel />

    <!--
      Fuera del layout a propósito: la referencia de un fallo debe seguir
      visible aunque el cajero navegue a otra pantalla o cambie de layout.
    -->
    <SharedSupportReference />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import HelpPanel from '~/components/help/HelpPanel.vue'
</script>
