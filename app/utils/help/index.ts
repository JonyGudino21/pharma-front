import type { HelpGuide, HelpSection } from './types'
import { caja } from './guides/caja'
import { catalogo } from './guides/catalogo'
import { clientes } from './guides/clientes'
import { compras } from './guides/compras'
import { configuracion } from './guides/configuracion'
import { cuenta } from './guides/cuenta'
import { dispositivos } from './guides/dispositivos'
import { inicio } from './guides/inicio'
import { inventario } from './guides/inventario'
import { pos } from './guides/pos'
import { proveedores } from './guides/proveedores'
import { usuarios } from './guides/usuarios'
import { ventas } from './guides/ventas'

export type { HelpBlock, HelpGuide, HelpSection } from './types'

/**
 * Catálogo de guías. Una guía nueva se registra aquí y, si corresponde a una
 * pantalla, en `ROUTE_GUIDES`.
 */
export const HELP_GUIDES: readonly HelpGuide[] = [
  inicio,
  pos,
  ventas,
  caja,
  inventario,
  catalogo,
  compras,
  proveedores,
  clientes,
  usuarios,
  configuracion,
  dispositivos,
  cuenta,
]

const POR_ID = new Map(HELP_GUIDES.map((g) => [g.id, g]))

export function getGuide(id: string | null | undefined): HelpGuide | null {
  return (id && POR_ID.get(id)) || null
}

/**
 * Qué guía abre el botón "Ayuda" en cada pantalla. Se evalúa en orden: la
 * primera ruta cuyo prefijo coincida gana (las más específicas van primero).
 */
/**
 * `section` (opcional) abre la guía directo en esa sección: en una subpantalla
 * (Caducidades, Deudores…) la duda casi siempre es sobre esa subpantalla.
 */
export const ROUTE_GUIDES: ReadonlyArray<{ prefix: string; guide: string; section?: string }> = [
  { prefix: '/settings/devices', guide: 'dispositivos' },
  { prefix: '/settings/users', guide: 'usuarios' },
  { prefix: '/settings/permissions', guide: 'usuarios' },
  { prefix: '/settings', guide: 'configuracion' },
  { prefix: '/users', guide: 'usuarios' },
  { prefix: '/account', guide: 'cuenta' },
  { prefix: '/pos', guide: 'pos' },
  { prefix: '/sales', guide: 'ventas' },
  { prefix: '/cash-shifts/history', guide: 'caja', section: 'historial' },
  { prefix: '/cash-shifts', guide: 'caja' },
  { prefix: '/inventory/expiring', guide: 'inventario', section: 'caducidades' },
  { prefix: '/inventory/controlled', guide: 'inventario', section: 'controlados' },
  { prefix: '/inventory', guide: 'inventario' },
  { prefix: '/catalog', guide: 'catalogo' },
  { prefix: '/purchases/create', guide: 'compras', section: 'crear-compra' },
  { prefix: '/purchases', guide: 'compras' },
  { prefix: '/suppliers', guide: 'proveedores' },
  { prefix: '/clients/debtors', guide: 'clientes', section: 'deudores' },
  { prefix: '/clients', guide: 'clientes' },
  { prefix: '/', guide: 'inicio' },
]

function matchRoute(path: string) {
  const p = path.replace(/\/+$/, '') || '/'
  return ROUTE_GUIDES.find((r) => (r.prefix === '/' ? p === '/' : p === r.prefix || p.startsWith(`${r.prefix}/`))) ?? null
}

/** Guía de la pantalla actual, o null si no hay una específica. */
export function guideForRoute(path: string): HelpGuide | null {
  const r = matchRoute(path)
  return r ? getGuide(r.guide) : null
}

/** Sección con la que abre la guía en esta pantalla (null = la primera). */
export function sectionForRoute(path: string): string | null {
  return matchRoute(path)?.section ?? null
}

/** Texto plano de una sección (para buscar), sin marcas de formato. */
function textoDe(s: HelpSection): string {
  const partes: string[] = [s.title]
  for (const b of s.blocks) {
    if (b.type === 'p' || b.type === 'tip' || b.type === 'warn') partes.push(b.text)
    else if (b.type === 'steps' || b.type === 'list') partes.push(...b.items)
    else if (b.type === 'faq') for (const i of b.items) partes.push(i.q, i.a)
  }
  return partes.join(' ')
}

/** Sin acentos ni mayúsculas: "caducidad" encuentra "Caducidad" y "cadúcidad". */
export const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export interface HelpHit {
  guide: HelpGuide
  section: HelpSection
}

/** Busca en TODAS las guías; primero las coincidencias en el título de la sección. */
export function searchHelp(query: string, guides: readonly HelpGuide[] = HELP_GUIDES): HelpHit[] {
  const terminos = normalizar(query).split(/\s+/).filter((t) => t.length >= 2)
  if (terminos.length === 0) return []
  const hits: Array<HelpHit & { score: number }> = []
  for (const guide of guides) {
    for (const section of guide.sections) {
      const cuerpo = normalizar(`${guide.title} ${textoDe(section)}`)
      if (!terminos.every((t) => cuerpo.includes(t))) continue
      const titulo = normalizar(section.title)
      const score = terminos.filter((t) => titulo.includes(t)).length * 10 + terminos.length
      hits.push({ guide, section, score })
    }
  }
  return hits.sort((a, b) => b.score - a.score).map(({ guide, section }) => ({ guide, section }))
}

/** Partes de una línea con formato en línea: **negritas** y `teclas`. */
export type InlinePart = { kind: 'text' | 'bold' | 'kbd'; text: string }

export function parseInline(text: string): InlinePart[] {
  const partes: InlinePart[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let ultimo = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > ultimo) partes.push({ kind: 'text', text: text.slice(ultimo, m.index) })
    const tok = m[0]
    partes.push(tok.startsWith('**') ? { kind: 'bold', text: tok.slice(2, -2) } : { kind: 'kbd', text: tok.slice(1, -1) })
    ultimo = m.index! + tok.length
  }
  if (ultimo < text.length) partes.push({ kind: 'text', text: text.slice(ultimo) })
  return partes
}
