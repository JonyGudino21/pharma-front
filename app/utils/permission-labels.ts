/**
 * Nombre legible de cada permiso, agrupado por área, para la matriz de
 * Configuración › Permisos.
 *
 * Si el backend agrega un permiso que aún no está aquí, la matriz lo muestra
 * igual en "Otros" con su clave: nunca se oculta un permiso por falta de
 * etiqueta.
 */
export interface PermissionGroup {
  title: string
  icon: string
  items: { key: string; label: string }[]
}

export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    title: 'Ventas',
    icon: 'ph:shopping-cart-bold',
    items: [
      { key: 'canSell', label: 'Vender en el punto de venta' },
      { key: 'canPrintReceipt', label: 'Imprimir tickets y notas de remisión' },
      { key: 'canViewSalesHistory', label: 'Consultar el historial de ventas' },
      { key: 'canViewSalesSummary', label: 'Ver el resumen gerencial de ventas' },
      { key: 'canGiveDiscounts', label: 'Autorizar descuentos sobre el tope' },
      { key: 'canCancelSales', label: 'Cancelar ventas' },
      { key: 'canReturnSales', label: 'Registrar devoluciones' },
    ],
  },
  {
    title: 'Caja',
    icon: 'ph:cash-register-bold',
    items: [
      { key: 'canOpenShift', label: 'Abrir y cerrar su turno' },
      { key: 'canWithdrawCash', label: 'Retiros e ingresos de efectivo' },
      { key: 'canViewAllShifts', label: 'Ver los turnos de todos' },
    ],
  },
  {
    title: 'Clientes',
    icon: 'ph:users-bold',
    items: [
      { key: 'canViewClients', label: 'Consultar clientes' },
      { key: 'canCreateClient', label: 'Registrar clientes' },
      { key: 'canEditClient', label: 'Editar clientes' },
      { key: 'canDeleteClient', label: 'Dar de baja clientes' },
      { key: 'canViewAccountStatement', label: 'Ver estado de cuenta' },
      { key: 'canRegisterClientPayment', label: 'Registrar abonos' },
      { key: 'canViewDebtors', label: 'Ver deudores' },
      { key: 'canUpdateCreditConfig', label: 'Configurar crédito' },
    ],
  },
  {
    title: 'Inventario',
    icon: 'ph:archive-box-bold',
    items: [
      { key: 'canViewKardex', label: 'Consultar Kardex' },
      { key: 'canViewLowStockAlerts', label: 'Ver stock bajo' },
      { key: 'canViewExpiringBatches', label: 'Ver caducidades' },
      { key: 'canViewControlledLog', label: 'Libro de controlados' },
      { key: 'canExportControlledLog', label: 'Exportar el libro de controlados' },
      { key: 'canAdjustInventory', label: 'Ajustar inventario' },
      { key: 'canViewInventoryValuation', label: 'Ver valuación' },
    ],
  },
  {
    title: 'Catálogo y compras',
    icon: 'ph:books-bold',
    items: [
      { key: 'canManageProducts', label: 'Gestionar productos' },
      { key: 'canManageCategories', label: 'Gestionar categorías' },
      { key: 'canViewPurchases', label: 'Consultar compras' },
      { key: 'canManagePurchases', label: 'Registrar y recibir compras' },
      { key: 'canManageSuppliers', label: 'Gestionar proveedores' },
    ],
  },
  {
    title: 'Administración',
    icon: 'ph:sliders-horizontal-bold',
    items: [
      { key: 'canViewAnalytics', label: 'Reportes y tablero' },
      { key: 'canManageCompany', label: 'Datos de la farmacia y ticket' },
      { key: 'canManageSettings', label: 'Configuración de operación (caja, inventario, descuentos, impuestos, nota de remisión, dispositivos)' },
      { key: 'canManageUsers', label: 'Usuarios y permisos' },
    ],
  },
]

export const KNOWN_PERMISSION_KEYS = new Set(
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key)),
)
