import { describe, expect, it } from 'vitest'
import { HELP_GUIDES, ROUTE_GUIDES, getGuide, guideForRoute, parseInline, searchHelp, sectionForRoute } from './index'

/** Todos los textos de una guía, para revisar su formato. */
function textos(): Array<{ donde: string; texto: string }> {
  const out: Array<{ donde: string; texto: string }> = []
  for (const g of HELP_GUIDES) {
    out.push({ donde: g.id, texto: g.title }, { donde: g.id, texto: g.summary })
    for (const s of g.sections) {
      const donde = `${g.id}/${s.id}`
      for (const b of s.blocks) {
        if (b.type === 'p' || b.type === 'tip' || b.type === 'warn') out.push({ donde, texto: b.text })
        else if (b.type === 'steps' || b.type === 'list') b.items.forEach((t) => out.push({ donde, texto: t }))
        else b.items.forEach((i) => out.push({ donde, texto: i.q }, { donde, texto: i.a }))
      }
    }
  }
  return out
}

describe('catálogo de guías', () => {
  it('ids de guía únicos y de sección únicos dentro de cada guía', () => {
    const ids = HELP_GUIDES.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const g of HELP_GUIDES) {
      const sec = g.sections.map((s) => s.id)
      expect(new Set(sec).size, `secciones repetidas en ${g.id}`).toBe(sec.length)
    }
  })

  it('cada guía tiene secciones y cada sección tiene contenido', () => {
    for (const g of HELP_GUIDES) {
      expect(g.sections.length, g.id).toBeGreaterThan(0)
      for (const s of g.sections) expect(s.blocks.length, `${g.id}/${s.id}`).toBeGreaterThan(0)
    }
  })

  it('toda ruta apunta a una guía que existe', () => {
    for (const r of ROUTE_GUIDES) expect(getGuide(r.guide), r.prefix).not.toBeNull()
  })

  it('el formato en línea está balanceado (** y `)', () => {
    for (const { donde, texto } of textos()) {
      expect((texto.match(/\*\*/g) ?? []).length % 2, `** sin cerrar en ${donde}: ${texto}`).toBe(0)
      expect((texto.match(/`/g) ?? []).length % 2, `\` sin cerrar en ${donde}: ${texto}`).toBe(0)
    }
  })

  it('ningún texto lleva HTML (se pinta como texto, nunca se interpreta)', () => {
    for (const { donde, texto } of textos()) expect(/<[a-z/][^>]*>/i.test(texto), `${donde}: ${texto}`).toBe(false)
  })
})

describe('guía de la pantalla actual', () => {
  it.each([
    ['/', 'inicio'],
    ['/pos', 'pos'],
    ['/sales', 'ventas'],
    ['/sales/4', 'ventas'],
    ['/cash-shifts/history', 'caja'],
    ['/inventory/expiring', 'inventario'],
    ['/catalog/products', 'catalogo'],
    ['/purchases/create', 'compras'],
    ['/suppliers', 'proveedores'],
    ['/clients/debtors', 'clientes'],
    ['/settings/devices', 'dispositivos'],
    ['/settings/users', 'usuarios'],
    ['/settings/permissions', 'usuarios'],
    ['/settings/remission', 'configuracion'],
    ['/account/password', 'cuenta'],
  ])('%s → %s', (ruta, guia) => {
    expect(guideForRoute(ruta)?.id).toBe(guia)
  })

  it('"/" sólo coincide con el inicio exacto, no con cualquier ruta', () => {
    expect(guideForRoute('/ruta-que-no-existe')).toBeNull()
  })

  it('tolera la diagonal final', () => {
    expect(guideForRoute('/pos/')?.id).toBe('pos')
  })
})

describe('buscador', () => {
  it('encuentra sin acentos ni mayúsculas', () => {
    const hits = searchHelp('devolucion')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => h.guide.id === 'ventas')).toBe(true)
  })

  it('exige todas las palabras', () => {
    expect(searchHelp('impresora zzzzinexistente')).toEqual([])
  })

  it('ignora búsquedas de menos de 2 letras', () => {
    expect(searchHelp('a')).toEqual([])
  })
})

describe('formato en línea', () => {
  it('separa negritas, teclas y texto', () => {
    expect(parseInline('Pulsa **Cobrar** o `F2` ahora')).toEqual([
      { kind: 'text', text: 'Pulsa ' },
      { kind: 'bold', text: 'Cobrar' },
      { kind: 'text', text: ' o ' },
      { kind: 'kbd', text: 'F2' },
      { kind: 'text', text: ' ahora' },
    ])
  })

  it('el multiplicador `3*` se conserva como tecla', () => {
    expect(parseInline('Escribe `3*` y escanea')).toContainEqual({ kind: 'kbd', text: '3*' })
  })
})

describe('sección según la subpantalla', () => {
  it.each([
    ['/inventory/expiring', 'caducidades'],
    ['/inventory/controlled', 'controlados'],
    ['/clients/debtors', 'deudores'],
    ['/cash-shifts/history', 'historial'],
    ['/purchases/create', 'crear-compra'],
    ['/inventory', null],
  ])('%s → %s', (ruta, seccion) => {
    expect(sectionForRoute(ruta)).toBe(seccion)
  })

  it('toda sección configurada existe en su guía', () => {
    for (const r of ROUTE_GUIDES.filter((x) => x.section)) {
      expect(getGuide(r.guide)?.sections.some((s) => s.id === r.section), `${r.prefix} → ${r.section}`).toBe(true)
    }
  })
})
