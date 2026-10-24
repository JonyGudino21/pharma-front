/**
 * Textos y tonos de la cobranza (ADR-0029). Lógica pura: el servidor decide
 * el estado y los días; aquí sólo se dice en palabras y se elige el color.
 */

export type EstadoCobro = 'VENCIDA' | 'POR_VENCER' | 'AL_CORRIENTE' | 'SIN_FECHA'
export type Antiguedad = 'AL_CORRIENTE' | 'D1_30' | 'D31_60' | 'D61_90' | 'D90_MAS' | 'SIN_FECHA'

/** Tonos del termómetro: de tranquilo a urgente; "sin fecha" aparte, neutro. */
export type Tono = 'ok' | 'soon' | 'late1' | 'late2' | 'late3' | 'late4' | 'none'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** "Vencida hace 12 días", "Vence hoy", "Vence en 3 días", "Sin fecha de pago". */
export function textoEstado(estado: EstadoCobro, dias: number): string {
  switch (estado) {
    case 'VENCIDA':
      return `Vencida hace ${plural(dias, 'día', 'días')}`
    case 'POR_VENCER':
    case 'AL_CORRIENTE':
      if (dias === 0) return 'Vence hoy'
      if (dias === 1) return 'Vence mañana'
      return `Vence en ${dias} días`
    default:
      return 'Sin fecha de pago'
  }
}

export function tonoEstado(estado: EstadoCobro, dias: number): Tono {
  if (estado === 'SIN_FECHA') return 'none'
  if (estado === 'AL_CORRIENTE') return 'ok'
  if (estado === 'POR_VENCER') return 'soon'
  return tonoAntiguedad(antiguedadDe(dias))
}

function antiguedadDe(diasAtraso: number): Antiguedad {
  if (diasAtraso <= 30) return 'D1_30'
  if (diasAtraso <= 60) return 'D31_60'
  if (diasAtraso <= 90) return 'D61_90'
  return 'D90_MAS'
}

export const ANTIGUEDAD_META: Record<Antiguedad, { label: string; short: string; tono: Tono }> = {
  AL_CORRIENTE: { label: 'Al corriente', short: 'Al corriente', tono: 'ok' },
  D1_30: { label: 'Vencido 1 a 30 días', short: '1–30 días', tono: 'late1' },
  D31_60: { label: 'Vencido 31 a 60 días', short: '31–60 días', tono: 'late2' },
  D61_90: { label: 'Vencido 61 a 90 días', short: '61–90 días', tono: 'late3' },
  D90_MAS: { label: 'Vencido más de 90 días', short: '+90 días', tono: 'late4' },
  SIN_FECHA: { label: 'Sin fecha de pago', short: 'Sin fecha', tono: 'none' },
}

export function tonoAntiguedad(a: Antiguedad): Tono {
  return ANTIGUEDAD_META[a].tono
}

/**
 * Clases por tono. Fondo sólido (barra), suave (chip) y texto. Escala de color
 * del sistema: success → warning → orange → error; "sin fecha" en gris.
 */
export const TONO_CLASES: Record<Tono, { bar: string; chip: string; dot: string }> = {
  ok: {
    bar: 'bg-success-500',
    chip: 'bg-success-50 text-success-700 ring-success-600/20 dark:bg-success-500/10 dark:text-success-300',
    dot: 'bg-success-500',
  },
  soon: {
    bar: 'bg-primary-500',
    chip: 'bg-primary-50 text-primary-700 ring-primary-600/20 dark:bg-primary-500/10 dark:text-primary-300',
    dot: 'bg-primary-500',
  },
  late1: {
    bar: 'bg-warning-400',
    chip: 'bg-warning-50 text-warning-800 ring-warning-600/20 dark:bg-warning-500/10 dark:text-warning-300',
    dot: 'bg-warning-400',
  },
  late2: {
    bar: 'bg-orange-500',
    chip: 'bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  late3: {
    bar: 'bg-error-500',
    chip: 'bg-error-50 text-error-700 ring-error-600/20 dark:bg-error-500/10 dark:text-error-300',
    dot: 'bg-error-500',
  },
  late4: {
    bar: 'bg-error-800',
    chip: 'bg-error-100 text-error-900 ring-error-700/30 dark:bg-error-500/20 dark:text-error-200',
    dot: 'bg-error-800',
  },
  none: {
    bar: 'bg-gray-300 dark:bg-gray-600',
    chip: 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-700/60 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
}

/**
 * Segmentos del termómetro de antigüedad: ancho proporcional al monto, con un
 * mínimo visible para que una columna con dinero nunca desaparezca.
 */
export function segmentos<T extends { amount: string | number }>(
  columnas: T[],
  minimoPct = 2,
): (T & { pct: number })[] {
  const montos = columnas.map((c) => Math.max(0, Number(c.amount) || 0))
  const total = montos.reduce((a, b) => a + b, 0)
  if (total <= 0) return []
  const crudos = montos.map((m) => (m > 0 ? Math.max(minimoPct, (m / total) * 100) : 0))
  const suma = crudos.reduce((a, b) => a + b, 0)
  return columnas
    .map((c, i) => ({ ...c, pct: (crudos[i]! / suma) * 100 }))
    .filter((c) => c.pct > 0)
}

/** AAAA-MM-DD → "23 oct 2026" (sin desfase de zona horaria). */
export function fechaCorta(ymd: string | null | undefined): string {
  if (!ymd) return '—'
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number)
  const fecha = new Date(Date.UTC(y!, m! - 1, d!))
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Hoy + días, como AAAA-MM-DD en la zona de la farmacia. */
export function ymdEnDias(dias: number, now: Date = new Date()): string {
  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const base = new Date(`${hoy}T00:00:00Z`)
  base.setUTCDate(base.getUTCDate() + dias)
  return base.toISOString().slice(0, 10)
}

/**
 * Estado de un saldo a partir de su fecha de pago (mismo criterio que el
 * servidor): vence "hoy" todavía no está vencida.
 */
export function estadoDe(
  dueDate: string | null | undefined,
  hoy: string,
  porVencerDias: number,
): { status: EstadoCobro; days: number } {
  if (!dueDate) return { status: 'SIN_FECHA', days: 0 }
  const faltan = Math.round((Date.parse(dueDate.slice(0, 10)) - Date.parse(hoy)) / 86_400_000)
  if (faltan < 0) return { status: 'VENCIDA', days: -faltan }
  return { status: faltan <= porVencerDias ? 'POR_VENCER' : 'AL_CORRIENTE', days: faltan }
}
