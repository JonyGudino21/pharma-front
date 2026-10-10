import { readonly, ref } from 'vue'

/**
 * PERFIL DE ESTA CAJA (terminal).
 *
 * Vive en el NAVEGADOR de cada caja, no en el servidor, y es deliberado: la
 * impresora USB y el cajón están conectados físicamente a esta computadora, y
 * WebUSB concede el permiso por navegador. Dos cajas = dos perfiles, cada una
 * con su impresora. Si fuera un ajuste del servidor, cambiar la impresora de
 * la caja 1 rompería la caja 2.
 *
 * Lo que sí va al servidor es la AUDITORÍA: el nombre de la caja viaja en cada
 * apertura manual del cajón.
 */

export interface PrinterBinding {
  vendorId: number
  productId: number
  serialNumber: string | null
  /** Nombre que reporta el dispositivo, para reconocerlo en pantalla. */
  label: string
}

export interface TerminalProfile {
  /** "Caja 1", "Mostrador". Aparece en la bitácora del cajón. */
  name: string
  /** Térmica USB (ESC/POS) o diálogo de impresión del navegador. */
  printMode: 'thermal' | 'browser'
  printer: PrinterBinding | null
  /** Imprimir el ticket al cobrar, sin pulsar "Imprimir". Sólo térmica. */
  autoPrint: boolean
  /** Abrir el cajón en cada cobro con efectivo. */
  openDrawerOnCash: boolean
  /** Conector del cajón en la impresora: 0 = pin 2 (habitual), 1 = pin 5. */
  drawerPin: 0 | 1
}

export const DEFAULT_TERMINAL: TerminalProfile = {
  name: 'Caja 1',
  printMode: 'thermal',
  printer: null,
  autoPrint: false,
  openDrawerOnCash: false,
  drawerPin: 0,
}

const STORAGE_KEY = 'pharma.terminal.v1'

/** Lo guardado puede venir de otra versión o estar corrupto: se valida campo a campo. */
export function parseTerminal(raw: unknown): TerminalProfile {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const p = o.printer as Record<string, unknown> | null | undefined
  const printer: PrinterBinding | null =
    p && typeof p.vendorId === 'number' && typeof p.productId === 'number'
      ? {
          vendorId: p.vendorId,
          productId: p.productId,
          serialNumber: typeof p.serialNumber === 'string' ? p.serialNumber : null,
          label: typeof p.label === 'string' ? p.label : 'Impresora USB',
        }
      : null
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 60) : DEFAULT_TERMINAL.name
  return {
    name,
    printMode: o.printMode === 'browser' ? 'browser' : 'thermal',
    printer,
    autoPrint: o.autoPrint === true,
    openDrawerOnCash: o.openDrawerOnCash === true,
    drawerPin: o.drawerPin === 1 ? 1 : 0,
  }
}

// Estado compartido por toda la app (una sola caja por pestaña).
const profile = ref<TerminalProfile>({ ...DEFAULT_TERMINAL })
let loaded = false

function load() {
  if (loaded || !import.meta.client) return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    profile.value = parseTerminal(raw ? JSON.parse(raw) : null)
  } catch {
    // Almacenamiento no disponible o dañado: se trabaja con los valores de
    // fábrica. Imprimir por el navegador siempre funciona.
    profile.value = { ...DEFAULT_TERMINAL }
  }
}

export function useTerminal() {
  load()

  function save(next: TerminalProfile): boolean {
    const clean = parseTerminal(next)
    profile.value = clean
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
      return true
    } catch {
      return false
    }
  }

  return { profile: readonly(profile), save }
}
