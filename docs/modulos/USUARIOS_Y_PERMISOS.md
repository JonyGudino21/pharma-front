# Módulo: Usuarios, sesión y permisos

## Rutas

| Ruta | Archivo | Permiso |
|---|---|---|
| `/login` | `app/pages/login.vue` (layout `blank`) | público |
| `/account/password` | `app/pages/account/password.vue` | cualquier usuario con sesión |
| `/settings/users` | `app/pages/settings/users.vue` | `canManageUsers` |
| `/settings/permissions` | `app/pages/settings/permissions.vue` | `canManageUsers` |
| `/users` | `app/pages/users/index.vue` | `canManageUsers` → redirige a `/settings/users` (se conserva para enlaces viejos) |

## Componentes y utilidades

| Pieza | Función |
|---|---|
| `components/users/UserFormModal.vue` | Alta/edición: nombre, apellido, usuario, correo, rol, contraseña (8 caracteres mínimo), activo. |
| `components/shared/ConfirmModal.vue` | Dar de baja / cerrar sesiones. |
| `utils/roles.ts` | `ROLE_META` (etiqueta, resumen, color, icono) y `ROLE_ORDER` (Administrador, Gerente, Farmacéutico, Cajero). |
| `utils/permission-labels.ts` | Nombre legible y agrupación de cada permiso para la matriz. |

## Stores

- `stores/auth.ts`: sesión y permisos del usuario actual (ver [ARQUITECTURA.md §5](../ARQUITECTURA.md#5-autenticación-cookies-httponly--renovación)).
- `stores/userManagement.ts`: usuarios con resumen de sesiones (`active`, `lastSeenAt`),
  filtros (`query`, `isActive`), matriz de roles (en caché).

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| POST | `/auth/login` | `{ email, password, rememberMe }`. |
| GET | `/auth/me` | Usuario + matriz de permisos. |
| POST | `/auth/refresh` | Renovación (sin cuerpo, por cookie). |
| POST | `/auth/logout` | Cierra sesión y borra cookies. |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }`; el backend revoca todas las sesiones. |
| GET | `/users?page&limit&active` | Listado. |
| GET | `/users/search?page&limit&email&userName&isActive` | Búsqueda (el backend hace OR de correo y usuario). |
| POST | `/users` | Alta. |
| PATCH | `/users/:id` | Edición, reactivación (`isActive: true`); contraseña vacía = conservar. |
| DELETE | `/users/:id` | Baja (cierra sus sesiones). |
| POST | `/users/:id/revoke-sessions` | Cerrar sesiones a distancia → `{ revoked }`. |
| GET | `/users/roles` | Matriz rol → permisos. |

## Pantallas

- **Login**: correo y contraseña (mostrar/ocultar), "Recordar sesión". Errores por toast del
  interceptor.
- **Cambiar contraseña** (menú de usuario): actual, nueva (≥ 8, distinta de la actual) y
  confirmación. Al éxito limpia la sesión local y manda al login. Un 401 aquí significa
  "contraseña actual incorrecta", no sesión caducada.
- **Usuarios**: búsqueda (*debounce* 400 ms), filtro de estado, sesiones abiertas y última
  actividad, alta/edición, **dar de baja** (pierde acceso y se cierran sus sesiones; el historial
  se conserva), **reactivar**, **cerrar sesiones**. Sobre uno mismo no se puede cambiar rol ni
  estado; las salvaguardas (p. ej. el último administrador) las aplica el servidor.
- **Permisos**: matriz **sólo lectura** por rol, tomada del servidor (la misma que decide
  `/auth/me`). Permisos nuevos sin etiqueta aparecen en "Otros". Los permisos son por rol; para
  cambiar lo que alguien puede hacer se cambia su rol.

## Roles

| Rol | Resumen (`utils/roles.ts`) |
|---|---|
| Administrador | Todo, incluidos usuarios y permisos. Normalmente el dueño. |
| Gerente | Cancela ventas, hace descuentos y retiros, ajusta inventario y configura. |
| Farmacéutico | Vende, gestiona productos y compras; consulta Kardex, caducidades y controlados. |
| Cajero | Vende, abre y cierra su propio turno y atiende clientes. |

La matriz exacta la define el backend (`pharma-back/docs/PERMISSIONS_MATRIX.md`).

## Permisos por pantalla

| Permiso | Pantallas / elementos |
|---|---|
| `canSell` | `/pos`, menú Punto de Venta |
| `canPrintReceipt` | Nota de remisión (POS, detalle de venta) |
| `canViewSalesHistory` | `/sales`, `/sales/:id`, menú Ventas |
| `canViewSalesSummary` | Resumen gerencial de ventas (sólo gerencia; hoy sin pantalla propia) |
| `canExportControlledLog` | Botón "Exportar CSV" del libro de controlados |
| `canViewPurchases` · `canManagePurchases` | Listado y detalle de compras · acciones dentro del detalle |
| `canUpdateCreditConfig` · `canRegisterClientPayment` | "Configurar crédito" (Clientes y Deudores) · "Cobrar" en Deudores |
| `canReturnSales` · `canCancelSales` | Devolver · Anular en el detalle |
| `canOpenShift` | `/cash-shifts` |
| `canWithdrawCash` | Operaciones de efectivo, abrir cajón, probar cajón en Dispositivos |
| `canViewAllShifts` | Historial y detalle de turnos, arqueo completo |
| `canViewKardex` · `canAdjustInventory` | `/inventory`, Kardex · Ajustes y mermas |
| `canViewInventoryValuation` · `canViewLowStockAlerts` | Tarjetas de Inventario |
| `canViewExpiringBatches` · `canViewControlledLog` | `/inventory/expiring` · `/inventory/controlled` |
| `canManageProducts` · `canManageCategories` | Edición del catálogo |
| `canViewPurchases` · `canManagePurchases` | `/purchases` · crear y detalle |
| `canManageSuppliers` | `/suppliers` |
| `canViewClients`, `canCreateClient`, `canEditClient`, `canDeleteClient`, `canViewAccountStatement`, `canViewDebtors` | Clientes |
| `canViewAnalytics` | Contenido del Dashboard |
| `canManageCompany` | Configuración › Ticket |
| `canManageSettings` | Configuración › Caja, Inventario, Descuentos, Impuestos, Nota de remisión, Dispositivos |
| `canManageUsers` | Configuración › Usuarios y Permisos |

## Estados de error

| Situación | Comportamiento |
|---|---|
| Ruta sin permiso | Toast "Acceso denegado…" y regreso a `/`. |
| Sesión irrecuperable | Aviso y redirección a `/login` a los 3 s. |
| Usuario/correo duplicado (409) | Toast; el modal sigue abierto. |
| Falla el listado de usuarios | `loadError` (distinto de "no hay usuarios"). |

## Decisiones relevantes

- **Sin tokens en JavaScript** (cookies `httpOnly`): un XSS no puede llevarse la sesión.
- Los permisos del front sólo ocultan; el backend decide.
- El menú muestra una entrada sólo si su página se puede abrir (un menú que ofrece lo que no deja
  usar "se siente roto").
