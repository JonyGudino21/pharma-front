import { ref, computed, type Ref } from 'vue'

/** Cómo terminó la última petición de un recurso. */
export type EstadoPeticion = 'inicial' | 'cargando' | 'ok' | 'error'

export interface FalloPeticion {
  /** Mensaje ya apto para mostrar al usuario. */
  mensaje: string
  /** Código HTTP, cuando lo hubo. Ausente en fallos de red o timeouts. */
  estado?: number
  /** Referencia de traza para soporte, si el backend la envió. */
  requestId?: string
  /** true cuando reintentar tiene sentido (red, timeout, 5xx, 409). */
  reintentable: boolean
}

const mensajePorEstado = (estado?: number, mensajeBackend?: string): string => {
  if (mensajeBackend) return mensajeBackend
  if (estado === undefined) return 'No se pudo conectar con el servidor.'
  if (estado === 403) return 'No tienes permiso para consultar esta información.'
  if (estado === 404) return 'La información solicitada ya no existe.'
  if (estado >= 500) return 'El servidor tuvo un problema al preparar estos datos.'
  return 'No se pudo cargar la información.'
}

const extraerFallo = (error: unknown): FalloPeticion => {
  const e = error as {
    response?: { status?: number; _data?: { message?: string; error?: { requestId?: string } } }
    statusCode?: number
    message?: string
    name?: string
  }

  const estado = e?.response?.status ?? e?.statusCode
  const mensajeBackend = e?.response?._data?.message
  const requestId = e?.response?._data?.error?.requestId

  const esTimeout =
    e?.name === 'AbortError' || /timeout|network|fetch failed/i.test(e?.message ?? '')

  return {
    mensaje: mensajePorEstado(estado, mensajeBackend),
    estado,
    requestId,
    // 403 y 404 no se arreglan reintentando: ofrecer el botón sólo enseña al
    // usuario a pulsarlo en vano y esconde que el problema es de permisos.
    reintentable: esTimeout || estado === undefined || estado >= 500 || estado === 409,
  }
}

/**
 * Estado de una carga de datos: distingue "no hay resultados" de "no se pudo
 * cargar".
 *
 * ─── EL PROBLEMA QUE CIERRA ───
 * Los stores sólo tenían `isLoading`. Cuando una petición fallaba:
 *
 *   try { ... } finally { isLoading.value = false }
 *
 * la bandera bajaba, la lista se quedaba vacía y la pantalla pintaba
 * "No hay ventas registradas". El usuario concluía que no había datos —cuando
 * en realidad el servidor estaba caído— y encima no tenía ningún botón para
 * volver a intentarlo: la única salida era F5, que en el POS destruye el
 * carrito. Un fallo de infraestructura se presentaba como un hecho de negocio.
 *
 * ─── USO ───
 *     const ventas = useRequestState<SaleListRow[]>([])
 *     await ventas.run(() => $api(...).then(r => r.data.sales))
 *     // ventas.datos / ventas.cargando / ventas.fallo / ventas.vacio
 *     // ventas.reintentar()  ← repite la última operación
 */
export function useRequestState<T>(valorInicial: T) {
  // El `as Ref<T>` es necesario: `ref()` desenvuelve los tipos anidados y con
  // un genérico sin restringir TypeScript no puede demostrar que el resultado
  // siga siendo `Ref<T>`.
  const datos = ref<T>(valorInicial) as Ref<T>
  const estado = ref<EstadoPeticion>('inicial')
  const fallo = ref<FalloPeticion | null>(null)

  /**
   * Se guarda la última operación para que `reintentar()` no obligue a cada
   * pantalla a recordar con qué filtros y qué página se pidió.
   */
  let ultimaOperacion: (() => Promise<T>) | null = null

  const cargando = computed(() => estado.value === 'cargando')
  const conError = computed(() => estado.value === 'error')

  /**
   * Vacío SÓLO cuando la carga terminó bien. Es la distinción central: sin la
   * comprobación de `estado === 'ok'`, un error se pintaría como lista vacía,
   * que es exactamente el bug que esto corrige.
   */
  const vacio = computed(() => {
    if (estado.value !== 'ok') return false
    const v = datos.value as unknown
    if (Array.isArray(v)) return v.length === 0
    return v === null || v === undefined
  })

  async function run(operacion: () => Promise<T>): Promise<T | null> {
    ultimaOperacion = operacion
    estado.value = 'cargando'
    // El fallo anterior se limpia al empezar: mostrar el error viejo junto al
    // spinner de la nueva carga sólo confunde.
    fallo.value = null

    try {
      const resultado = await operacion()
      datos.value = resultado
      estado.value = 'ok'
      return resultado
    } catch (error) {
      fallo.value = extraerFallo(error)
      estado.value = 'error'
      // Los datos anteriores NO se borran: si el usuario ya estaba viendo la
      // página 2 y falla la 3, es mejor conservar lo que tiene delante que
      // vaciarle la tabla.
      return null
    }
  }

  function reintentar(): Promise<T | null> {
    if (!ultimaOperacion) return Promise.resolve(null)
    return run(ultimaOperacion)
  }

  function reset() {
    datos.value = valorInicial
    estado.value = 'inicial'
    fallo.value = null
    ultimaOperacion = null
  }

  // Se devuelven los refs tal cual, sin `readonly()`: envolverlos produce
  // `DeepReadonly<FalloPeticion>`, que no encaja con la prop `FalloPeticion`
  // del componente que los pinta y obligaría a castear en cada plantilla.
  // La disciplina de no escribirlos desde fuera se documenta aquí en lugar de
  // imponerse con un tipo que estorba más de lo que protege.
  return {
    datos,
    estado,
    fallo,
    cargando,
    conError,
    vacio,
    run,
    reintentar,
    reset,
  }
}
