import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { useConnectivity, type ConnectivityStatus } from '~/composables/useConnectivity'
import { useToast } from '~/composables/useToast'

/**
 * Vigilante de la conexión con el servidor (ADR-0017).
 *
 * Consulta `GET /health/ready` con un intervalo corto cuando algo falla y largo
 * cuando todo va bien. No usa `$api`: no debe pasar por la renovación de sesión
 * ni por los avisos de error, y la sonda no lleva credenciales.
 *
 * ANTI-PARPADEO: un fallo aislado (un paquete perdido) no enciende el aviso;
 * hacen falta dos seguidos. Recuperarse sí es inmediato.
 */
const INTERVALO_OK_MS = 20_000
const INTERVALO_FALLO_MS = 5_000
const REINTENTO_RAPIDO_MS = 1_500
const TIMEOUT_MS = 4_000
const FALLOS_PARA_AVISAR = 2

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const toast = useToast()
  const conn = useConnectivity()

  // `healthUrl` permite apuntar a otro sitio (p. ej. un proxy que sólo expone
  // /api). Por omisión: el origen del API + /health/ready.
  const url = (() => {
    const explicita = String(config.public.healthUrl || '')
    if (explicita) return explicita
    try {
      return `${new URL(String(config.public.apiBaseUrl), window.location.origin).origin}/health/ready`
    } catch {
      return ''
    }
  })()
  if (!url) return

  let fallosSeguidos = 0
  let temporizador: ReturnType<typeof setTimeout> | undefined
  let enCurso = false

  function programar(ms: number) {
    clearTimeout(temporizador)
    temporizador = setTimeout(() => void sondear(), ms)
  }

  function registrarFallo(estado: Exclude<ConnectivityStatus, 'ok' | 'unknown'>) {
    fallosSeguidos += 1
    if (fallosSeguidos >= FALLOS_PARA_AVISAR) {
      conn.status.value = estado
      programar(INTERVALO_FALLO_MS)
    } else {
      // Primer fallo: se confirma pronto antes de molestar al usuario.
      programar(REINTENTO_RAPIDO_MS)
    }
  }

  function registrarExito() {
    const veniaFallando = conn.status.value === 'server-down' || conn.status.value === 'db-down'
    fallosSeguidos = 0
    conn.status.value = 'ok'
    conn.lastOkAt.value = new Date().toISOString()
    if (veniaFallando) toast.success('Conexión con el servidor restablecida.')
    programar(INTERVALO_OK_MS)
  }

  async function sondear() {
    if (enCurso) return
    enCurso = true
    conn.checking.value = true
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (res.ok) registrarExito()
      // 503 con el cuerpo de /health/ready: el servidor vive, su BD no.
      else if (res.status === 503) registrarFallo('db-down')
      // 404: un servidor sin esa ruta (o un proxy que no la expone) NO es una
      // caída. Mejor no bloquear la operación por una sonda que no existe.
      else if (res.status === 404) registrarExito()
      else registrarFallo('server-down')
    } catch {
      registrarFallo('server-down')
    } finally {
      enCurso = false
      conn.checking.value = false
    }
  }

  // Cualquier señal de que algo cambió acelera la comprobación.
  const ahora = () => void sondear()
  window.addEventListener('online', ahora)
  window.addEventListener('offline', ahora)
  // `$api` (o quien detecte un fallo de red) pide una comprobación inmediata.
  window.addEventListener('pharma:network-suspect', ahora)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ahora()
  })

  programar(1_000)
})
