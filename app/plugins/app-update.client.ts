import { defineNuxtPlugin } from '#app'
import { useAppUpdate } from '~/composables/useAppUpdate'

/**
 * Traduce los avisos de Nuxt sobre una versión nueva a estado de la interfaz.
 *
 * NO recarga nada: `emitRouteChunkError: 'manual'` (nuxt.config.ts) desactiva la
 * recarga automática. Quien decide cuándo actualizar es el usuario, desde
 * `AppUpdateBanner`, y sólo cuando no hay una operación en curso.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const update = useAppUpdate()

  // Hay una versión publicada distinta de la que está cargada.
  nuxtApp.hook('app:manifest:update', () => update.markAvailable('manifest'))

  // Falló la descarga de un archivo de la versión vieja (ya no existe en el
  // servidor): esa pantalla sólo funcionará con la versión nueva.
  nuxtApp.hook('app:chunkError', () => update.markAvailable('chunk'))
})
