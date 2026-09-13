import { defineNuxtPlugin, useRuntimeConfig, useCookie } from '#app'
import type { FetchOptions, FetchRequest } from 'ofetch'
import { useToast } from '~/composables/useToast'
import { useUIStore } from '~/stores/ui'

/** Respuesta de POST /auth/refresh. */
interface RefreshResponse {
  data?: {
    accessToken?: string
    refreshToken?: string
    /** Opcional: un backend anterior a la Fase 3 no lo envía. */
    refreshExpiresAt?: string
  }
}

/** Respaldo cuando el backend no informa la caducidad: 1 día, el mínimo real. */
const MAX_AGE_POR_DEFECTO = 60 * 60 * 24

/**
 * Segundos que le quedan de vida a la cookie.
 *
 * Sin esta defensa, un `refreshExpiresAt` ausente o con formato inesperado
 * producía `new Date(undefined).getTime() === NaN`, y ese NaN acababa en
 * `maxAge`. El navegador descarta una cookie con maxAge inválido: la sesión se
 * perdía en el acto, justo en el camino que existe para NO perderla.
 */
const segundosDeVida = (refreshExpiresAt?: string): number => {
  if (!refreshExpiresAt) return MAX_AGE_POR_DEFECTO

  const restante = Math.floor(
    (new Date(refreshExpiresAt).getTime() - Date.now()) / 1000,
  )
  return Number.isFinite(restante) && restante > 60
    ? restante
    : MAX_AGE_POR_DEFECTO
}

/**
 * Rutas que NUNCA deben disparar la renovación de sesión.
 *
 * Si `/auth/refresh` devuelve 401 y lo tratáramos como cualquier otro 401,
 * llamaríamos a refresh para arreglar el fallo de refresh: recursión infinita
 * contra el servidor hasta que el throttler (30/min) corte. `/auth/login`
 * entra en la lista porque un 401 ahí significa contraseña incorrecta, no
 * sesión caducada.
 */
const RUTAS_SIN_RENOVACION = ['/auth/refresh', '/auth/login', '/auth/logout']

const urlDe = (request: unknown): string => {
  if (typeof request === 'string') return request
  // ofetch admite un objeto Request; `String(request)` daría "[object Request]"
  // y ninguna ruta coincidiría, así que el 401 de /auth/refresh sí dispararía
  // otra renovación: justo la recursión que esta lista evita.
  if (request && typeof request === 'object' && 'url' in request) {
    return String((request as { url: unknown }).url ?? '')
  }
  return ''
}

const esRutaSinRenovacion = (request: unknown): boolean => {
  const url = urlDe(request)
  return RUTAS_SIN_RENOVACION.some((ruta) => url.includes(ruta))
}

const estadoDe = (error: unknown): number | undefined =>
  (error as { response?: { status?: number }; statusCode?: number })?.response
    ?.status ?? (error as { statusCode?: number })?.statusCode

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const toast = useToast()

  // ─────────────────────────────────────────────────────────────────────
  // ESTADO POR PETICIÓN, NO POR MÓDULO.
  //
  // Estas tres variables vivían en el ámbito del módulo (`let isRedirectingToLogin`
  // arriba del archivo). En el navegador da igual, pero el módulo se evalúa UNA
  // vez por proceso de Nitro: en SSR el valor quedaba compartido entre todas las
  // peticiones de todos los usuarios. Bastaba con que la sesión de un cajero
  // caducara para que el flag quedara en `true` y NINGÚN otro usuario del
  // servidor volviera a ser redirigido al login.
  //
  // Dentro de la factoría del plugin, Nuxt crea una instancia por petición en el
  // servidor y una sola en el cliente: exactamente el alcance que hace falta.
  // ─────────────────────────────────────────────────────────────────────
  let renovacionEnCurso: Promise<string | null> | null = null
  let sesionExpiradaAvisada = false

  const raw = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,

    // TIMEOUT EXPLÍCITO: sin él, una petición que nunca responde dejaba el POS
    // congelado con `busy` en true — Cobrar y Descartar deshabilitados y sin
    // mensaje. La única salida era F5, que además destruía la venta en curso.
    timeout: 15_000,

    onRequest({ options }) {
      const headers = new Headers(options.headers)

      // El envoltorio de abajo ya fija x-request-id e Idempotency-Key para que
      // sobrevivan al reintento. Aquí sólo se rellenan si faltan (llamadas que
      // no pasan por el envoltorio, como la propia renovación).
      if (!headers.has('x-request-id')) {
        headers.set('x-request-id', crypto.randomUUID())
      }

      const method = (options.method ?? 'GET').toUpperCase()
      if (method === 'POST' || method === 'PATCH') {
        if (!headers.has('Idempotency-Key')) {
          headers.set('Idempotency-Key', crypto.randomUUID())
        }
      }

      // La cookie se lee SÓLO si la cabecera no viene ya puesta, y en ese orden.
      //
      // Dos razones, ambas importantes:
      //   1. Se lee en cada intento, no se captura fuera: tras renovar, el
      //      reintento debe llevar el token nuevo y no el ya caducado.
      //   2. `useCookie` es un composable de Nuxt y necesita su contexto. El
      //      reintento se lanza después de un `await`, donde ese contexto puede
      //      no estar disponible. Como el reintento YA trae el Authorization
      //      explícito, con esta guarda no llega a invocarse `useCookie`.
      if (!headers.has('Authorization')) {
        const accessToken = useCookie('access_token').value
        if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
      } else if (headers.get('Authorization') === '') {
        // La renovación marca "no adjuntes credenciales" con un Authorization
        // vacío (para que la guarda de arriba no lo rellene). Se retira antes de
        // salir: enviar la cabecera vacía es una petición malformada.
        headers.delete('Authorization')
      }
      options.headers = headers
    },

    onRequestError({ error }) {
      // Distinguimos el timeout del corte de red: son acciones distintas para
      // el cajero (reintentar vs. revisar la conexión).
      if (error?.name === 'AbortError' || /timeout/i.test(error?.message ?? '')) {
        toast.error(
          'El servidor tardó demasiado en responder. Verifica la venta antes de reintentar.',
        )
        return
      }
      toast.error('Error de red: No se pudo conectar al servidor')
    },

    onResponseError({ request, response }) {
      // El 401 NO se maneja aquí: el envoltorio decide si se puede renovar la
      // sesión y reintentar. Avisar desde este gancho mostraría "tu sesión
      // expiró" en el caso en que la renovación va a funcionar sin que el
      // cajero note nada.
      if (response.status === 401) {
        // Excepción: en el login un 401 sí es definitivo y su mensaje es útil.
        if (esRutaSinRenovacion(request)) {
          const backendMessage =
            response._data?.message || 'Credenciales incorrectas'
          toast.error(backendMessage)
        }
        return
      }

      // Error interno del servidor (500+)
      if (response.status >= 500) {
        const requestId =
          response._data?.error?.requestId ||
          response.headers.get('x-request-id')
        avisarFalloDeServidor(typeof requestId === 'string' ? requestId : null)
        return
      }

      // Errores de validación o conflictos
      if (response.status === 400 || response.status === 409) {
        const backendMessage =
          response._data?.message || 'Verifica los datos ingresados.'
        toast.error(backendMessage)
        return
      }

      // Sin permiso (403). P1-2 lo volvió visible: un cajero que intentaba
      // anular una venta cerrada recibía un silencio y el botón parecía muerto.
      if (response.status === 403) {
        const backendMessage =
          response._data?.message || 'No tienes permiso para esta operación.'
        toast.error(backendMessage)
        return
      }

      if (response.status === 429) {
        toast.error('Demasiados intentos. Espera un momento e inténtalo de nuevo.')
      }
    },
  })

  /**
   * Renueva la sesión. UNA SOLA petición aunque la pidan veinte a la vez.
   *
   * El backend ROTA el refresh token: la primera renovación invalida el token
   * anterior. Sin esta cola, veinte peticiones caducando juntas (que es el caso
   * normal cuando el POS refresca varias cosas al montar) lanzaban veinte
   * renovaciones con el MISMO token: la primera rotaba y las otras diecinueve
   * recibían "Refresh Token Invalido". El cajero salía expulsado justo cuando
   * la sesión era perfectamente renovable.
   *
   * @returns el nuevo access token, o null si la sesión ya no es recuperable
   */
  function renovarSesion(): Promise<string | null> {
    if (renovacionEnCurso) return renovacionEnCurso

    renovacionEnCurso = (async () => {
      // runWithContext también en la LECTURA: `renovarSesion` se invoca desde
      // el catch del envoltorio, es decir ya después de un `await`, donde el
      // contexto de Nuxt no está activo y `useCookie` fallaría.
      const refreshToken = nuxtApp.runWithContext(
        () => useCookie<string | null>('refresh_token').value,
      ) as string | null | undefined

      if (!refreshToken) return null

      try {
        const res = await raw<RefreshResponse>('/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
          // Sin Authorization: el access token está caducado y mandarlo sólo
          // invita al guard a rechazar la petición antes de leer el cuerpo.
          headers: { Authorization: '' },
        })

        const accessToken = res?.data?.accessToken
        const nuevoRefresh = res?.data?.refreshToken

        // Una respuesta 200 con un cuerpo incompleto es peor que un error: si
        // guardáramos `undefined` en la cookie, cada petición posterior iría sin
        // credenciales y el usuario vería 401 sin entender por qué.
        if (!accessToken || !nuevoRefresh) return null

        // maxAge derivado de la caducidad REAL que devuelve el backend, no de un
        // número fijo. Así la cookie muere junto con la fila de UserToken: una
        // cookie que sobrevive a su token produce 401 en bucle, y una que muere
        // antes tira una sesión todavía válida.
        const opciones = {
          maxAge: segundosDeVida(res?.data?.refreshExpiresAt),
          sameSite: 'lax' as const,
        }

        // runWithContext es OBLIGATORIO aquí: estamos después de un `await`, y
        // fuera del contexto de Nuxt `useCookie` no encuentra la instancia. En
        // el navegador suele funcionar por accidente; en SSR lanza
        // "nuxt instance unavailable" y la renovación fallaría siempre.
        nuxtApp.runWithContext(() => {
          useCookie('access_token', opciones).value = accessToken
          useCookie('refresh_token', opciones).value = nuevoRefresh
        })

        return accessToken
      } catch {
        return null
      }
    })().finally(() => {
      // Se libera para que una caducidad posterior pueda volver a renovar.
      renovacionEnCurso = null
    })

    return renovacionEnCurso
  }

  /** Sesión irrecuperable: se avisa UNA vez y se manda al login. */
  function manejarSesionExpirada() {
    // runWithContext: se llama después de esperar a la renovación, fuera del
    // contexto de Nuxt, y `useCookie` lo necesita.
    nuxtApp.runWithContext(() => {
      useCookie('access_token').value = null
      useCookie('refresh_token').value = null
    })

    if (!import.meta.client || sesionExpiradaAvisada) return
    if (window.location.pathname === '/login') return

    sesionExpiradaAvisada = true
    toast.warning('Tu sesión ha expirado por seguridad. Vuelve a iniciar sesión.')

    // Pequeña espera para que el mensaje se lea. Redirección dura: limpia toda
    // la memoria de JS, incluido cualquier carrito a medias en Pinia (que el
    // backend conserva y `resumeDraft()` recupera al volver a entrar).
    setTimeout(() => {
      window.location.href = '/login'
    }, 3000)
  }

  /**
   * Un 500 deja rastro utilizable: la referencia completa queda registrada en el
   * store (persistida y copiable) en lugar de vivir cuatro segundos recortada a
   * ocho caracteres dentro de un toast.
   */
  function avisarFalloDeServidor(requestId: string | null) {
    if (requestId) {
      // El store se resuelve AQUÍ, no al crear el plugin: en el arranque Pinia
      // puede no estar instalado todavía y `useUIStore()` lanzaría. En el
      // momento de un error la aplicación ya está montada.
      try {
        useUIStore().registrarIncidente(requestId)
      } catch {
        // Sin store no perdemos el aviso, sólo el registro persistente.
      }
    }

    toast.error(
      requestId
        ? 'El servidor tuvo un problema. Guardamos la referencia del fallo: puedes copiarla desde el aviso de soporte.'
        : 'El servidor está experimentando problemas. Intenta más tarde.',
    )
  }

  /**
   * Instancia pública. Envuelve a `raw` para poder REINTENTAR tras renovar.
   *
   * `onResponseError` de ofetch no puede devolver una respuesta nueva: sólo
   * observa el fallo. Por eso el reintento vive aquí y no en el gancho.
   */
  const api = async <T = unknown>(
    request: FetchRequest,
    options: FetchOptions = {},
  ): Promise<T> => {
    // Las cabeceras de traza e idempotencia se fijan ANTES del primer intento y
    // se REUTILIZAN en el reintento. Es el punto central del arreglo: si el
    // reintento llevara una Idempotency-Key nueva, un cobro que sí llegó al
    // backend antes del 401 se cobraría DOS veces. Con la misma clave, el
    // backend reconoce el intento y devuelve el cobro original.
    const headers = new Headers(options.headers as HeadersInit | undefined)
    if (!headers.has('x-request-id')) {
      headers.set('x-request-id', crypto.randomUUID())
    }
    const method = String(options.method ?? 'GET').toUpperCase()
    if ((method === 'POST' || method === 'PATCH') && !headers.has('Idempotency-Key')) {
      headers.set('Idempotency-Key', crypto.randomUUID())
    }

    try {
      return await raw<T>(request, { ...options, headers })
    } catch (error) {
      // El reintento se controla con una variable local, no con una opción
      // colada en el objeto de ofetch: nunca hay riesgo de que `_reintentado`
      // viaje en la petición ni de que un segundo 401 vuelva a renovar.
      const renovable =
        estadoDe(error) === 401 && !esRutaSinRenovacion(request)

      if (!renovable) throw error

      const nuevoToken = await renovarSesion()
      if (!nuevoToken) {
        manejarSesionExpirada()
        throw error
      }

      // Authorization explícito: la cookie ya está escrita, pero fijarlo aquí
      // hace el reintento independiente de cuándo se propague la cookie.
      const cabecerasReintento = new Headers(headers)
      cabecerasReintento.set('Authorization', `Bearer ${nuevoToken}`)

      // UN SOLO reintento. Si el segundo intento vuelve a dar 401 con un token
      // recién emitido, el problema no es la caducidad: insistir sólo produciría
      // un bucle contra el servidor.
      return await raw<T>(request, { ...options, headers: cabecerasReintento })
    }
  }

  return {
    provide: { api },
  }
})
