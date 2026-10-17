import { computed, onScopeDispose, watchEffect } from 'vue'
import { useRuntimeConfig, useState } from '#app'

/**
 * ACTUALIZACIÓN DE LA APLICACIÓN — la decide el usuario, nunca el navegador.
 *
 * ─── EL PROBLEMA ───
 * Al publicar una versión nueva, la pestaña abierta sigue ejecutando la vieja.
 * Nuxt lo detecta (`app:manifest:update`) y, por defecto, RECARGA SOLO en la
 * siguiente navegación; si además un archivo de la versión vieja ya no existe
 * (`app:chunkError`) recarga en el acto. En un punto de venta eso significa que
 * la pantalla se reinicia mientras el cajero cobra, y lo que estaba en memoria
 * (el modal de cobro, un formulario a medias) se pierde sin aviso.
 *
 * ─── LA SOLUCIÓN ───
 * 1. `nuxt.config.ts` desactiva la recarga automática (`emitRouteChunkError:
 *    'manual'`): Nuxt sólo AVISA, no actúa.
 * 2. El plugin `app-update.client.ts` convierte ese aviso en estado.
 * 3. `AppUpdateBanner` pregunta; el usuario elige "Actualizar" o "Más tarde".
 * 4. Mientras alguna pantalla declare una operación en curso (`useUpdateHold`),
 *    "Actualizar" queda bloqueado y se explica por qué. Incluso si algo llamara
 *    a `apply()` directamente, la guarda de aquí lo detiene.
 */

export type UpdateReason = 'manifest' | 'chunk'

/** Cuánto se aplaza el aviso cuando el usuario pulsa "Más tarde". */
export const UPDATE_SNOOZE_MS = 30 * 60 * 1000

/** URL del manifiesto de versión publicado (`/_nuxt/builds/latest.json`). */
export function urlManifiesto(app: { baseURL: string; buildAssetsDir: string }): string {
  return `${app.baseURL.replace(/\/$/, '')}${app.buildAssetsDir.replace(/\/$/, '')}/builds/latest.json`
}

/** ¿El build publicado es distinto del que está corriendo? Sin datos, no. */
export function esVersionNueva(publicado: string | undefined, enEjecucion: string | undefined): boolean {
  return !!publicado && !!enEjecucion && publicado !== enEjecucion
}

export function useAppUpdate() {
  const available = useState<boolean>('app-update:available', () => false)
  const reason = useState<UpdateReason | null>('app-update:reason', () => null)
  const snoozedUntil = useState<number>('app-update:snoozed-until', () => 0)
  /** Operaciones en curso que impiden recargar: clave → motivo legible. */
  const holds = useState<Record<string, string>>('app-update:holds', () => ({}))

  /** Primer motivo que impide actualizar, o null si es seguro. */
  const blockedBy = computed(() => Object.values(holds.value)[0] ?? null)

  function markAvailable(why: UpdateReason) {
    available.value = true
    // Un archivo faltante (chunk) es más grave que "hay algo nuevo": no se baja.
    if (why === 'chunk' || reason.value === null) reason.value = why
    if (why === 'chunk') snoozedUntil.value = 0
  }

  function snooze() {
    // Con archivos faltantes no se puede aplazar: la app ya está a medias.
    if (reason.value === 'chunk') return
    snoozedUntil.value = Date.now() + UPDATE_SNOOZE_MS
  }

  function hold(key: string, why: string) {
    if (holds.value[key] === why) return
    holds.value = { ...holds.value, [key]: why }
  }

  function release(key: string) {
    if (!(key in holds.value)) return
    const { [key]: _quitada, ...resto } = holds.value
    holds.value = resto
  }

  /**
   * Recarga para tomar la versión nueva.
   * @returns false si hay una operación en curso y NO se recargó.
   */
  function apply(): boolean {
    if (blockedBy.value) return false
    if (!import.meta.client) return false
    window.location.reload()
    return true
  }

  /**
   * Revisa YA si hay versión nueva (sin esperar el sondeo de 5 minutos).
   *
   * Se usa cuando el servidor rechaza datos que no reconoce
   * (`CAMPOS_NO_RECONOCIDOS`): casi siempre es una caja con la versión anterior
   * abierta tras publicar una nueva. Compara el `buildId` en ejecución con el
   * manifiesto publicado y, si difieren, muestra el aviso aunque estuviera
   * aplazado. En desarrollo no hay manifiesto: no hace nada.
   * @returns true si hay una versión nueva.
   */
  async function comprobarAhora(): Promise<boolean> {
    if (!import.meta.client) return false
    const { app } = useRuntimeConfig()
    try {
      const r = await fetch(urlManifiesto(app), { cache: 'no-store' })
      if (!r.ok) return false
      const { id } = (await r.json()) as { id?: string }
      if (esVersionNueva(id, app.buildId)) {
        markAvailable('manifest')
        snoozedUntil.value = 0
        return true
      }
    } catch {
      // Sin red o sin manifiesto: el sondeo normal lo intentará después.
    }
    return false
  }

  return { available, reason, snoozedUntil, blockedBy, markAvailable, snooze, hold, release, apply, comprobarAhora }
}

/**
 * Declara que ESTA pantalla tiene una operación en curso mientras `motivo`
 * devuelva un texto. Se libera sola al cambiar a null o al salir de la pantalla.
 *
 *   useUpdateHold('pos', () => hayVentaAbierta.value ? 'Hay una venta en curso.' : null)
 */
export function useUpdateHold(key: string, motivo: () => string | null | false) {
  const update = useAppUpdate()

  watchEffect(() => {
    const why = motivo()
    if (why) update.hold(key, why)
    else update.release(key)
  })

  onScopeDispose(() => update.release(key))
}
