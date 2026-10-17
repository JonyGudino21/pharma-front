import { describe, expect, it } from 'vitest'
import {
  CREATE_PRODUCT_FIELDS,
  UPDATE_PRODUCT_FIELDS,
  buildCreateProductPayload,
  buildUpdateProductPayload,
  type ProductFormState,
} from './product-payload'

const formulario = (cambios: Partial<ProductFormState> = {}): ProductFormState => ({
  name: '  Paracetamol ',
  description: '',
  strength: '500 mg',
  format: 'Tabletas',
  presentation: '',
  barcode: '',
  categories: [1],
  controlled: false,
  stock: 0,
  lotNumber: '',
  expiryDate: '',
  minStock: 5,
  price: '45.50',
  cost: '20',
  isActive: true,
  taxCategory: 'ZERO',
  ...cambios,
})

const llaves = (o: object) => Object.keys(o)

describe('alta de producto', () => {
  it('NUNCA manda isActive (el alta del servidor no lo declara: 400)', () => {
    expect(buildCreateProductPayload(formulario())).not.toHaveProperty('isActive')
    expect(buildCreateProductPayload(formulario({ isActive: false }))).not.toHaveProperty('isActive')
  })

  it('sólo manda campos que el alta del servidor acepta', () => {
    const completo = buildCreateProductPayload(
      formulario({ description: 'x', barcode: '750', presentation: 'Caja', stock: 10, lotNumber: 'l-1', expiryDate: '2027-12-31' }),
    )
    for (const k of llaves(completo)) expect(CREATE_PRODUCT_FIELDS).toContain(k)
  })

  it('convierte precio y costo a número y limpia espacios', () => {
    const p = buildCreateProductPayload(formulario())
    expect(p.name).toBe('Paracetamol')
    expect(p.price).toBe(45.5)
    expect(p.cost).toBe(20)
  })

  it('sin existencia no manda lote aunque esté escrito', () => {
    const p = buildCreateProductPayload(formulario({ stock: 0, lotNumber: 'L1', expiryDate: '2027-01-01' }))
    expect(p).not.toHaveProperty('lotNumber')
    expect(p).not.toHaveProperty('expiryDate')
  })

  it('con existencia manda lote en mayúsculas y caducidad', () => {
    const p = buildCreateProductPayload(formulario({ stock: '12', lotNumber: ' l-26a ', expiryDate: '2027-01-01' }))
    expect(p).toMatchObject({ stock: 12, lotNumber: 'L-26A', expiryDate: '2027-01-01' })
  })

  it('los opcionales vacíos no viajan', () => {
    const p = buildCreateProductPayload(formulario())
    expect(p).not.toHaveProperty('description')
    expect(p).not.toHaveProperty('barcode')
  })
})

describe('edición de producto', () => {
  it('manda isActive y nunca existencia ni lote', () => {
    const p = buildUpdateProductPayload(formulario({ isActive: false, stock: 50, lotNumber: 'L1', expiryDate: '2027-01-01' }), 'ZERO')
    expect(p.isActive).toBe(false)
    expect(p).not.toHaveProperty('stock')
    expect(p).not.toHaveProperty('lotNumber')
    expect(p).not.toHaveProperty('expiryDate')
  })

  it('sólo manda campos que la edición del servidor acepta', () => {
    const p = buildUpdateProductPayload(formulario({ description: 'x', barcode: '750', taxCategory: 'GENERAL' }), 'ZERO')
    for (const k of llaves(p)) expect(UPDATE_PRODUCT_FIELDS).toContain(k)
  })

  it('el IVA sólo viaja si cambió', () => {
    expect(buildUpdateProductPayload(formulario({ taxCategory: 'ZERO' }), 'ZERO')).not.toHaveProperty('taxCategory')
    expect(buildUpdateProductPayload(formulario({ taxCategory: 'GENERAL' }), 'ZERO')).toHaveProperty('taxCategory', 'GENERAL')
  })
})
