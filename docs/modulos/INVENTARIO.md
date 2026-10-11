# Módulo: Inventario (control, caducidades y controlados)

Kardex, ajustes de existencias, semáforo de caducidades, mermas por lote y libro de
medicamentos controlados.

## Rutas

| Ruta | Archivo | Permiso |
|---|---|---|
| `/inventory` | `app/pages/inventory/index.vue` | `canViewKardex` |
| `/inventory/expiring` | `app/pages/inventory/expiring.vue` | `canViewExpiringBatches` |
| `/inventory/controlled` | `app/pages/inventory/controlled.vue` | `canViewControlledLog` |

El menú "Inventario" aparece con `canViewKardex`; "Caducidades" y "Libro de controlados" sólo con
su permiso.

## Componentes

| Componente | Función |
|---|---|
| `components/inventory/KardexModal.vue` | Movimientos de un producto (compra, inicial, venta, ajuste, pérdida, devoluciones). |
| `components/inventory/AdjustmentModal.vue` | Conteo físico → diferencia (sobrante/faltante) con motivo obligatorio. |
| `components/inventory/DestroyBatchModal.vue` | Merma/destrucción de un lote (cantidad y motivo). |
| `components/shared/Pagination.vue` | Paginación. |

## Store: `stores/inventory.ts`

Estado separado por recurso: valuación, alertas de stock bajo, kardex, caducidades (con
`expiringCriteria` y `expiringError`) y libro de controlados (con `controlledError`).

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/inventory/valuation` | Valor del inventario (con `canViewInventoryValuation`). |
| GET | `/inventory/alerts/low-stock` | Stock bajo (con `canViewLowStockAlerts`). |
| GET | `/inventory/kardex/:productId` | Kardex. |
| POST | `/inventory/adjustment` | `{ productId, realQuantity, reason }`. |
| GET | `/inventory/stock/:productId` | Stock en vivo (`stock`, `sellable`, `expired`). |
| GET | `/inventory/batches/expiring?days&page&limit` | Lotes por caducar + `criteria`. Sin `days`, el servidor usa el horizonte configurado. |
| POST | `/inventory/batches/adjustment` | Merma de lote `{ batchId, quantity, reason }`. |
| GET | `/inventory/controlled-log?page&limit&startDate&endDate&prescriptionNo&doctorLicense&patientName&entryType` | Libro de controlados. |
| POST | `/products/search` | Buscador de la pantalla de control. |

## Control (`/inventory`)

- Tarjetas de valuación y stock bajo (según permiso) y accesos a Caducidades y Controlados.
- Buscador de productos (*debounce* 500 ms, 10 resultados) con acciones **Kardex**
  (`canViewKardex`) y **Ajustar** (`canAdjustInventory`).
- Antes de abrir el ajuste se consulta el stock en vivo para no ajustar sobre una cifra vieja.
- Tras un ajuste se recargan valuación, alertas y la búsqueda.

## Caducidades (`/inventory/expiring`)

- Semáforo por lote según el estado que calcula el servidor: **Caducado**, **Crítico**,
  **Próximo** (advertencia) y **Vigente**.
- Horizonte: 30/60/90 días más el configurado por gerencia; la primera carga adopta el horizonte
  con el que respondió el servidor. Enlace "Ajustar criterios" con `canManageSettings`.
- Acción **merma de lote** con `canAdjustInventory`.
- Un fallo de carga muestra error, **nunca** "No hay lotes por caducar" (podría invitar a vender
  medicamento vencido).

## Libro de controlados (`/inventory/controlled`)

- Filtros: folio de receta, cédula, paciente (Enter busca), fechas y tipo (Dispensa, Devolución,
  Destrucción). Paginado.
- **Imprimir** (`window.print()` de la página).
- **Exportar CSV** (`canExportControlledLog`, gerencia): descarga la exportación oficial
  `GET /inventory/controlled-log/export` con el periodo y el tipo elegidos (receta, médico y
  paciente son filtros sólo de consulta). El servidor genera el archivo completo, con BOM para
  Excel, registra quién exportó y devuelve la huella en `X-Integrity-Hash`, que se muestra en el
  aviso. Estado "Exportando…" y sin promesas sin atender.
- Un fallo se muestra como error, no como "no hay registros".

## Lotes en otras pantallas

- Alta de producto con inventario inicial y compras exigen lote + caducidad para controlados y,
  si `settings.inventory.requireLotForAll`, para todo (ver [CATALOGO.md](CATALOGO.md) y
  [COMPRAS.md](COMPRAS.md)).
- El POS consulta el stock **vendible** (excluye lotes caducados) antes de agregar.
- La venta de controlados exige receta (ver [POS.md](POS.md)).

## Permisos

`canViewKardex`, `canAdjustInventory`, `canViewLowStockAlerts`, `canViewInventoryValuation`,
`canViewExpiringBatches`, `canViewControlledLog`, `canManageSettings` (enlace a criterios).

## Estados de error

| Situación | Comportamiento |
|---|---|
| Falla caducidades / libro | Mensaje de error explícito (no lista vacía). |
| Falla valuación / alertas / kardex | Se registra en consola; la tarjeta no se llena. |
| Falla `stock` antes de ajustar | Se abre el ajuste con el stock que ya se tenía. |
| Ajuste/merma rechazado | Toast del backend; el modal queda abierto. |

## Decisiones relevantes

- El **criterio de caducidad** (vender hasta el día impreso o no) y los umbrales los define
  gerencia en Configuración › Inventario y los aplica el servidor; el front sólo los muestra.
- El libro de controlados se trata como documento regulatorio (COFEPRIS): nunca se presenta un
  fallo como ausencia de registros.
