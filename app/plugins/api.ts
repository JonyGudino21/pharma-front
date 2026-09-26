import { defineNuxtPlugin, useRuntimeConfig, useCookie } from '#app'
import type { FetchOptions, FetchRequest } from 'ofetch'
import { useToast } from '~/composables/useToast'
import { useUIStore } from '~/stores/ui'

/**
 * Métodos HTTP admitidos, EXACTAMENTE como los declara el `$fetch` de Nuxt.
 *
 * `FetchOptions` de ofetch declara `method?: string` —cualquier cadena—, pero el
 * `$fetch` que Nuxt inyecta es un `NitroFetch` con una unión cerrada. Al hacer
 * `{ ...options, headers }` y pasárselo, TypeScript veía `string | undefined`
 * contra esa unión y lo rechazaba:
 *
 *   TS2345: Type 'string' is not assignable to type '"GET" | "POST" | ...'
 *
 * Estrechar el tipo aquí, en lugar de castear en la llamada, tiene una ventaja
 * real: un `method: 'PSOT'` mal escrito se detecta al compilar en vez de salir
 * como un 405 en producción.
 */
type MetodoHttp =
  | 'GET'
  | 'HEAD'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'get'
  | 'head'
  | 'patch'
  | 'post'
  | 'put'
  | 'delete'
  | 'connect'
  | 'options'
  | 'trace'

/** Opciones públicas de `$api`: las de ofetch con el método ya estrechado. */
export type ApiOptions = Omit<FetchOptions, 'method'> & { method?: MetodoHttp }

/**
 * Respuesta de POST /auth/refresh.
 *
 * Desde la Fase 4 NO trae tokens: llegan en cabeceras `Set-Cookie` que el
 * navegador procesa sin que este código las vea. Sólo se declara la caducidad,
 * que es informativa.
 */
interface RefreshResponse {
  data?: {
    refreshExpiresAt?: string
  }
}

/**
 * Marca legible de "hay sesión". La escribe el backend junto a las cookies
 * httpOnly. No es una credencial —su valor es `1`— y sirve para evitar pedir
 * una renovación cuando no hay ninguna sesión que renovar.
 */
const MARCA_DE_SESION = 'session_active'

/**
 * Rutas que NUNCA deben disparar la renovación de sesión.
 *
 * Si `/auth/refresh` devuelve 401 y lo tratáramos como cualquier otro 401,
 * llamaríamos a refresh para arreglar el fallo de refresh: recursión infinita
 * contra el servidor hasta que el throttler (30/min) corte. `/auth/login`
 * entra en la lista porque un 401 ahí significa contraseña incorrecta, no
 * sesión caducada.
 */
//
// `/auth/change-password` también: ahí un 401 significa "la contraseña actual no
// es correcta". Si se tratara como sesión caducada, el plugin renovaría, el
// reintento volvería a dar 401 y el usuario acabaría EXPULSADO por equivocarse
// al teclear su contraseña actual.
const RUTAS_SIN_RENOVACION = [
  '/auth/refresh',
  '/auth/login',
  '/auth/logout',
  '/auth/change-password',
]

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
  let renovacionEnCurso: Promise<boolean> | null = null
  let sesionExpiradaAvisada = false

  const raw = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,

    // TIMEOUT EXPLÍCITO: sin él, una petición que nunca responde dejaba el POS
    // congelado con `busy` en true — Cobrar y Descartar deshabilitados y sin
    // mensaje. La única salida era F5, que además destruía la venta en curso.
    timeout: 15_000,

    // ─────────────────────────────────────────────────────────────────────
    // CREDENCIALES POR COOKIE (Fase 4).
    //
    // `include` es OBLIGATORIO: el API vive en otro origen (puerto distinto en
    // desarrollo, subdominio en producción) y, sin esto, el navegador NO envía
    // las cookies en peticiones cross-origin. El síntoma sería un 401 en todo,
    // con la cookie perfectamente guardada y visible en DevTools — de los
    // errores más difíciles de diagnosticar si no se conoce la regla.
    //
    // Requiere, del lado del backend, CORS con `credentials: true` y una lista
    // de orígenes explícita (con `*` el navegador rechaza la combinación).
    // Ya está así en `configure-http.ts`.
    // ─────────────────────────────────────────────────────────────────────
    credentials: 'include',

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

      // Aquí ya NO se adjunta ningún `Authorization`. El token está en una
      // cookie httpOnly que este código no puede leer —ése es justamente el
      // punto— y que el navegador adjunta por su cuenta gracias a
      // `credentials: 'include'`.
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
   * @returns true si la sesión se renovó; false si ya no es recuperable
   */
  function renovarSesion(): Promise<boolean> {
    if (renovacionEnCurso) return renovacionEnCurso

    renovacionEnCurso = (async () => {
      // Si ni siquiera hay marca de sesión, no hay nada que renovar: evitamos
      // una petición inútil al servidor en cada 401 de un usuario anónimo.
      const hayMarca = nuxtApp.runWithContext(
        () => useCookie<string | null>(MARCA_DE_SESION).value,
      ) as string | null | undefined

      if (!hayMarca) return false

      try {
        // SIN CUERPO. El refresh token está en una cookie httpOnly que este
        // código no puede leer; lo adjunta el navegador gracias a
        // `credentials: 'include'`, y el backend lo saca de ahí.
        await raw<RefreshResponse>('/auth/refresh', {
          method: 'POST',
          body: {},
        })

        // Tampoco hay nada que guardar: la respuesta trae `Set-Cookie` y el
        // navegador ya reemplazó access, refresh y marca. Antes este bloque
        // escribía las cookies a mano — justo lo que dejaba el token al alcance
        // de cualquier script.
        return true
      } catch {
        return false
      }
    })().finally(() => {
      // Se libera para que una caducidad posterior pueda volver a renovar.
      renovacionEnCurso = null
    })

    return renovacionEnCurso
  }

  /** Sesión irrecuperable: se avisa UNA vez y se manda al login. */
  function manejarSesionExpirada() {
    // Sólo se puede borrar la MARCA: access y refresh son httpOnly y este código
    // no las alcanza. No es un problema — el token que contienen ya no vale, y
    // caducan solas. Quien las borra de verdad es el backend en /auth/logout.
    nuxtApp.runWithContext(() => {
      useCookie(MARCA_DE_SESION).value = null
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
    options: ApiOptions = {},
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

      const renovada = await renovarSesion()
      if (!renovada) {
        manejarSesionExpirada()
        throw error
      }

      // El reintento va con las MISMAS cabeceras: la credencial nueva ya está en
      // la cookie que el navegador escribió al procesar el `Set-Cookie` de la
      // renovación, y la adjunta él. Conservar `x-request-id` e
      // `Idempotency-Key` es lo que evita que un cobro se duplique.
      //
      // UN SOLO reintento. Si el segundo vuelve a dar 401 con una credencial
      // recién emitida, el problema no es la caducidad: insistir sólo produciría
      // un bucle contra el servidor.
      return await raw<T>(request, { ...options, headers })
    }
  }

  return {
    provide: { api },
  }
})
