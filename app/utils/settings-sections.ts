import type { UserPermissions } from '~/types/auth'

/**
 * Secciones de Configuración. Una sola lista para las pestañas de
 * Configuración y para el menú lateral: si fueran dos, una sección nueva
 * aparecería en un lado y no en el otro.
 */
export interface SettingsSection {
  label: string
  to: string
  icon: string
  /** Permiso que exige la página. El menú oculta lo que no se puede abrir. */
  permission: keyof UserPermissions & string
}

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { label: 'Ticket', to: '/settings/ticket', icon: 'ph:receipt-bold', permission: 'canManageCompany' },
  { label: 'Caja', to: '/settings/cash', icon: 'ph:cash-register-bold', permission: 'canManageSettings' },
  { label: 'Inventario', to: '/settings/inventory', icon: 'ph:hourglass-medium-bold', permission: 'canManageSettings' },
  { label: 'Descuentos', to: '/settings/discounts', icon: 'ph:percent-bold', permission: 'canManageSettings' },
  { label: 'Precios en caja', to: '/settings/pricing', icon: 'ph:tag-bold', permission: 'canManageSettings' },
  { label: 'Impuestos', to: '/settings/taxes', icon: 'ph:receipt-x-bold', permission: 'canManageSettings' },
  { label: 'Nota de remisión', to: '/settings/remission', icon: 'ph:file-text-bold', permission: 'canManageSettings' },
  { label: 'Dispositivos', to: '/settings/devices', icon: 'ph:printer-bold', permission: 'canManageSettings' },
  { label: 'Usuarios', to: '/settings/users', icon: 'ph:users-three-bold', permission: 'canManageUsers' },
  { label: 'Permisos', to: '/settings/permissions', icon: 'ph:shield-check-bold', permission: 'canManageUsers' },
]

export function visibleSettingsSections(can: (p: string) => boolean): SettingsSection[] {
  return SETTINGS_SECTIONS.filter((s) => can(s.permission))
}
