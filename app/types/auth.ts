export interface UserPermissions {
  // ---- Ventas (sales) ----
  canSell: boolean;
  canCancelSales: boolean;
  canGiveDiscounts: boolean;
  canReturnSales: boolean;
  canViewSalesSummary: boolean;
  canPrintReceipt: boolean;

  // ---- Empresa / ticket ----
  canManageCompany: boolean;

  // ---- Clientes (client) ----
  canViewClients: boolean;
  canCreateClient: boolean;
  canEditClient: boolean;
  canDeleteClient: boolean;
  canViewDebtors: boolean;
  canViewAccountStatement: boolean;
  canUpdateCreditConfig: boolean;
  canRegisterClientPayment: boolean;

  // ---- Categorías (category) ----
  canManageCategories: boolean;

  // ---- Inventario (inventory) ----
  canViewKardex: boolean;
  canAdjustInventory: boolean;
  canViewLowStockAlerts: boolean;
  canViewInventoryValuation: boolean;
  canViewExpiringBatches: boolean;
  canViewControlledLog: boolean;

  // ---- Caja (cash-shift) ----
  canOpenShift: boolean;
  canWithdrawCash: boolean;
  canViewAllShifts: boolean;

  // ---- Reportes / Analytics ----
  canViewAnalytics: boolean;

  // ---- Catálogos ----
  canManageProducts: boolean;
  canManageSuppliers: boolean;

  // ---- Compras (purchase) ----
  canViewPurchases: boolean;
  canManagePurchases: boolean;

  // ---- Usuarios ----
  canManageUsers: boolean;

  [key: string]: boolean | undefined;
}

export interface User {
  id: number;
  email: string;
  userName: string;
  firstName: string; // Nuevo
  lastName: string;  // Nuevo
  role: UserRole;
  isActive: boolean;
}

export enum UserRole {
  CASHIER = 'CASHIER',
  PHARMACIST = 'PHARMACIST',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

// Así nos responde el backend de NestJS
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  shifts: T[];
  users?: T[]; // El backend puede devolver 'users' o 'data' según el caso
  suppliers?: T[];
  categories?: T[];
  products?: T[];
  purchases?: T[];
  sales?: T[];
  cashShifts?: T[];
  clients?: T[];
  data?: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

/**
 * Respuesta de POST /auth/login.
 *
 * DESDE LA FASE 4 NO CONTIENE TOKENS. Llegan en cabeceras `Set-Cookie` con
 * `httpOnly`, así que el navegador los guarda y los adjunta él mismo sin que
 * ningún script pueda leerlos. Si volvieran en el cuerpo, JavaScript podría
 * copiarlos a `localStorage` o a una cookie legible y un XSS los alcanzaría:
 * exactamente lo que el cambio vino a impedir.
 *
 * Que este tipo ya no declare `accessToken` es deliberado: si alguien intenta
 * volver a leerlos desde el front, el compilador lo detiene.
 */
export interface LoginData {
  user: User;
  /**
   * Caducidad absoluta de la sesión (ISO). Informativa: la usa la interfaz para
   * avisar de que la sesión está por vencer. La cookie la gestiona el backend.
   */
  refreshExpiresAt?: string;
}

export interface MeData {
  user: User;
  permissions: UserPermissions;
}