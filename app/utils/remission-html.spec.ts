import { describe, expect, it } from 'vitest'
import { COMFORTABLE_MAX_LINES, caducidad, esc, guillocheSvg, renderRemissionHtml, resolveDensity } from './remission-html'
import { remissionFolio, sampleRemissionView, type RemissionView } from './remission-view'
import { DEFAULT_REMISSION_SETTINGS, type RemissionSettings } from '~/types/settings'
import type { Company } from '~/types/receipt'

const company: Company = {
  id: 1,
  legalName: 'Farmacia Ochoa S.A. de C.V.',
  tradeName: 'Farmacia Ochoa',
  rfc: 'FOC010101AB1',
  fiscalRegime: null,
  address: 'Calle 5 #10, Querétaro',
  phone: '442 000 0000',
  email: null,
  logoUrl: null,
  ticketFooter: null,
}

const cfg = (over: Partial<RemissionSettings> = {}): RemissionSettings => ({ ...DEFAULT_REMISSION_SETTINGS, ...over })
const view = (over: Partial<RemissionView> = {}): RemissionView => ({ ...sampleRemissionView(), ...over })

describe('esc', () => {
  it('neutraliza HTML y comillas', () => {
    expect(esc(`<img src=x onerror="alert('x')">&`)).toBe('&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;')
  })
  it('tolera null y undefined', () => {
    expect(esc(null)).toBe('')
    expect(esc(undefined)).toBe('')
  })
})

describe('remissionFolio', () => {
  it('cambia FAC- por NR- y conserva el resto', () => {
    expect(remissionFolio('FAC-20261010-000123', 123)).toBe('NR-20261010-000123')
  })
  it('sin folio de venta usa el id', () => {
    expect(remissionFolio(null, 42)).toBe('NR-000042')
  })
  it('un folio de otro formato se respeta', () => {
    expect(remissionFolio('A-77', 1)).toBe('A-77')
  })
})

describe('renderRemissionHtml', () => {
  it('no ejecuta HTML capturado por personas (cliente, producto, nota, leyenda)', () => {
    const v = view({
      client: { ...view().client, name: '<script>alert(1)</script>' },
      note: '<b onmouseover=1>nota</b>',
      items: [{ quantity: 1, name: '"><svg onload=1>', unitPrice: 1, subtotal: 1 }],
    })
    const html = renderRemissionHtml(v, company, cfg({ legend: '<u>x</u>', terms: '<i>y</i>' }))
    expect(html).not.toMatch(/<script>alert/)
    expect(html).not.toMatch(/<svg onload/)
    expect(html).not.toMatch(/<b onmouseover/)
    expect(html).not.toMatch(/<u>x<\/u>/)
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('muestra el folio, el importe con letra y el total', () => {
    const html = renderRemissionHtml(view(), company, cfg())
    expect(html).toContain('NR-20261010-000123')
    expect(html).toContain('NOTA DE REMISIÓN')
    expect(html).toContain('CIENTO CINCUENTA Y SIETE PESOS 10/100 M.N.')
    expect(html).toContain('NR-20261010-000123')
  })

  it('una venta a crédito muestra saldo pendiente; una pagada, no', () => {
    const credito = renderRemissionHtml(view({ total: 157.1, paidAmount: 100, balance: 57.1 }), company, cfg())
    expect(credito).toContain('Saldo pendiente')
    expect(credito).toContain('A CRÉDITO / PENDIENTE')

    const pagada = renderRemissionHtml(view({ paidAmount: 157.1, balance: 0 }), company, cfg())
    expect(pagada).not.toContain('Saldo pendiente')
    expect(pagada).toContain('PAGADA')
  })

  it('respeta los interruptores de Configuración', () => {
    const minimo = renderRemissionHtml(
      view(),
      company,
      cfg({ showSignatures: false, showPayments: false, showSku: false, showTaxBreakdown: false, legend: '', terms: '' }),
    )
    expect(minimo).not.toContain('Recibí de conformidad')
    expect(minimo).not.toContain('Forma de pago')
    expect(minimo).not.toContain('MED-000123')
    expect(minimo).not.toContain('IVA incluido 16%')

    const completo = renderRemissionHtml(view(), company, cfg({ showTaxBreakdown: true, terms: 'Cambios en 7 días.' }))
    expect(completo).toContain('Recibí de conformidad')
    expect(completo).toContain('IVA incluido 16%')
    expect(completo).toContain('Cambios en 7 días.')
  })

  it('el tamaño de hoja sale de la configuración', () => {
    expect(renderRemissionHtml(view(), company, cfg({ paper: 'LETTER' }))).toContain('size: letter')
    expect(renderRemissionHtml(view(), company, cfg({ paper: 'A4' }))).toContain('size: A4')
  })

  it('distingue vista previa, original y copia', () => {
    expect(renderRemissionHtml(view({ copyNumber: 0 }), company, cfg())).toContain('VISTA PREVIA')
    expect(renderRemissionHtml(view({ copyNumber: 1 }), company, cfg())).toContain('ORIGINAL')
    expect(renderRemissionHtml(view({ copyNumber: 3 }), company, cfg())).toContain('COPIA 3')
  })

  it('"Público en general" no imprime domicilio ni contacto', () => {
    const v = view({ client: { name: 'Público en general', rfc: null, address: null, phone: null, email: null, isGeneral: true } })
    const html = renderRemissionHtml(v, company, cfg())
    expect(html).toContain('Público en general')
    expect(html).not.toContain('RFC: CSR')
  })

  it('advierte cuando la venta tiene devoluciones', () => {
    expect(renderRemissionHtml(view({ returnedTotal: 50 }), company, cfg())).toContain('devoluciones registradas')
    expect(renderRemissionHtml(view({ returnedTotal: 0 }), company, cfg())).not.toContain('devoluciones registradas')
  })

  it('la columna de descuento sólo aparece si hay descuentos', () => {
    const sin = view({ items: [{ quantity: 1, name: 'A', unitPrice: 10, subtotal: 10, discount: 0 }] })
    expect(renderRemissionHtml(sin, company, cfg())).not.toContain('<th class="num">Desc.</th>')
    expect(renderRemissionHtml(view(), company, cfg())).toContain('<th class="num">Desc.</th>')
  })

  it('la tabla de partidas alterna el tono de los renglones (lectura con baja visión)', () => {
    const html = renderRemissionHtml(view(), company, cfg())
    expect(html).toContain('tbody tr:nth-child(even) td { background: var(--hielo); }')
    // Los tonos se imprimen aunque el navegador quite fondos por defecto.
    expect(html).toContain('print-color-adjust: exact')
  })

  it('muestra lote y caducidad de cada partida', () => {
    const html = renderRemissionHtml(view(), company, cfg())
    expect(html).toContain('PA24117')
    expect(html).toContain('Cad. 03/2027')
  })

  it('con varios lotes en una partida indica cuántas piezas de cada uno', () => {
    const v = view({
      items: [{ quantity: 3, name: 'A', unitPrice: 1, subtotal: 3, lots: [{ lot: 'L1', expiry: null, quantity: 2 }, { lot: 'L2', expiry: '2027-01-31', quantity: 1 }] }],
    })
    const html = renderRemissionHtml(v, company, cfg())
    expect(html).toContain('L1</span> ×2')
    expect(html).toContain('L2</span> · Cad. 01/2027 ×1')
  })

  it('resume partidas y piezas', () => {
    expect(renderRemissionHtml(view(), company, cfg())).toContain('3 partidas · 6 piezas')
  })

  it('sin logo usa la marca de botica; con logo, la imagen', () => {
    expect(renderRemissionHtml(view(), company, cfg())).toContain('class="mark"')
    const conLogo = renderRemissionHtml(view(), { ...company, logoUrl: 'https://x.test/logo.png' }, cfg())
    expect(conLogo).toContain('<img src="https://x.test/logo.png"')
  })

  it('el folio del pie de página no puede romper el CSS', () => {
    const html = renderRemissionHtml(view({ folio: 'NR-1"; } body{display:none} /*' }), company, cfg())
    const pie = /@bottom-left { content: "([^"]*)"/.exec(html)
    // Sin comillas, llaves ni punto y coma: el texto no puede salir de la cadena CSS.
    expect(pie?.[1]).toBe('NR-1  bodydisplaynone /')
    const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'))
    expect(css).not.toContain('display:none')
  })

  it('incluye las fuentes locales cuando se le pasan', () => {
    const html = renderRemissionHtml(view(), company, cfg(), { fontFaces: '@font-face{font-family:X}' })
    expect(html).toContain('@font-face{font-family:X}')
  })

  it('sin ficha de la farmacia no rompe', () => {
    expect(() => renderRemissionHtml(view(), null, cfg())).not.toThrow()
  })
})

describe('caducidad', () => {
  it('formatea MM/AAAA en UTC (como la caja del medicamento)', () => {
    expect(caducidad('2027-03-31')).toBe('03/2027')
    expect(caducidad('2027-03-31T00:00:00.000Z')).toBe('03/2027')
  })
  it('sin fecha o inválida no imprime nada', () => {
    expect(caducidad(null)).toBe('')
    expect(caducidad('x')).toBe('')
  })
})

describe('guillocheSvg', () => {
  it('es determinista: vista previa e impresión idénticas', () => {
    expect(guillocheSvg()).toBe(guillocheSvg())
    expect(guillocheSvg()).toMatch(/^<svg class="guilloche"/)
  })
})

describe('forma de pago en "Datos de la venta"', () => {
  const company = null
  const cfg = DEFAULT_REMISSION_SETTINGS
  it('a crédito con abono: método + crédito', () => {
    const v = { ...sampleRemissionView(), payments: [{ method: 'Efectivo', amount: 60 }], paidAmount: 60, balance: 75.5 }
    expect(renderRemissionHtml(v, company, cfg)).toContain('<dt>Pago</dt><dd>Efectivo + crédito</dd>')
  })
  it('a crédito sin abono: crédito', () => {
    const v = { ...sampleRemissionView(), payments: [], paidAmount: 0, balance: 157.1 }
    expect(renderRemissionHtml(v, company, cfg)).toContain('<dt>Pago</dt><dd>Crédito</dd>')
  })
  it('pagada: sólo los métodos', () => {
    const v = { ...sampleRemissionView(), payments: [{ method: 'Tarjeta', amount: 157.1 }], paidAmount: 157.1, balance: 0 }
    expect(renderRemissionHtml(v, company, cfg)).toContain('<dt>Pago</dt><dd>Tarjeta</dd>')
  })
})

describe('densidad de la tabla', () => {
  it('automática: cómoda hasta 12 partidas, compacta desde 13', () => {
    expect(resolveDensity('AUTO', 1)).toBe('comfortable')
    expect(resolveDensity('AUTO', COMFORTABLE_MAX_LINES)).toBe('comfortable')
    expect(resolveDensity('AUTO', COMFORTABLE_MAX_LINES + 1)).toBe('compact')
    expect(resolveDensity(undefined, 50)).toBe('compact')
  })
  it('forzada: respeta la elección del gerente', () => {
    expect(resolveDensity('COMFORTABLE', 50)).toBe('comfortable')
    expect(resolveDensity('COMPACT', 2)).toBe('compact')
  })
  it('el documento marca la densidad en <body>', () => {
    const corto = renderRemissionHtml(sampleRemissionView(3), null, DEFAULT_REMISSION_SETTINGS)
    const largo = renderRemissionHtml(sampleRemissionView(30), null, DEFAULT_REMISSION_SETTINGS)
    expect(corto).toContain('<body class="comfortable">')
    expect(largo).toContain('<body class="compact">')
    expect(largo).toContain('30 partidas')
  })
})

describe('detalle de cada partida (interruptores)', () => {
  const base = { ...sampleRemissionView(3) }
  const html = (over: Partial<typeof DEFAULT_REMISSION_SETTINGS>) =>
    renderRemissionHtml(base, null, { ...DEFAULT_REMISSION_SETTINGS, ...over })

  it('de fábrica: código, lote y caducidad', () => {
    const h = html({})
    expect(h).toContain('MED-000123')
    expect(h).toContain('PA24117')
    expect(h).toContain('Cad. 03/2027')
  })
  it('sin caducidad: se ve el lote pero no la fecha', () => {
    const h = html({ showExpiry: false })
    expect(h).toContain('PA24117')
    expect(h).not.toContain('Cad. 03/2027')
  })
  it('sin lote: se ve la caducidad sola', () => {
    const h = html({ showLot: false })
    expect(h).not.toContain('PA24117')
    expect(h).toContain('Cad. 03/2027')
  })
  it('todo apagado: sólo el nombre (el descuento sigue, es parte del importe)', () => {
    const h = html({ showSku: false, showLot: false, showExpiry: false })
    expect(h).not.toContain('MED-000123')
    expect(h).not.toContain('PA24117')
    expect(h).not.toContain('Cad.')
    expect(h).toContain('Descuento 10%')
  })
})
