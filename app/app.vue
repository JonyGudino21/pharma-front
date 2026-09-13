<template>
  <div>
    <NuxtRouteAnnouncer />

    <GlobalToast />

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
