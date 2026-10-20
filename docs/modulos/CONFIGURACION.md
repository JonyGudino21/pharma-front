# Módulo: Configuración

Contenedor con pestañas y nueve secciones. La lista de secciones es única
(`utils/settings-sections.ts`) y alimenta las pestañas y el menú lateral.

## Rutas

| Ruta | Archivo | Permiso | Dónde se guarda |
|---|---|---|---|
| `/settings` | `pages/settings.vue` + `pages/settings/index.vue` | — | Redirige a la primera sección visible (o a `/`). |
| `/settings/ticket` | `pages/settings/ticket.vue` | `canManageCompany` | Servidor (`/company`). |
| `/settings/cash` | `pages/settings/cash.vue` | `canManageSettings` | Servidor (`settings/cash`). |
| `/settings/inventory` | `pages/settings/inventory.vue` | `canManageSettings` | Servidor (`settings/inventory`). |
| `/settings/discounts` | `pages/settings/discounts.vue` | `canManageSettings` | Servidor (`settings/discounts`). |
| `/settings/taxes` | `pages/settings/taxes.vue` | `canManageSettings` | Servidor (`settings/taxes`). |
| `/settings/remission` | `pages/settings/remission.vue` | `canManageSettings` | Servidor (`settings/remission`). |
| `/settings/devices` | `pages/settings/devices.vue` | `canManageSettings` | **Este navegador** (`localStorage`). |
| `/settings/users` | `pages/settings/users.vue` | `canManageUsers` | Ver [USUARIOS_Y_PERMISOS.md](USUARIOS_Y_PERMISOS.md). |
| `/settings/permissions` | `pages/settings/permissions.vue` | `canManageUsers` | Sólo lectura. |

## Piezas comunes

| Pieza | Función |
|---|---|
| `composables/useSettingsForm.ts` | Estado de las secciones con namespace (caja, inventario, descuentos, impuestos, nota). |
| `components/settings/SettingsPageHeader.vue` | Título, fecha y autor del último cambio (o "Valores de fábrica…") y aviso de conflicto con "Recargar". |
| `components/settings/SettingsCard.vue` | Tarjeta con marca de "modificado". |
| `components/settings/SettingsHistory.vue` | Bitácora de cambios (`GET /settings/:ns/history`, 8 por página). |
| `components/settings/fields/SettingsNumberField.vue`, `SettingsSwitch.vue` | Campos con indicador de "modificado"; el numérico ofrece restaurar el valor de fábrica. |
| `components/settings/ticket/SegmentedControl.vue` | Selector segmentado. |
| `components/shared/UnsavedChangesBar.vue` | Barra "Guardar / Descartar" mientras hay cambios. |

### `useSettingsForm(namespace, { validate, savedMessage, onSaved })`

- Carga forzada (`fetch(ns, { force: true })`) con `loadError` distinto de vacío.
- `changedKeys`/`dirty` contra lo **último guardado**; `isChanged(key)`; `discard()`;
  `restoreDefault(key)` (valores de fábrica del snapshot).
- `save()`: sólo lo cambiado + `version`. 409 → `conflict = true` (se ofrece recargar sin perder
  lo escrito).
- Confirmación al salir con cambios (navegación interna y `beforeunload`).
- `Ctrl+S` / `Cmd+S`.
- `useUpdateHold('settings:<ns>')`: con cambios sin guardar no se ofrece actualizar la app.
- La validación local repite los rangos del backend sólo para retroalimentación.

## Secciones

### Ticket (`canManageCompany`) — `composables/useTicketStudio.ts`

- **Ficha de la farmacia**: razón social, nombre comercial, RFC (validado con `utils/rfc.ts`),
  régimen fiscal, domicilio, teléfono, correo, URL del logo, pie del ticket.
- **Plantillas**: pestañas por plantilla, crear copia (58 u 80 mm), marcar como predeterminada,
  desactivar. Opciones: ancho, tamaño de letra (1 o 2), charset (`ascii`/`cp850`), mostrar logo,
  RFC, domicilio, teléfono, y **orden de bloques** (encabezado, datos, partidas, totales, pagos,
  pie; "partidas" y "totales" no se pueden quitar).
- Vista previa en vivo (navegador y térmica) e **impresión de prueba** con lo que está en
  pantalla.
- Guardado único: primero la ficha y luego la plantilla; si la ficha falla no se toca la
  plantilla. Confirmación al cambiar de plantilla o salir con cambios; `Ctrl/Cmd+S`.
- Endpoints: `GET/PATCH /company`, `POST /company/templates`, `PATCH/DELETE /company/templates/:id`,
  `POST /company/templates/:id/default`.

### Caja (`settings/cash`)

| Campo | Regla (front) |
|---|---|
| Tolerancia del arqueo | $0–$100,000, 2 decimales. Con ejemplo vivo de qué diferencia queda como "Requiere auditoría". |
| Fondo sugerido | $0–$1,000,000. Se propone al abrir turno. |
| Límite de efectivo en caja | $0–$10,000,000 (0 = sin límite); no menor que el fondo sugerido. |
| Cierre ciego | El cajero no ve esperado ni diferencia. |

### Inventario (`settings/inventory`)

| Campo | Regla (front) |
|---|---|
| Horizonte de alerta | 7–365 días. |
| Días críticos | 1–180, menor que advertencia. |
| Días de advertencia | 2–365, no mayor que el horizonte. |
| Criterio de caducidad | "Se vende hasta el día impreso" o "Deja de venderse ese día". |
| Exigir lote en toda entrada | Lote y caducidad en altas con stock y compras, no sólo controlados. |
| Stock mínimo sugerido | Entero 0–100,000; se propone en el alta de producto. |

Incluye `ExpiryScale.vue` (escala visual de los umbrales).

### Descuentos (`settings/discounts`)

| Campo | Regla (front) |
|---|---|
| Descuentos en caja | Activa/desactiva el botón en el POS. |
| Tope del cajero / farmacéutico / gerente | 0–100 %, 2 decimales, ≤ máximo. |
| Descuento máximo | Techo absoluto y tope del administrador. |
| Motivo obligatorio | Exige motivo en todo descuento. |
| Autorización de gerente | Permite superar el tope propio con credenciales de gerente. |
| Vender bajo costo | Si es falso, el POS bloquea descuentos que dejan el neto bajo costo. |

Muestra una "escalera" visual de topes por rol.

### Impuestos (`settings/taxes`)

| Campo | Valores |
|---|---|
| Tasa general | 16 % o 8 % (región fronteriza). |
| IVA de productos nuevos | `GENERAL`, `ZERO`, `EXEMPT` (`utils/tax-categories.ts`). |
| Desglose en el ticket | Muestra el IVA incluido por tasa. |

Acción aparte (no es un ajuste): **asignar IVA en bloque a una categoría** con confirmación →
`PATCH /products/tax-category`.

### Nota de remisión (`settings/remission`)

| Campo | Valores |
|---|---|
| Permitir notas de remisión | Si se apaga, el botón desaparece del POS y del historial (y el servidor rechaza la emisión). |
| Tamaño de hoja | Carta o A4. |
| Forma de pago y saldo · Líneas de firma · Columna de código · Desglose de IVA | Contenido de la hoja. |
| Detalle de cada producto: SKU · Lote · Caducidad | Interruptores independientes (`showSku`, `showLot`, `showExpiry`); la línea bajo el nombre sólo muestra lo encendido y lo que la partida tiene. |
| Datos de la farmacia en la nota: Logo · Razón social · RFC · Régimen fiscal · Domicilio · Teléfono · Correo | Interruptores independientes (`showLogo`, `showLegalName`, `showRfc`, `showFiscalRegime`, `showAddress`, `showPhone`, `showEmail`), todos encendidos de fábrica. Cada dato sale sólo si está encendido y la ficha lo tiene; los valores se editan en **Ticket › Datos de la farmacia**. El nombre siempre sale. Sin logo no se pone la marca de PharmaPOS: el nombre ocupa el lugar. |
| Leyenda | ≤ 300 caracteres; por omisión aclara que no es CFDI. |
| Condiciones | ≤ 600 caracteres; vacío = no se imprime. |

Vista previa en vivo (`RemissionSheet`) con una venta de ejemplo y la ficha de la farmacia, con lo
que está en el formulario aunque no se haya guardado. Ver [IMPRESION.md](IMPRESION.md).

### Dispositivos (este navegador)

Perfil de la caja (`composables/useTerminal.ts`): nombre, modo de impresión (térmica USB o
navegador), emparejar/olvidar impresora (WebUSB), impresión automática al cobrar, abrir cajón en
cobros con efectivo y pin del cajón (2 o 5). Con modo navegador se apagan automática y cajón.
Botones **Imprimir prueba** y **Probar cajón** (este último con `canWithdrawCash`; queda
registrado como evento `TEST`). Ambos exigen guardar antes. Confirmación al salir con cambios y
`Ctrl/Cmd+S`. Ver [IMPRESION.md](IMPRESION.md).

## Endpoints consumidos

`GET/PATCH /settings/:ns`, `GET /settings/:ns/history`, los de `/company` (Ticket),
`GET /category/options` y `PATCH /products/tax-category` (Impuestos),
`POST /cash-shift/drawer-events` (Dispositivos).

## Estados de error

| Situación | Comportamiento |
|---|---|
| Falla la carga | Tarjeta de error con "Reintentar" (no formulario vacío). |
| Campos inválidos | Mensaje por campo; "Revisa los campos marcados antes de guardar." |
| 409 (otro usuario guardó) | Aviso de conflicto con "Recargar"; lo escrito no se pierde. |
| `localStorage` bloqueado (Dispositivos) | "Este navegador no permite guardar la configuración…". |

## Decisiones relevantes

- **Dispositivos por navegador, el resto en el servidor**: la impresora está físicamente en esa
  PC; dos cajas = dos perfiles.
- Guardado de **sólo lo cambiado con versión** (concurrencia optimista).
- Ticket y Dispositivos no usan `useSettingsForm` y **no** registran bloqueo de actualización.

## Novedades (10/10/2026)

- **Dispositivos › Guía de conexión** (`components/settings/DevicesGuide.vue`): panel lateral con pasos
  sin tecnicismos para impresora, cajón y lector de códigos, y una sección "Si algo no funciona".
- **Nota de remisión › Densidad de la tabla**: Automática (recomendada), Cómoda o Compacta. La vista
  previa permite ver un ejemplo de 3 o de 30 productos.
- Estado de las 9 secciones (Ticket, Caja, Inventario, Descuentos, Impuestos, Nota de remisión,
  Dispositivos, Usuarios, Permisos): todas implementadas y verificadas en vivo, sin errores de carga.
