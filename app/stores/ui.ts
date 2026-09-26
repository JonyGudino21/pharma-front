import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/** Un fallo de servidor con su referencia de traza. */
export interface Incidente {
  requestId: string
  /** ISO. Sin la hora, la referencia no se puede cruzar con los logs. */
  ocurridoEn: string
  /** Ruta donde ocurrió: acota la búsqueda en los logs. */
  ruta: string
}

const CLAVE_SESION = 'pharma.incidentes'
const MAX_INCIDENTES = 10

export const useUIStore = defineStore('ui', () => {
  // El menú lateral inicia abierto en el desktop
  const sidebarCollapsed = ref(false)

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // NOTA: El modo oscuro ya lo maneja internamente

  // ═══════════════════════════════════════════════════════════════════
  // REGISTRO DE INCIDENTES (requestId utilizable)
  //
  // El aviso de error mostraba `requestId.slice(0, 8)`: ocho caracteres de un
  // UUID. Con ese fragmento el soporte no puede buscar nada en los logs, y el
  // cajero tampoco puede copiarlo porque el toast se va en cuatro segundos.
  // La referencia existía sólo para tranquilizar, no para diagnosticar.
  //
  // Aquí se guarda COMPLETA, con hora y ruta, sobrevive al F5 y se puede copiar.
  // ═══════════════════════════════════════════════════════════════════
  const incidentes = ref<Incidente[]>([])

  const ultimoIncidente = computed<Incidente | null>(
    () => incidentes.value[0] ?? null,
  )
  const hayIncidentes = computed(() => incidentes.value.length > 0)

  /**
   * sessionStorage y no localStorage: la referencia sirve para la llamada a
   * soporte de AHORA. Conservarla entre sesiones sólo acumularía ruido de fallos
   * ya resueltos, y el cajero no distinguiría el de hoy del de la semana pasada.
   */
  function leerDeSesion() {
    if (!import.meta.client) return
    try {
      const crudo = sessionStorage.getItem(CLAVE_SESION)
      if (!crudo) return
      const datos = JSON.parse(crudo)
      if (Array.isArray(datos)) incidentes.value = datos.slice(0, MAX_INCIDENTES)
    } catch {
      // Un sessionStorage corrupto o bloqueado por el navegador no debe tumbar
      // la aplicación: el registro es una ayuda, no un requisito.
    }
  }

  function escribirEnSesion() {
    if (!import.meta.client) return
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(incidentes.value))
    } catch {
      // Modo privado o cuota agotada: se pierde la persistencia, no el aviso.
    }
  }

  function registrarIncidente(requestId: string) {
    if (!requestId) return

    // Un fallo que se repite en bucle (el POS reintentando) no debe llenar la
    // lista con la misma referencia veinte veces.
    if (incidentes.value[0]?.requestId === requestId) return

    incidentes.value = [
      {
        requestId,
        ocurridoEn: new Date().toISOString(),
        ruta: import.meta.client ? window.location.pathname : '',
      },
      ...incidentes.value,
    ].slice(0, MAX_INCIDENTES)

    escribirEnSesion()
  }

  function limpiarIncidentes() {
    incidentes.value = []
    if (import.meta.client) {
      try {
        sessionStorage.removeItem(CLAVE_SESION)
      } catch {
        /* nada que hacer */
      }
    }
  }

  /** Texto listo para pegar en un correo o un ticket de soporte. */
  function textoParaSoporte(incidente: Incidente): string {
    return [
      `Referencia: ${incidente.requestId}`,
      `Hora: ${new Date(incidente.ocurridoEn).toLocaleString('es-MX')}`,
      `Pantalla: ${incidente.ruta || 'desconocida'}`,
    ].join('\n')
  }

  return {
    sidebarCollapsed,
    toggleSidebar,
    incidentes,
    ultimoIncidente,
    hayIncidentes,
    leerDeSesion,
    registrarIncidente,
    limpiarIncidentes,
    textoParaSoporte,
  }
})
