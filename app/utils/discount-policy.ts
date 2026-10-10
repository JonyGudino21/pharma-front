import { UserRole } from '~/types/auth'
import type { DiscountSettings } from '~/types/settings'

/**
 * Espejo de `src/sales/discount-policy.ts` del backend, SÓLO para avisar al
 * cajero antes de enviar ("este descuento necesita autorización"). El servidor
 * vuelve a decidir con la configuración vigente: si difieren, gana él.
 */
export function capForRole(role: string | undefined, cfg: DiscountSettings): number {
  const propio =
    role === UserRole.ADMIN
      ? cfg.maxPercent
      : role === UserRole.MANAGER
        ? cfg.managerMaxPercent
        : role === UserRole.PHARMACIST
          ? cfg.pharmacistMaxPercent
          : cfg.cashierMaxPercent
  return Math.min(propio, cfg.maxPercent)
}

export type DiscountPreview =
  | { kind: 'allowed' }
  | { kind: 'needs-authorization'; cap: number }
  | { kind: 'rejected'; message: string }

export function previewDiscount(input: {
  role: string | undefined
  percent: number
  previousPercent: number
  cfg: DiscountSettings
}): DiscountPreview {
  const { role, percent, previousPercent, cfg } = input
  if (percent <= previousPercent) return { kind: 'allowed' }
  if (!cfg.enabled) return { kind: 'rejected', message: 'Los descuentos están desactivados en Configuración.' }
  if (percent > cfg.maxPercent) return { kind: 'rejected', message: `El descuento máximo permitido es ${cfg.maxPercent}%.` }
  const cap = capForRole(role, cfg)
  if (percent <= cap) return { kind: 'allowed' }
  if (!cfg.allowAuthorization) {
    return { kind: 'rejected', message: `Tu tope es ${cap}% y la autorización de gerente está desactivada.` }
  }
  return { kind: 'needs-authorization', cap }
}

/** Mismo redondeo que el servidor (medio hacia arriba, a centavos). */
export function discountAmount(gross: number, percent: number): number {
  return Math.round((gross * percent) / 100 * 100 + Number.EPSILON) / 100
}
