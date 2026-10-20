import type { PricingSettings } from '~/types/settings'

/**
 * ¿Este rol puede cambiar precios en caja? (ADR-0025). Espejo de
 * `puedeCambiarPrecio` en pharma-back/src/sales/sale-prices.service.ts.
 * Aquí sólo decide si se MUESTRA el botón; el servidor es quien autoriza.
 */
export function puedeCambiarPrecio(role: string | undefined, cfg: PricingSettings | null): boolean {
  if (!cfg?.enabled || !role) return false
  if (role === 'ADMIN' || role === 'MANAGER') return true
  if (role === 'PHARMACIST') return cfg.pharmacistCanEdit
  return cfg.cashierCanEdit
}
