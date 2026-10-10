<template>
  <div>
    <NuxtRouteAnnouncer />

    <GlobalToast />

    <!-- Estado del servidor y versión nueva: fuera del layout para verse siempre. -->
    <SharedConnectivityBanner />
    <SharedAppUpdateBanner />

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
