# Módulo: Impresión (ticket térmico, dispositivos y nota de remisión)

Resumen de arquitectura en [ARQUITECTURA.md §8](../ARQUITECTURA.md#8-impresión). Aquí, el detalle.

## Dónde se imprime

| Origen | Documento | Cómo |
|---|---|---|
| POS, comprobante | Ticket | Botón **Imprimir** o automático al cobrar (perfil de la caja). |
| POS, comprobante | Nota de remisión | Botón **Nota de remisión (hoja carta)** → `RemissionModal`. |
| `/sales/:id` | Ticket / Nota | Reimpresión (sale como copia). |
| Configuración › Ticket | Prueba de ticket | `printTest` con la plantilla en pantalla. |
| Configuración › Dispositivos | Prueba de ticket / cajón | `printTest`, `openWithAudit('TEST')`. |
| `/inventory/controlled` | Libro de controlados | `window.print()` de la página. |

## Piezas

| Pieza | Responsabilidad |
|---|---|
| `composables/useReceiptPrint.ts` | Orquesta: reglas (no borradores, no anuladas), registro de copia, canal térmico/navegador, nota de remisión. |
| `composables/useTerminal.ts` | Perfil de **esta caja** en `localStorage` (`pharma.terminal.v1`), validado campo a campo. |
| `composables/usePrinterDevice.ts` | WebUSB: elegir/emparejar/olvidar impresora, enviar bytes, pulso de cajón. |
| `composables/useCashDrawer.ts` | Apertura del cajón sin venta, auditada. |
| `utils/receipt-view.ts` | `saleToReceiptView` / `cartToReceiptView`: modelo único del ticket. IVA por tasa con lo que el servidor **congeló** en cada línea. |
| `utils/encode-receipt.ts` | `buildThermalReceipt` (líneas finales + advertencias: acentos, recortes, logo, marca de agua) y `encodeReceipt` (bytes). |
| `utils/escpos.ts` | Encoder ESC/POS mínimo, mapa CP850, `encodeDrawerPulse(pin)`, `padLine`. |
| `utils/pharma-ticket-css.ts` | CSS del ticket para la impresión del navegador. |
| `utils/print-html.ts` | `printHtmlDocument(html)`: iframe oculto, espera fuentes/imágenes (≤ 3 s), `print()`. |
| `utils/remission-view.ts` | `saleToRemissionView`, `remissionFolio`, `sampleRemissionView`. |
| `utils/remission-html.ts` | `renderRemissionHtml` (documento completo) y `esc`. |
| `utils/amount-in-words.ts` | `importeConLetra`. |
| `components/receipt/ReceiptPreview.vue` | Ticket HTML (pantalla y navegador). |
| `components/receipt/ThermalPreview.vue` | Vista carácter por carácter de lo que imprimirá la térmica. |
| `components/receipt/RemissionSheet.vue` | Hoja a escala en un `<iframe srcdoc sandbox="">`. |
| `components/receipt/RemissionModal.vue` | Vista previa e impresión de la nota. |
| `stores/company.ts` → `registerPrint(saleId, channel, templateId?, document='TICKET')` | `POST /sales/:id/prints`. |

## Ticket

### Reglas de `printSale(sale, opts)`

1. Borrador → "Cobra la venta para imprimir el ticket." · Anulada → "Esta venta está anulada…".
2. Requiere ficha de la farmacia y plantilla predeterminada.
3. Busca impresora térmica (si el perfil es `thermal` y hay WebUSB). En automático **no** abre el
   selector; si no hay impresora, avisa y no registra copia.
4. Registra la copia (`THERMAL` o `BROWSER`) **antes** de imprimir.
5. Térmica: bytes ESC/POS (con pulso de cajón si se pidió). Si falla: en automático avisa
   "Reimprímelo"; en manual cae al diálogo del navegador.
6. Navegador: imprime el HTML del ticket en un iframe con fuentes locales
   (`'IBM Plex Mono', ui-monospace, …`).
7. Mensajes: "Ticket original enviado a la impresora" / "Copia N enviada a la impresora".

### Perfil de la caja (`TerminalProfile`)

| Campo | Por omisión | Nota |
|---|---|---|
| `name` | "Caja 1" | Aparece en la bitácora del cajón (máx. 60). |
| `printMode` | `thermal` | `browser` desactiva automática y cajón al guardar. |
| `printer` | `null` | `{ vendorId, productId, serialNumber, label }`. |
| `autoPrint` | `false` | Sólo térmica. |
| `openDrawerOnCash` | `false` | Pulso en cobros con pago en efectivo. |
| `drawerPin` | `0` (pin 2) | `1` = pin 5. |

Filtros del selector USB: clase de impresora (7) y fabricantes Epson, Star, Custom, STMicro,
Winbond, NXP.

### Al cobrar (`afterSaleCompleted`)

- `autoPrint` + térmica → `printSale({ auto: true, openDrawer })`.
- Sin automática pero con cajón y pago en efectivo → sólo el pulso.
- Nunca falla la venta: cualquier problema se avisa y se puede reimprimir.

## Nota de remisión (ADR-0019)

Documento **no fiscal** en hoja Carta/A4 para entregas a clientes, empresas y ventas a crédito.

### Contenido

- Encabezado: logo (si carga; si no, se quita), nombre comercial, razón social (si difiere), RFC,
  domicilio, teléfono/correo; a la derecha "NOTA DE REMISIÓN", folio, fecha/hora y sello:
  `VISTA PREVIA` (copia 0), `ORIGINAL` (1) o `COPIA N`.
- Cliente ("Público en general" sin datos de contacto, o nombre, RFC, domicilio, teléfono y
  correo) y datos de la venta (ticket `FAC-…`, quién atendió, estado **PAGADA** o
  **A CRÉDITO / PENDIENTE**).
- Partidas: #, código (opcional), descripción (con "Descuento N%"), cantidad, precio unitario,
  descuento (columna sólo si alguna línea lo tiene) e importe.
- Totales: subtotal, descuento, IVA incluido por tasa (opcional), TOTAL, pagado y saldo
  (opcional).
- Importe con letra ("MIL DOSCIENTOS TREINTA Y CUATRO PESOS 50/100 M.N.").
- Formas de pago (opcional), aviso de devoluciones si las hay ("los importes corresponden a la
  venta original"), observaciones de la venta, condiciones, líneas de firma "Entregó" / "Recibí
  de conformidad" (opcional) y leyenda.
- Pie de página "Página X de Y" en impresión.

### Folio

`remissionFolio(invoiceNumber, saleId)`: `FAC-20261010-000123` → `NR-20261010-000123`; otro folio
se conserva; sin folio `NR-000123` (id con ceros) o `NR-SIN-FOLIO`. No hay secuencia aparte.

### Flujo de impresión (`printRemission`)

1. Mismas reglas que el ticket (no borradores, no anuladas).
2. Lee `settings/remission` (o los valores de fábrica si falla). Si está desactivada → aviso.
3. Requiere ficha de la farmacia.
4. `registerPrint(saleId, 'BROWSER', undefined, 'REMISSION')` → `copyNumber` (numeración propia
   de la nota).
5. Genera el HTML con ese número y lo imprime con `printHtmlDocument` (el diálogo permite
   "Guardar como PDF").

`RemissionModal` muestra la vista previa (copia 0) y anuncia si se imprimirá como ORIGINAL o
COPIA N. `Esc` cierra sólo la nota (captura el evento antes que el POS).

### Seguridad

- Todo dato humano pasa por `esc()` (`& < > " '`); saltos de línea de leyenda y condiciones se
  convierten en `<br />` después de escapar.
- La vista previa usa `sandbox=""` (sin scripts).
- Probado en `app/utils/remission-html.spec.ts`.

### Importe con letra

`importeConLetra(importe)` trabaja en centavos enteros; cubre apócope ("UN", "VEINTIÚN"),
"CIEN" vs "CIENTO", "UN MILLÓN DE PESOS", centavos "NN/100 M.N."; hasta 999,999,999,999.99 (más
arriba o negativo devuelve vacío). Probado en `app/utils/amount-in-words.spec.ts`.

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| POST | `/sales/:id/prints` | `{ channel, templateId?, document? }` → `{ copyNumber, … }`. |
| GET | `/company` | Ficha y plantillas. |
| GET | `/settings/taxes`, `/settings/remission` | Desglose de IVA y configuración de la nota. |
| POST | `/cash-shift/drawer-events` | Auditoría de apertura del cajón. |

## Permisos

`canPrintReceipt` (botón de nota), `canWithdrawCash` (cajón sin venta y prueba de cajón),
`canManageCompany` (Configuración › Ticket), `canManageSettings` (Dispositivos, Nota de remisión).

## Estados de error

| Situación | Mensaje |
|---|---|
| Sin ficha o plantilla | "Falta configurar la ficha de la farmacia y una plantilla de ticket." |
| Térmica no responde (manual) | "La impresora térmica no respondió. Se abrirá el diálogo del navegador." |
| Térmica no responde (automática) | "La impresora no respondió y el ticket no salió. Reimprímelo." (o con cajón). |
| No abre el diálogo del navegador | "No se pudo abrir la impresión del navegador… (saldrá como copia)." |
| Nota desactivada | "La nota de remisión está desactivada en Configuración." |
| Falla preparar la vista previa de la nota | "No se pudo preparar la nota." con Reintentar. |

## Decisiones relevantes

- **Lo que se ve es lo que sale**: un modelo para ticket (HTML y térmica) y un generador para la
  nota (vista previa y papel).
- **Registrar antes de imprimir**: la bitácora manda; si el papel falla, la siguiente es copia.
- **Sin dependencias de red al imprimir**: fuentes del sistema o servidas por la app.
- La nota **no recalcula importes**: usa los que el servidor congeló (ADR-0016).
