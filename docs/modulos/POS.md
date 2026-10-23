# Módulo: Punto de venta (POS)

Venta en mostrador: escáner, carrito, cliente, descuentos, receta de controlados, cobro y
comprobante.

## Rutas

| Ruta | Archivo | Permiso |
|---|---|---|
| `/pos` | `app/pages/pos/index.vue` | `canSell` |

## Componentes

| Componente | Función |
|---|---|
| `components/pos/PosCart.vue` | Lista de partidas: `+`/`−`, quitar, descuento por línea (si hay descuentos activos y no están congelados). |
| `components/pos/PosSearchModal.vue` | Búsqueda por nombre (mínimo 2 caracteres, *debounce* 300 ms, 15 resultados). Productos sin stock aparecen deshabilitados. |
| `components/pos/PosClientModal.vue` | Selección de cliente (lista o búsqueda con *debounce* 300 ms) o "Público General". |
| `components/pos/PosPrescriptionModal.vue` | Datos de receta para controlados: folio, médico, cédula y paciente (los cuatro obligatorios). |
| `components/pos/PosPaymentModal.vue` | Cobro: efectivo / tarjeta / transferencia, o crédito del cliente con abono inicial opcional. |
| `components/pos/PosDiscountModal.vue` | Descuento por línea o a toda la venta, con paso de autorización de gerente. |
| `components/receipt/ReceiptPreview.vue` | Ticket en vivo (pantallas `xl`) y comprobante al cobrar. |
| `components/receipt/RemissionModal.vue` | Nota de remisión desde el comprobante. |

## Store: `stores/sales.ts`

Modela **una sola venta viva** (DRAFT en el servidor = fuente de verdad).

- Estado: `sale`, `selectedClient`, `prescription`, `lastCompletedSale`.
- Banderas: `mutationsInFlight` (contador, no booleano: el escáner dispara ráfagas),
  `isBootstrapping`, `isCompleting`; `isMutating` = hay operaciones en vuelo.
- Getters: `items`, `itemCount`, `total`, `subtotal`, `discountTotal`, `taxTotal`, `balance`,
  `paidAmount`, `isEmpty`, `canChangeClient` (sólo en DRAFT), `discountsLocked` (ya hay un pago),
  `hasControlledItems`.
- Protecciones de concurrencia:
  - **Creación compartida**: varios escaneos con el carrito vacío esperan la misma promesa de
    `POST /sales`; los demás productos se agregan con `add-product`.
  - **Token de secuencia** en `refreshSale()`: descarta respuestas obsoletas.
  - **Idempotencia del cobro**: clave estable por (venta, método, monto) que se conserva en
    reintentos y se renueva al confirmar.
- Guardas antes de agregar: precio > 0, producto activo, stock **vendible** > 0 consultado en
  vivo (`GET /inventory/stock/:id`; distingue unidades caducadas).

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/sales/draft` | Recuperar el carrito abierto al entrar (`resumeDraft`). |
| POST | `/sales` | Crear la venta DRAFT con el primer producto (y cliente, si hay). |
| GET | `/sales/:id` | Refrescar la venta (totales, partidas re-preciadas). |
| POST | `/sales/:id/add-product` | Agregar producto. |
| PATCH | `/sales/:id/update-item/:itemId` | Cambiar cantidad (0 = quitar). |
| POST | `/sales/:id/remove-product/:itemId` | Quitar partida. |
| PATCH | `/sales/:id/set-client` | Asignar/quitar cliente (el backend re-precia). |
| PATCH | `/sales/:id/items/:itemId/discount` · `/sales/:id/discount` | Descuento por línea / a toda la venta. |
| POST | `/sales/:id/add-payment` | Registrar pago (con `Idempotency-Key` estable). |
| POST | `/sales/:id/complete` | Cerrar la venta (con `prescription` si hay controlados). |
| POST | `/sales/:id/cancel` | Descartar la venta. |
| GET | `/products/barcode/:code` | Resolver código escaneado. |
| POST | `/products/search` | Búsqueda por nombre. |
| GET | `/inventory/stock/:productId` | Stock vendible en vivo. |
| GET | `/client`, `/client/search`, `/client/:id` | Clientes. |
| GET | `/settings/discounts`, `/settings/taxes`, `/settings/remission` | Reglas de descuento, desglose de IVA, nota. |
| GET | `/company` | Ficha y plantilla del ticket. |
| POST | `/sales/:id/prints` | Registrar impresión (ver [IMPRESION.md](IMPRESION.md)). |

## Flujo

1. Al montar: foco en el escáner, carga ficha/plantilla, `discounts`, `taxes`, `remission`, y
   `resumeDraft()` en segundo plano. Si recupera un carrito avisa "Recuperamos tu venta en curso…".
2. **Escaneo** (`Enter` en el campo): admite multiplicador `N*código` (1 ≤ N ≤ 999). El campo se
   deshabilita mientras hay operaciones en vuelo y recupera el foco al terminar.
3. **Cliente** (`F4`): con venta viva se persiste y el backend re-precia con precios especiales.
4. **Descuento**: botón por línea o "Descuento a toda la venta". Ver abajo.
5. **Cobrar** (`F2`): si no hay conexión con el servidor → aviso y no abre. Si hay controlados sin
   receta → abre primero el modal de receta. Luego el modal de cobro.
6. **Cobro**:
   - Contado: registra un pago por el saldo exacto (efectivo exige recibido ≥ total y muestra
     cambio; tarjeta/transferencia asumen monto exacto) y cierra la venta.
   - Crédito (sólo si el cliente tiene `hasCredit`): exige crédito disponible ≥ saldo; abono
     inicial opcional en efectivo; cierra la venta con saldo pendiente.
   - Montos comparados en centavos (`utils/money.ts`).
7. **Comprobante**: ticket en pantalla, botones **Imprimir**, **Nota de remisión (hoja carta)**
   (si `canPrintReceipt` y la nota está activada) y **Nueva venta**. En paralelo,
   `afterSaleCompleted` aplica el perfil de la caja (impresión automática / cajón).
8. **Descartar** (`F9`): confirmación del navegador → `POST /sales/:id/cancel` → carrito vacío.

### Descuentos (`PosDiscountModal`)

- Aparece sólo si `settings.discounts.enabled`. Se congelan cuando ya hay un pago registrado.
- Botones rápidos 5/10/15/20 % (hasta el máximo configurado). Valida 0–100 con dos decimales,
  motivo obligatorio si `requireReason`, y bloquea si el neto queda bajo costo y
  `allowBelowCost` es falso.
- `utils/discount-policy.ts` (espejo del backend) anticipa: permitido, **requiere autorización**
  (supera el tope del rol) o rechazado. Con autorización, un gerente teclea **su usuario y
  contraseña en la misma caja**; viajan una vez en `authorizer` y se descartan (no abren sesión).
  Si el servidor responde 403 pidiendo autorización, el modal pasa a ese paso.
- "Quitar descuento" envía 0 %.

### Cambio de precio y precios por cliente (`PosPriceModal`, ADR-0025)

- El precio unitario de cada línea es un botón (si `puedeCambiarPrecio(rol, pricing)`, `utils/pricing-policy.ts`).
- El modal muestra precio actual, de lista y —para gerencia (`canViewInventoryValuation`)— costo y ganancia;
  avisa "sin ganancia" (igual al costo) y bloquea "bajo costo" salvo `pricing.allowBelowCost`
  (`utils/price-margin.ts`, mismo criterio que el servidor).
- Con cliente: casilla "Guardar como precio especial de …" (marcada según `pricing.saveForClientByDefault`).
- Etiquetas en la línea: **Precio cliente** (`priceSource = CLIENT`) y **Precio editado** (`MANUAL`);
  icono de aviso si la línea no deja ganancia.
- `sales.setItemPrice()` → `PATCH /sales/:id/items/:itemId/price`. Congelado tras un pago.
- Al elegir cliente, el aviso dice cuántos productos cambiaron (`repriced`), o nada si ninguno.

## Permisos relevantes

| Permiso | Efecto |
|---|---|
| `canSell` | Acceso a la pantalla. |
| `canPrintReceipt` | Botón de nota de remisión. |
| Tope por rol (`settings.discounts`) | Lo decide el servidor; el front sólo anticipa. |

## Atajos de teclado

| Tecla | Acción | Condición |
|---|---|---|
| `F2` | Cobrar | Sin modal abierto ni operación en curso. |
| `F3` | Buscar producto | Ídem. |
| `F4` | Asignar cliente | Ídem. |
| `F9` | Descartar venta | Ídem (pide confirmación). |
| `Esc` | Cierra el modal superior (descuento → búsqueda → cliente → receta → cobro) y regresa el foco al escáner | Siempre. En la nota de remisión, `Esc` cierra sólo la nota. |
| `Enter` | Agrega lo escrito en el escáner | Foco en el escáner. |

El modal de cobro **no** confirma con `Enter`: se usa el botón **Cobrar**.

## Estados de error

| Situación | Comportamiento |
|---|---|
| Sin conexión con el servidor | Banner global; **Cobrar** deshabilitado con *tooltip* "Sin conexión con el servidor". |
| Código no encontrado | Toast "No se encontró un producto con el código …". |
| Precio 0 / producto inactivo / sin stock vendible | Toast específico; no se agrega. |
| Multiplicador fuera de rango | "La cantidad debe estar entre 1 y 999." |
| Error del backend en una mutación | Toast del interceptor; el carrito se refresca desde el servidor. |
| `resumeDraft` falla | Silencioso: el POS arranca vacío. Si el cliente del borrador no carga, se avisa que se reasigne con F4 antes de cobrar a crédito. |
| Fallo de impresora tras cobrar | Aviso; la venta ya está cobrada. Se puede reimprimir. |

## Decisiones relevantes

- **El carrito vive en el servidor** (DRAFT): sobrevive a F5, cortes de luz y sesión caducada.
- **Bloqueo de actualización** (ADR-0018): `useUpdateHold('pos', …)` con "Hay una venta en curso
  en el punto de venta." o "Hay un comprobante de venta en pantalla.".
- **Cobrar sin servidor no se intenta** (ADR-0017): mejor un botón deshabilitado con explicación
  que un error genérico.
- **Atajos sólo con la pantalla libre**: F-keys no actúan con modales abiertos ni durante una
  operación (antes F9 descartaba a mitad de un cobro).

## Vista previa del ticket (v1.5)

La vista previa de la columna derecha ocupa todo el alto libre del panel (antes un recuadro fijo de
224 px la cortaba) y se desplaza si no cabe; **Ver ticket completo** la abre a tamaño real
(`showTicketPeek`, cuenta como ventana abierta para Esc y las teclas F).
