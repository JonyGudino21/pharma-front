# Módulo: Clientes (directorio, crédito y cobranza)

## Rutas

| Ruta | Archivo | Permiso |
|---|---|---|
| `/clients` | `app/pages/clients/index.vue` | `canViewClients` |
| `/clients/:id` | `app/pages/clients/[id].vue` | `canViewAccountStatement` |
| `/clients/debtors` | `app/pages/clients/debtors.vue` | `canViewDebtors` |

## Componentes

| Componente | Función |
|---|---|
| `components/clients/ClientFormModal.vue` | Alta/edición: nombre, correo, teléfono, domicilio, RFC, CURP. |
| `components/clients/CreditConfigModal.vue` | Activar crédito y fijar límite. |
| `components/clients/ClientPaymentModal.vue` | Registrar abono (efectivo, transferencia, tarjeta). |
| `components/pos/PosClientModal.vue` | Selección de cliente en el POS (ver [POS.md](POS.md)). |

## Store: `stores/client.ts`

Listado/búsqueda paginados (10), cliente por id, deudores con deuda total de la empresa, abonos y
configuración de crédito. Campos clave: `hasCredit`, `creditLimit`, `currentDebt`.

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/client?page&limit&active` | Listado. |
| GET | `/client/search?…` | Búsqueda. |
| GET | `/client/:id` | Cliente completo (lo usa el POS al recuperar un borrador). |
| POST / PATCH / DELETE | `/client`, `/client/:id` | Alta, edición, desactivación. |
| GET | `/client/debtors?page&…` | Deudores. |
| POST | `/client/:id/payment` | Abono `{ method, amount, reference?, notes? }`. |
| PATCH | `/client/:id/credit-config` | `{ hasCredit, creditLimit }`. |
| GET | `/client/:id/account-statement?page&limit&startDate&endDate` | Estado de cuenta (llamado desde la página). |

## Funcionalidad

- **Directorio** (`/clients`): búsqueda, filtro de estado, insignia de límite de crédito; acciones
  según permiso: estado de cuenta (`canViewAccountStatement`), editar (`canEditClient`),
  desactivar (`canDeleteClient`); "Nuevo cliente" con `canCreateClient`; acceso a deudores con
  `canViewDebtors`.
- **Estado de cuenta** (`/clients/:id`): datos del cliente, deuda y límite, movimientos (ventas
  con sus pagos) paginados de 20 y filtro por fechas. Un id inválido regresa a `/clients`. Usa
  `useRequestState` (error ≠ vacío).
- **Deudores** (`/clients/debtors`): lista con deuda, límite y ventas pendientes; acciones
  **Configurar crédito** y **Registrar abono**.
- **Venta a crédito**: en el POS, sólo para clientes con `hasCredit` y crédito disponible
  suficiente.

### Precios especiales (`ClientSpecialPrices`, ADR-0025)

En el estado de cuenta (`/clients/:id`): lista de precios especiales (lista tachada, especial,
diferencia, aviso de margen, quién/cuándo/motivo/venta), **Agregar precio** (busca por nombre o SKU),
cambiar, quitar (vuelve a lista) e historial. `composables/useClientPrices.ts` →
`/client/:clientId/prices`. Cambiar/quitar/historial: `canEditClient`.

## Permisos

`canViewClients`, `canCreateClient`, `canEditClient`, `canDeleteClient`,
`canViewAccountStatement`, `canViewDebtors`, `canRegisterClientPayment`,
`canUpdateCreditConfig`.

> En `debtors.vue` los botones de crédito y abono no consultan `canUpdateCreditConfig` ni
> `canRegisterClientPayment`; el backend sí los exige.

## Estados de error

Toast del interceptor; el estado de cuenta muestra error explícito con reintento.

## Decisiones relevantes

- El POS pide el **cliente completo** (`/client/:id`) al recuperar un borrador: la venta sólo
  trae datos de facturación y sin `hasCredit`/`creditLimit`/`currentDebt` el crédito disponible
  se calculaba mal.

## Cobranza y días de crédito (v1.6, ADR-0029)

- `/clients/debtors` es ahora **Cobranza** (`canViewDebtors`). Datos: `useReceivablesStore().fetchReceivables()`
  → `GET /client/receivables`. El servidor manda las ventas en orden de cobro; la pantalla sólo filtra
  (situación, columna de antigüedad, cliente).
- Componentes: `components/credit/AgingThermometer.vue` (barra segmentada; `compact` para el panel),
  `CreditStatusChip.vue` («Vencida hace 12 días»…), `DueDateModal.vue` (cambiar o quitar la fecha →
  `PATCH /client/receivables/:saleId/due-date`).
- Textos y tonos en `utils/credit-status.ts` (con pruebas). La escala de color va de `success` a
  `error-800`; "sin fecha" en gris.
- `CreditConfigModal`: `creditDays` opcional (vacío = sin días propios).
- Estado de cuenta (`/clients/:id`): columna **Fecha de pago** con la situación de cada venta con saldo.
