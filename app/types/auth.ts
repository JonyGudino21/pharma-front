export interface UserPermissions {
  // ---- Ventas (sales) ----
  canSell: boolean;
  canCancelSales: boolean;
  canGiveDiscounts: boolean;
  canReturnSales: boolean;
  canViewSalesSummary: boolean;

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
  cashShifts?: T[];
  data?: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export interface LoginData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface MeData {
  user: User;
  permissions: UserPermissions;
}