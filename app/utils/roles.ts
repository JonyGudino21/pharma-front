import { UserRole } from '~/types/auth'

/**
 * Cómo se presenta cada rol. Una sola definición para la tabla de usuarios,
 * el formulario y la matriz de permisos: antes el nombre y el color del rol
 * vivían duplicados en cada pantalla.
 */
export interface RoleMeta {
  label: string
  /** Qué hace esta persona en la farmacia, en una línea. */
  summary: string
  badge: string
  icon: string
}

export const ROLE_META: Record<UserRole, RoleMeta> = {
  [UserRole.ADMIN]: {
    label: 'Administrador',
    summary: 'Todo, incluidos usuarios y permisos. Normalmente el dueño.',
    badge: 'bg-error-50 text-error-700 border-error-200 dark:bg-error-900/30 dark:text-error-400 dark:border-error-800/30',
    icon: 'ph:crown-simple-bold',
  },
  [UserRole.MANAGER]: {
    label: 'Gerente',
    summary: 'Cancela ventas, hace descuentos y retiros, ajusta inventario y configura caja, inventario y ticket.',
    badge: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800/30',
    icon: 'ph:briefcase-bold',
  },
  [UserRole.PHARMACIST]: {
    label: 'Farmacéutico',
    summary: 'Vende, gestiona productos y compras, y consulta Kardex, caducidades y libro de controlados.',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/30',
    icon: 'ph:first-aid-kit-bold',
  },
  [UserRole.CASHIER]: {
    label: 'Cajero',
    summary: 'Vende, abre y cierra su propio turno y atiende clientes.',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30',
    icon: 'ph:cash-register-bold',
  },
}

/** De más a menos privilegios: mismo orden que el backend. */
export const ROLE_ORDER: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.PHARMACIST,
  UserRole.CASHIER,
]

export function roleMeta(role: string): RoleMeta {
  return (
    ROLE_META[role as UserRole] ?? {
      label: role,
      summary: '',
      badge: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      icon: 'ph:user-bold',
    }
  )
}
