<script setup lang="ts">
/**
 * Tarjeta de sección para las pantallas de Configuración.
 *
 * Misma piel que el resto de la aplicación (tarjeta blanca redondeada, borde
 * suave, modo oscuro) para que Configuración no parezca otra aplicación. La
 * pantalla de ticket anterior usaba su propia paleta verde y dorada, sin modo
 * oscuro, y rompía con todo lo demás.
 */
defineProps<{
  title: string
  description?: string
  icon?: string
  /** Marca visual de "hay cambios sin guardar en esta sección". */
  dirty?: boolean
}>()
</script>

<template>
  <section class="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <header class="flex items-start gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
      <span
        v-if="icon"
        class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
        aria-hidden="true"
      >
        <Icon :name="icon" class="h-5 w-5" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          {{ title }}
          <span
            v-if="dirty"
            class="inline-flex items-center gap-1 rounded-full bg-warning-500/10 px-2 py-0.5 text-[11px] font-medium text-warning-700 dark:text-warning-400"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-warning-500" aria-hidden="true" />
            Sin guardar
          </span>
        </h2>
        <p v-if="description" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
      </div>
      <slot name="actions" />
    </header>
    <div class="px-5 py-5">
      <slot />
    </div>
  </section>
</template>
