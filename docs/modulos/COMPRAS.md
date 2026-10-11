# Módulo: Compras

Órdenes de compra a proveedores: captura, partidas con lote, pagos y recepción en almacén.

## Rutas

| Ruta | Archivo | Permiso |
|---|---|---|
| `/purchases` | `app/pages/purchases/index.vue` | `canViewPurchases` |
| `/purchases/create` | `app/pages/purchases/create.vue` | `canManagePurchases` |
| `/purchases/:id` | `app/pages/purchases/[id].vue` | `canManagePurchases` |

## Componentes

| Componente | Función |
|---|---|
| `components/purchases/PurchaseItemModal.vue` | Agregar/editar partida (producto, cantidad, costo, lote y caducidad). |
| `components/purchases/PaymentModal.vue` | Registrar pago al proveedor (no mayor al saldo). |
| `components/shared/ConfirmModal.vue` | Recibir, cancelar, quitar partida, revertir pago. |

## Store: `stores/purchase.ts`

- Estados de pago: `PENDING`, `PARTIAL`, `PAID`, `CANCELLED`. Entrega: `PENDING`, `RECEIVED`,
  `CANCELLED`. Métodos de pago: `CASH`, `CARD`, `TRANSFER`, `CREDIT`.
- Filtros del listado: proveedor y estado.

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/purchase?page&limit&supplierId&status` | Listado. |
| GET | `/purchase/:id` | Detalle. |
| POST | `/purchase` | Crear `{ supplierId, invoiceNumber, items[], payments? }`. |
| PATCH | `/purchase/:id` | Cambiar proveedor / folio. |
| POST | `/purchase/:id/receive` | Recibir mercancía (ingresa stock, recalcula costo promedio, registra deuda). |
| POST | `/purchase/:id/cancel` | Cancelar (revierte stock y deuda si ya se recibió). |
| POST | `/purchase/:id/add-product` | Agregar partida. |
| PATCH | `/purchase/:id/update-product/:itemId` | Editar partida. |
| DELETE | `/purchase/:id/remove-product/:itemId` | Quitar partida. |
| POST | `/purchase/:id/add-payment` | Pago. |
| DELETE | `/purchase/:id/remove-payment/:paymentId` | Revertir pago. |
| GET | `/suppliers/options` | Combo de proveedores. |
| POST | `/products/search` | Buscador de productos (5 resultados). |
| GET | `/settings/inventory` | `requireLotForAll`. |

## Captura (`/purchases/create`)

- Proveedor, folio de factura, partidas y pagos opcionales.
- Buscador de productos (*debounce* 400 ms). Un producto no controlado sin lote ya en la lista
  suma 1 a su cantidad; los controlados siempre crean partida nueva.
- Lote y caducidad obligatorios para controlados y, con `settings.inventory.requireLotForAll`,
  para todo.
- Validación: proveedor, folio, al menos una partida, cantidades > 0, costos ≥ 0, pagos > 0.
- Al crear navega al detalle de la compra.
- **Bloqueo de actualización**: con partidas o pagos capturados, `useUpdateHold('purchase-create')`
  impide recargar la app ("Tienes una compra a medio capturar.").

## Detalle (`/purchases/:id`)

- Partidas editables mientras la compra no esté cancelada ni recibida.
- **Recibir** (confirmación): ingresa stock al inventario; no se puede deshacer (sólo cancelar).
- **Cancelar**: si ya se recibió, revierte stock y deuda; los pagos adelantados quedan a favor.
- **Revertir pago**: si fue en efectivo, se advierte tener la caja abierta.

## Permisos

| Permiso | Efecto |
|---|---|
| `canViewPurchases` | Listado. |
| `canManagePurchases` | Crear, botón "Nueva compra", detalle y todas sus acciones. |

## Estados de error

| Situación | Comportamiento |
|---|---|
| Errores del backend | Toast del interceptor; se registra en consola. |
| Partida sin lote requerido | Toast antes de enviar. |
| Pago mayor al saldo | "El monto es inválido o supera la deuda." |

## Decisiones relevantes

- La exigencia de lote se valida **al capturar**, no hasta recibir, con el mismo criterio que el
  backend.
- El combo de proveedores usa `/suppliers/options` para no alterar los filtros del directorio.
