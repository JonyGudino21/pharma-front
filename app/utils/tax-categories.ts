import type { TaxCategory } from '~/types/settings'

/**
 * Cómo se presenta cada tratamiento de IVA. ZERO y EXEMPT cobran 0 %, pero no
 * son lo mismo para el SAT: la tasa 0 % permite acreditar el IVA de las
 * compras; lo exento no. Se distinguen desde ahora para el CFDI futuro.
 */
export const TAX_CATEGORY_META: Record<TaxCategory, { label: string; short: string; hint: string }> = {
  ZERO: { label: 'Tasa 0 %', short: 'Tasa 0 %', hint: 'Medicinas y alimentos' },
  GENERAL: { label: 'General (16 % / 8 %)', short: 'General', hint: 'Perfumería, refrescos' },
  EXEMPT: { label: 'Exento', short: 'Exento', hint: 'Casos especiales' },
}
