import { describe, expect, it } from 'vitest'
import { esc, renderRemissionHtml } from './remission-html'
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
    expect(minimo).not.toContain('<th>Código</th>')
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

  it('sin ficha de la farmacia no rompe', () => {
    expect(() => renderRemissionHtml(view(), null, cfg())).not.toThrow()
  })
})
