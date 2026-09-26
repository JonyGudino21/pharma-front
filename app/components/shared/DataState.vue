<template>
  <!--
    Las TRES situaciones de una carga de datos, en un solo sitio.

    Antes cada pantalla resolvía esto a mano y todas cometían la misma omisión:
    contemplaban "cargando" y "sin resultados", pero no "falló la carga". Un
    servidor caído se pintaba como "No hay productos", sin botón de reintento.

    Uso:
      <SharedDataState :cargando="p.cargando" :fallo="p.fallo" :vacio="p.vacio"
                       mensaje-vacio="Aún no hay compras registradas."
                       @reintentar="p.reintentar">
        <TablaDeCompras :filas="p.datos" />
      </SharedDataState>
  -->

  <!-- 1. CARGANDO -->
  <div v-if="cargando" class="flex flex-col items-center justify-center gap-3 py-12">
    <Icon name="ph:circle-notch-bold" class="animate-spin text-3xl text-primary-500" />
    <p class="text-sm text-gray-500 dark:text-gray-400">{{ mensajeCargando }}</p>
  </div>

  <!-- 2. FALLÓ LA CARGA (≠ sin resultados) -->
  <div
    v-else-if="fallo"
    class="flex flex-col items-center justify-center gap-3 rounded-lg border border-error-500/40 bg-error-500/5 py-12 px-6 text-center"
    role="alert"
  >
    <Icon name="ph:cloud-slash-fill" class="text-4xl text-error-500" />

    <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
      {{ fallo.mensaje }}
    </p>

    <p class="max-w-md text-xs text-gray-500 dark:text-gray-400">
      Esto no significa que no haya información: no pudimos consultarla.
      <span v-if="fallo.reintentable">Puedes volver a intentarlo.</span>
    </p>

    <button
      v-if="fallo.reintentable"
      type="button"
      class="mt-1 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      @click="emit('reintentar')"
    >
      <Icon name="ph:arrow-clockwise-bold" />
      Reintentar
    </button>

    <!--
      La referencia se muestra completa. Recortarla a ocho caracteres la vuelve
      inútil para buscar en los logs, que es su única razón de existir.
    -->
    <code
      v-if="fallo.requestId"
      class="mt-1 wrap-break-word rounded bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-600 select-all dark:bg-gray-900 dark:text-gray-300"
    >
      {{ fallo.requestId }}
    </code>
  </div>

  <!-- 3. CARGÓ BIEN Y NO HAY NADA -->
  <div
    v-else-if="vacio"
    class="flex flex-col items-center justify-center gap-2 py-12 text-center"
  >
    <Icon :name="iconoVacio" class="text-4xl text-gray-300 dark:text-gray-600" />
    <p class="text-sm text-gray-500 dark:text-gray-400">{{ mensajeVacio }}</p>
    <slot name="accion-vacio" />
  </div>

  <!-- 4. HAY DATOS -->
  <slot v-else />
</template>

<script setup lang="ts">
import type { FalloPeticion } from '~/composables/useRequestState'

withDefaults(
  defineProps<{
    cargando?: boolean
    fallo?: FalloPeticion | null
    vacio?: boolean
    mensajeCargando?: string
    mensajeVacio?: string
    iconoVacio?: string
  }>(),
  {
    cargando: false,
    fallo: null,
    vacio: false,
    mensajeCargando: 'Cargando información…',
    mensajeVacio: 'No hay información para mostrar.',
    iconoVacio: 'ph:tray',
  },
)

const emit = defineEmits<{ reintentar: [] }>()
</script>
