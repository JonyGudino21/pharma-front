# Módulo: Ventas (historial, detalle, devoluciones y anulación)

Consulta de ventas ya registradas y operaciones posteriores al cobro.

## Rutas

| Ruta | Archivo | Permiso |
|---|---|---|
| `/sales` | `app/pages/sales/index.vue` | `canViewSalesHistory` |
| `/sales/:id` | `app/pages/sales/[id].vue` | `canViewSalesHistory` |

## Componentes

| Componente | Función |
|---|---|
| `components/sales/ReturnModal.vue` | Captura de devolución parcial o total por línea. |
| `components/shared/ConfirmModal.vue` | Confirmación de anulación. |
| `components/receipt/ReceiptPreview.vue` | Ticket de la venta (reimpresión). |
| `components/receipt/RemissionModal.vue` | Nota de remisión. |
| `components/shared/Pagination.vue` | Paginación del listado. |

## Store: `stores/salesHistory.ts`

Separado del store del POS a propósito: aquel modela la venta viva; éste, ventas cerradas.

- `listado` y `detalle` usan `useRequestState` → `listLoading/listError/listEmpty/retryList` y
  `detailLoading/detailError/detailEmpty/retryDetail` (distinguen "no hay ventas" de "no se
  pudieron cargar").
- Filtros: fechas, folio, `status`, `flowStatus`, `paymentStatus`. Página de 20.
- Derivados del detalle: `returnedByItem`, `returnableByItem`, `hasReturnableItems`,
  `totalRefunded`.

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/sales?page&limit&startDate&endDate&invoiceNumber&status&flowStatus&paymentStatus` | Listado. |
| GET | `/sales/:id` | Detalle (incluye `saleReturn`, `receiptPrints`). |
| POST | `/sales/:id/return` | Devolución: `{ items: [{ saleItemId, quantity, restock, reason? }], refundToCustomer?, note? }`. |
| POST | `/sales/:id/cancel` | Anular venta. |
| POST | `/sales/:id/prints` | Registrar reimpresión de ticket o nota. |
| GET | `/settings/taxes`, `/settings/remission` | Desglose de IVA y nota activada. |
| GET | `/company` | Ficha y plantilla. |

## Listado (`/sales`)

- Filtros: folio (Enter busca), fecha inicial/final, estado (Completada, Pago parcial, Pendiente,
  Devuelta por completo, Anulada), flujo ("Cerradas (sin borradores)", Cerrada, Borrador en
  mostrador, Anulada) y estado de pago (Pagada, Parcial, Sin pagar). "Limpiar" restablece y vuelve a consultar.
- Insignias de estado: Completada, Parcial, Pendiente, Devuelta, Anulada.

## Detalle (`/sales/:id`)

- Partidas, pagos, devoluciones registradas (con reembolsos y quién las procesó) e historial de
  impresiones.
- **Imprimir ticket**: `printSale()`; tras imprimir recarga el detalle para ver la copia nueva.
  La vista previa muestra el número de la última copia de ticket.
- **Nota de remisión**: visible si la venta no es borrador ni está anulada, el usuario tiene
  `canPrintReceipt` y `settings.remission.enabled` no es `false`. Pasa a la nota el número de
  copias ya emitidas (`receiptPrints` con `document === 'REMISSION'`) y el total devuelto para
  imprimir el aviso de devoluciones.
- **Devolver**: visible con `canReturnSales`, venta `COMPLETED`, no anulada y con unidades por
  devolver.
- **Anular**: visible con `canCancelSales` y venta no anulada. El mensaje de confirmación indica
  el importe que saldrá de la caja si hubo pagos.

### Devolución (`ReturnModal`)

- Por línea: cantidad (tope = vendido − ya devuelto), **destino obligatorio** (regresa al anaquel
  `restock: true` o se da de baja `false`) y motivo opcional.
- Opción "reembolsar al cliente" (`refundToCustomer`, activada por omisión) y nota.
- Muestra una **estimación** del efectivo a devolver: lo que exceda el saldo pendiente de la
  venta. El reparto real lo decide el backend.

## Permisos

| Permiso | Efecto |
|---|---|
| `canViewSalesHistory` | Listado y detalle. |
| `canReturnSales` | Botón Devolver. |
| `canCancelSales` | Botón Anular (el backend exige gerencia para ventas cerradas). |
| `canPrintReceipt` | Nota de remisión. |

## Estados de error

| Situación | Comportamiento |
|---|---|
| Falla el listado | Estado de error con el mensaje y botón de reintento cuando el fallo es reintentable (red, timeout, 5xx, 409); nunca "No hay ventas". |
| Falla el detalle | Estado de error con reintento (si aplica) y la referencia `requestId` si el backend la envió; nunca "venta no encontrada". |
| `:id` no numérico | Se limpia el detalle sin llamar al backend. |
| Devolución rechazada | Toast del backend; el modal queda abierto para corregir. |
| Anulación sin permiso | 403 con mensaje visible. |
| Imprimir venta anulada | Bloqueado en el front ("Esta venta está anulada…"). |

## Decisiones relevantes

- El front **replica** las condiciones del backend (unidades devolvibles, estados) para no
  ofrecer botones que sólo pueden terminar en error; el backend sigue decidiendo.
- No se imprime ticket ni nota de ventas anuladas: evita comprobantes de algo reembolsado.

## Volver a vender (v1.5, ADR-0027)

- Detalle (`pages/sales/[id].vue`): **Volver a vender** (anulada) o **Repetir venta** (cobrada),
  con permiso `canSell`. Lista: acción ↻ en las anuladas.
- `useSalesStore().reorderFrom(id, folio)` → `POST /sales/:id/reorder`; deja la venta nueva como
  carrito (con el cliente completo) y guarda `reorderNotice`. El punto de venta muestra
  `PosReorderNotice` con precios cambiados, piezas ajustadas, omitidos y cliente dado de baja.
- Si ya hay una venta en curso con productos, no se hace nada (aviso en el front o 409 del servidor).
