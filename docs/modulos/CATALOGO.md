# Módulo: Catálogo (productos y categorías)

## Rutas

| Ruta | Archivo | Permiso de ruta |
|---|---|---|
| `/catalog/products` | `app/pages/catalog/products/index.vue` | *(ninguno: cualquier usuario autenticado)* |
| `/catalog/categories` | `app/pages/catalog/categories/index.vue` | *(ninguno: comentario en el archivo: "El POS y los Cajeros necesitan ver las categorías")* |

La edición se controla en la plantilla con `canManageProducts` / `canManageCategories`.

## Componentes

| Componente | Función |
|---|---|
| `components/catalog/ProductFormModal.vue` | Alta y edición de producto. |
| `components/categories/CategoryFormModal.vue` | Alta y edición de categoría (nombre, descripción, activa). |
| `components/shared/ConfirmModal.vue` | Confirmar desactivación. |
| `components/shared/Pagination.vue` | Paginación. |

## Stores

- `stores/product.ts`: listado paginado (10), filtros `query` e `isActive` (`'true'` por
  omisión, `'false'`, `'all'`), alta, edición, baja lógica, IVA en bloque, búsqueda por código y
  por nombre.
- `stores/category.ts`: listado/búsqueda paginados, opciones para combos (`/category/options`,
  en caché), alta, edición, baja lógica.

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/products?page&limit&active` | Listado sin texto de búsqueda. |
| POST | `/products/search` | `{ name, letters?, page, limit }`; listado con búsqueda, POS, inventario, compras. |
| GET | `/products/barcode/:code` | Escáner del POS. |
| POST | `/products` | Alta (con `stock`, `lotNumber`, `expiryDate` opcionales). |
| PATCH | `/products/:id` | Edición (el store **quita** `stock`, `lotNumber` y `expiryDate`). |
| DELETE | `/products/:id` | Desactivar. |
| PATCH | `/products/tax-category` | IVA en bloque `{ taxCategory, categoryId? , productIds? }` → `{ updated }` (desde Configuración › Impuestos). |
| GET | `/category`, `/category/search` | Listado / búsqueda (`name`, `active`). |
| GET | `/category/options` | Opciones del selector. |
| POST / PATCH / DELETE | `/category`, `/category/:id` | Alta, edición, desactivación. |
| GET | `/settings/inventory`, `/settings/taxes` | Stock mínimo sugerido, lote obligatorio, IVA por omisión y tasa. |

## Productos

- Tabla con columnas de costo y acciones visibles sólo con `canManageProducts`.
- Buscador con *debounce* de 500 ms; filtro de activos/inactivos/todos.
- **Formulario** (`ProductFormModal`):
  - Nombre, descripción, concentración, forma, presentación (el backend genera el SKU), código de
    barras, categorías, controlado, stock mínimo, precio, costo, activo y **tratamiento de IVA**
    (`GENERAL`, `ZERO`, `EXEMPT`).
  - En el alta: stock mínimo propuesto = `settings.inventory.defaultMinStock`; IVA propuesto =
    `settings.taxes.defaultCategory`.
  - Pista "Contiene X de IVA (16 %)" para productos `GENERAL` con precio.
  - Al editar, el IVA sólo lo cambia gerencia (`MANAGER`/`ADMIN`); para los demás el campo se
    bloquea.
  - **Inventario inicial con lote** (sólo en el alta): si hay stock inicial, lote y caducidad
    van juntos; son obligatorios para controlados y, con `requireLotForAll`, para todo; la
    caducidad no puede ser anterior a hoy (zona `America/Mexico_City`). El lote se envía en
    mayúsculas.
  - Precio y costo deben ser mayores a 0.

## Categorías

- Listado con búsqueda (*debounce* 1 s) y acciones con `canManageCategories`.

## Permisos

| Permiso | Efecto |
|---|---|
| `canManageProducts` | Alta, edición, baja y ver costo. |
| `canManageCategories` | Alta, edición, baja de categorías. |
| `MANAGER`/`ADMIN` (rol) | Cambiar IVA de un producto existente. |
| `canManageSettings` | IVA en bloque (Configuración › Impuestos). |

## Estados de error

| Situación | Comportamiento |
|---|---|
| Falla el listado | Se registra en consola; la tabla queda como estaba. |
| Validación del backend (SKU, código duplicado, categoría) | Toast del interceptor; el modal queda abierto. |
| Lote inválido | Toast con la regla incumplida antes de enviar. |

## Decisiones relevantes

- El inventario **sólo** se modifica en el alta (stock inicial) o desde Inventario/Compras; la
  edición nunca envía stock.
- `fetchCategoryOptions` en lugar de la tabla paginada para los combos: no pisa los filtros de la
  pantalla de categorías y se cachea.
