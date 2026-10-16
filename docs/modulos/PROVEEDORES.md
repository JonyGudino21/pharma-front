# Módulo: Proveedores

## Rutas

| Ruta | Archivo | Permiso |
|---|---|---|
| `/suppliers` | `app/pages/suppliers/index.vue` | `canManageSuppliers` |

## Componentes

| Componente | Función |
|---|---|
| `components/suppliers/SupplierFormModal.vue` | Alta/edición: nombre, contacto, teléfono, correo, días de crédito. |
| `components/suppliers/AccountStatementModal.vue` | Estado de cuenta: saldo actual, días de crédito y facturas pendientes. |
| `components/shared/ConfirmModal.vue` | Confirmar desactivación. |

## Store: `stores/supplier.ts`

- Tabla paginada (10) con filtros `query` e `isActive` (`'true'`, `'false'`, `'all'`).
- **Opciones** separadas de la tabla (`options`, `optionsTruncated`) para combos de otras
  pantallas.

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/suppliers?page&limit&active` | Listado. |
| GET | `/suppliers/search?…` | Búsqueda. |
| GET | `/suppliers/options` | Combo (usado en Compras). |
| POST | `/suppliers` | Alta. |
| PATCH | `/suppliers/:id` | Edición. |
| DELETE | `/suppliers/:id` | Desactivar. |
| GET | `/suppliers/:id/account-statement` | Estado de cuenta. |

## Funcionalidad

- Listado con buscador, filtro de estado, saldo con el proveedor y conteo de compras pendientes.
- Acciones por fila: estado de cuenta, editar y desactivar (si está activo).

## Permisos

`canManageSuppliers` para la ruta, el menú y "Nuevo proveedor". Las acciones por fila no tienen
`v-if` propio: quien entra a la pantalla ya tiene el permiso.

## Estados de error

Toast del interceptor; el estado de cuenta muestra vacío si la consulta falla
(`fetchAccountStatement` devuelve `null`).
