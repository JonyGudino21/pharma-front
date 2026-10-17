import type { TaxCategory } from '~/types/settings'

/**
 * CUERPO del alta y de la edición de producto, en un solo lugar y probado.
 *
 * El backend valida en modo estricto: un campo que su DTO no declara responde
 * 400. El formulario armaba un solo objeto para crear y editar con `isActive`,
 * que el alta no acepta, y crear cualquier producto fallaba con el cliente
 * enfrente. Las listas de abajo son el contrato con
 * pharma-back/src/product/dto/{create,update}-product.dto.ts; si cambian allá,
 * cambian aquí (las pruebas lo vigilan del lado del front, y
 * product-contract.spec.ts del lado del back con estos mismos cuerpos).
 */
export const CREATE_PRODUCT_FIELDS = [
  'name', 'description', 'strength', 'format', 'presentation', 'barcode',
  'categories', 'controlled', 'stock', 'minStock', 'price', 'cost',
  'taxCategory', 'lotNumber', 'expiryDate',
] as const

/** Edición: como el alta, sin existencia ni lote (se mueven por inventario) y con `isActive`. */
export const UPDATE_PRODUCT_FIELDS = [
  'name', 'description', 'strength', 'format', 'presentation', 'barcode',
  'categories', 'controlled', 'minStock', 'price', 'cost', 'taxCategory', 'isActive',
] as const

export interface ProductFormState {
  name: string
  description: string
  strength: string
  format: string
  presentation: string
  barcode: string
  categories: number[]
  controlled: boolean
  stock: number | string
  lotNumber: string
  expiryDate: string
  minStock: number
  price: number | string
  cost: number | string
  isActive: boolean
  taxCategory: TaxCategory
}

/** Campos comunes; los vacíos opcionales no viajan. */
function comunes(form: ProductFormState) {
  return {
    name: form.name.trim(),
    // Vacíos explícitos: el backend regenera el SKU con lo que quede.
    strength: form.strength.trim(),
    format: form.format.trim(),
    presentation: form.presentation.trim(),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    ...(form.barcode.trim() ? { barcode: form.barcode.trim() } : {}),
    controlled: form.controlled,
    minStock: Number(form.minStock),
    price: Number(form.price),
    cost: Number(form.cost),
    categories: [...form.categories],
  }
}

/** Alta: existencia inicial y, si hay existencia, su lote y caducidad. Nunca `isActive`. */
export function buildCreateProductPayload(form: ProductFormState) {
  const stock = Number(form.stock) || 0
  const lot = form.lotNumber.trim().toUpperCase()
  return {
    ...comunes(form),
    taxCategory: form.taxCategory,
    stock,
    // Sin existencia el lote no aplica: el servidor lo rechazaría.
    ...(stock > 0 && lot && form.expiryDate ? { lotNumber: lot, expiryDate: form.expiryDate } : {}),
  }
}

/**
 * Edición: sin existencia ni lote. El IVA sólo viaja si el usuario lo cambió
 * (un farmacéutico recibía 403 al guardar un simple cambio de nombre).
 */
export function buildUpdateProductPayload(form: ProductFormState, taxBaseline: TaxCategory | null) {
  return {
    ...comunes(form),
    ...(form.taxCategory !== taxBaseline ? { taxCategory: form.taxCategory } : {}),
    isActive: form.isActive,
  }
}
