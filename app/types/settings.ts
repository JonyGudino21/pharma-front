/**
 * Configuración de operación. Espejo de `src/settings/definitions` del backend.
 * El servidor es la fuente de verdad de rangos y reglas: aquí sólo se repiten
 * para dar retroalimentación inmediata, nunca para decidir.
 */

export type SettingsNamespace = 'inventory' | 'cash' | 'discounts' | 'taxes' | 'remission'

export interface InventorySettings {
  expiryAlertDays: number
  expiryCriticalDays: number
  expiryWarningDays: number
  expiryInclusive: boolean
  requireLotForAll: boolean
  defaultMinStock: number
}

export interface CashSettings {
  closeTolerance: number
  suggestedOpeningFloat: number
  maxCashInDrawer: number
  blindClose: boolean
}

export interface DiscountSettings {
  enabled: boolean
  cashierMaxPercent: number
  pharmacistMaxPercent: number
  managerMaxPercent: number
  /** Techo absoluto; también es el tope del administrador. */
  maxPercent: number
  requireReason: boolean
  allowAuthorization: boolean
  allowBelowCost: boolean
}

export type TaxCategory = 'GENERAL' | 'ZERO' | 'EXEMPT'

export interface TaxSettings {
  generalRate: 16 | 8
  defaultCategory: TaxCategory
  showBreakdownOnTicket: boolean
}

export type RemissionPaper = 'LETTER' | 'A4'

/** Nota de remisión (hoja completa). Espejo de remission.settings.ts del backend. */
export interface RemissionSettings {
  enabled: boolean
  paper: RemissionPaper
  /** Leyenda al pie (≤ 300). Por defecto aclara que no es un CFDI. */
  legend: string
  /** Condiciones (≤ 600). Vacío = no se imprime. */
  terms: string
  showSignatures: boolean
  showPayments: boolean
  showSku: boolean
  showTaxBreakdown: boolean
}

/** Valores de fábrica; se usan si el servidor no pudo entregar la configuración. */
export const DEFAULT_REMISSION_SETTINGS: RemissionSettings = {
  enabled: true,
  paper: 'LETTER',
  legend: 'Nota de remisión. Documento sin validez fiscal: no es un CFDI.',
  terms: '',
  showSignatures: true,
  showPayments: true,
  showSku: true,
  showTaxBreakdown: false,
}

export interface SettingsMap {
  inventory: InventorySettings
  cash: CashSettings
  discounts: DiscountSettings
  taxes: TaxSettings
  remission: RemissionSettings
}

export interface SettingsSnapshot<N extends SettingsNamespace = SettingsNamespace> {
  namespace: N
  values: SettingsMap[N]
  defaults: SettingsMap[N]
  /** 0 = nunca se ha guardado: rigen los valores de fábrica. */
  version: number
  updatedAt: string | null
  updatedBy: { id: number; name: string } | null
}

export interface SettingsHistoryItem {
  id: number
  key: string
  oldValue: unknown
  newValue: unknown
  changedAt: string
  changedBy: { id: number; name: string }
}

/** Errores por campo, en palabras del usuario. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>
