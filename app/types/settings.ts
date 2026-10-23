/**
 * Configuración de operación. Espejo de `src/settings/definitions` del backend.
 * El servidor es la fuente de verdad de rangos y reglas: aquí sólo se repiten
 * para dar retroalimentación inmediata, nunca para decidir.
 */

export type SettingsNamespace = 'inventory' | 'cash' | 'discounts' | 'taxes' | 'remission' | 'pricing'

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

/**
 * Precios en caja (ADR-0025). Espejo de pricing.settings.ts del backend.
 * Gerencia y administración siempre pueden cambiar precios (si está activo).
 */
export interface PricingSettings {
  enabled: boolean
  cashierCanEdit: boolean
  pharmacistCanEdit: boolean
  requireReason: boolean
  saveForClientByDefault: boolean
  allowBelowCost: boolean
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  enabled: true,
  cashierCanEdit: false,
  pharmacistCanEdit: true,
  requireReason: false,
  saveForClientByDefault: true,
  allowBelowCost: false,
}

export type TaxCategory = 'GENERAL' | 'ZERO' | 'EXEMPT'

export interface TaxSettings {
  generalRate: 16 | 8
  defaultCategory: TaxCategory
  showBreakdownOnTicket: boolean
}

export type RemissionPaper = 'LETTER' | 'A4'

/** AUTO: cómoda en notas cortas y compacta con muchas partidas (recomendado). */
export type RemissionDensity = 'AUTO' | 'COMFORTABLE' | 'COMPACT'

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
  /** Lote bajo el nombre de cada partida. */
  showLot: boolean
  /** Caducidad (MM/AAAA) de cada lote; sólo afecta lo impreso, no el FEFO. */
  showExpiry: boolean
  showTaxBreakdown: boolean
  density: RemissionDensity
  /*
   * Datos de la farmacia en el encabezado. Sólo deciden si se imprimen; los
   * valores vienen de la ficha (Configuración › Ticket). Un dato sale si está
   * encendido Y la ficha lo tiene. El nombre siempre sale.
   */
  /** Logo (o la marca de PharmaPOS si no hay logo). Apagado: ni uno ni otra. */
  showLogo: boolean
  /** Razón social, sólo si es distinta del nombre comercial. */
  showLegalName: boolean
  showRfc: boolean
  showFiscalRegime: boolean
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
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
  showLot: true,
  showExpiry: true,
  showTaxBreakdown: false,
  density: 'AUTO',
  showLogo: true,
  showLegalName: true,
  showRfc: true,
  showFiscalRegime: true,
  showAddress: true,
  showPhone: true,
  showEmail: true,
}

export interface SettingsMap {
  inventory: InventorySettings
  cash: CashSettings
  discounts: DiscountSettings
  taxes: TaxSettings
  remission: RemissionSettings
  pricing: PricingSettings
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
