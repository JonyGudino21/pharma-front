# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado
[SemVer](https://semver.org/lang/es/) según `CONTRIBUTING.md`. Las versiones publicadas se
etiquetan `vX.Y.Z` en `main`; el historial anterior a este archivo está en `git log`.

## [Sin publicar]

### Cobranza y días de crédito (23/10/2026, v1.6.0)

- **Clientes › Cobranza** (antes Deudores, misma ruta): total por cobrar, **termómetro de
  antigüedad** (`components/credit/AgingThermometer.vue`), pestañas Por cliente / Ventas por cobrar,
  fecha de pago editable (`DueDateModal`). Entrada en el menú Clientes. ADR-0029.
- **Panel:** `ReceivablesWidget` y `PayablesWidget` (Cobrar y pagar).
- **Caja:** fecha de pago opcional al cargar a crédito y aviso de saldo vencido al elegir cliente.
- **Compras:** fecha límite de pago (propuesta con los días del proveedor) y edición en el detalle.
- **Cliente:** «Días para pagar» en Configurar crédito; fecha de pago y situación en el estado de cuenta.
- **Configuración › Crédito** (`pages/settings/credit.vue`).
- Ayuda: Clientes (cobranza, fecha de pago), Panel, Punto de venta, Compras, Proveedores, Configuración.

### Ventas y compras más rápidas (23/10/2026, v1.5.0)

- **Compras · buscador nuevo** (`PurchaseProductPicker`): nombre, SKU y código de barras; modos
  Todo / Nombre / Código; con el lector (Enter) el producto se agrega directo.
- **Compras · alta de producto sin salir** de la compra ni de «Agregar partida»: `ProductFormModal`
  con `initial` y `for-purchase` (sin stock inicial); devuelve el producto creado. ADR-0026.
- **Compras · folio sugerido** (`FAC-001-ALV-20261023`) bajo el campo; el folio deja de ser
  obligatorio.
- **Ventas · Volver a vender** (anuladas) / **Repetir venta** (cobradas): botón en el detalle y acción
  ↻ en la tabla; el punto de venta muestra qué cambió (`PosReorderNotice`). ADR-0027.
- **Punto de venta:** la vista previa del ticket ocupa el alto libre y tiene «Ver ticket completo».
  La búsqueda (F3) también encuentra por código de barras.
- **Configuración › Ticket:** la vista previa térmica se ajusta al ancho de su columna (sin barra
  horizontal en 80 mm).
- Ayuda: Compras (folio sugerido, producto nuevo, escáner), Ventas (volver a vender), Punto de venta.

### Precios por cliente y comprobantes (20/10/2026, v1.4.0)

- **Cambiar el precio en caja** (botón en el precio de cada línea, `PosPriceModal`), con **precio
  especial por cliente**, avisos de "sin ganancia" / "bajo costo" y etiquetas **Precio cliente** /
  **Precio editado**. ADR-0025.
- **Clientes › Estado de cuenta › Precios especiales**: ver, agregar, cambiar, quitar e historial.
- **Configuración › Precios en caja**: quién puede, motivo, casilla de cliente y vender bajo costo.
- **Corregido: no se podía guardar el nombre comercial.** El aviso de "versión nueva" tapaba el botón
  Guardar en pantallas de ~1366 px y a la vez esperaba a que se guardara. Ahora se coloca arriba de la
  barra y, con cambios pendientes, se reduce a un aviso compacto. La barra dice qué campo corregir y
  lleva a él. El RFC se normaliza al cargar.
- **Corregido: el Encabezado del ticket térmico se iba al final** al apagarlo y encenderlo: vuelve a su
  lugar. La vista "Navegador" respeta el orden de los bloques. Avisos claros: el logo no se imprime en
  térmica; RFC/domicilio/teléfono vacíos no aparecen.
- **Nota de remisión:** cada dato de la farmacia se muestra u oculta por separado (logo, razón social,
  RFC, régimen fiscal —nuevo—, domicilio, teléfono, correo).
- El POS refresca los datos de la farmacia (al volver a la ventana, máx. 1 vez por minuto).

### Corregido — contrato con el servidor (16/10/2026, v1.3.0)

- **Crear producto** fallaba con 400: el formulario mandaba `isActive` al dar de alta. El cuerpo se
  arma en `utils/product-payload.ts` (alta y edición por separado, con pruebas de los campos exactos);
  el tipo del alta ya no admite `isActive`.
- **Correo incompleto** (`ana@farmacia`) en clientes y proveedores: aviso en español antes de enviar
  (`utils/email.ts`, la misma regla que el servidor).
- Si el servidor responde `CAMPOS_NO_RECONOCIDOS` (caja con la versión anterior abierta), se revisa
  al momento si hay versión nueva y se muestra el aviso de actualizar (`useAppUpdate().comprobarAhora`).

### Producción (ADR-0024, 11/10/2026)

- `Dockerfile`: compila la SPA con la API relativa (`/api`) y la sirve con Caddy; el mismo build
  sirve para cualquier farmacia.
- `pnpm generate` documentado como el build de producción; `.env.example` y `.nvmrc`.

### Ayuda contextual y diseño responsivo (ADR-0023, 11/10/2026)

- **Botón Ayuda en todas las pantallas**: abre la guía de la pantalla (y la sección de la
  subpantalla: Caducidades, Controlados, Deudores, Historial de turnos, Nueva compra). 13 guías sin
  tecnicismos, con buscador. Sustituye a la guía suelta de Dispositivos.
- **Celular y tableta**: menú en cajón (antes ocupaba 256 de 375 px), listas como tarjetas, filtros
  plegables, modales como hoja inferior con pie fijo, campos de 16 px (sin zoom en iOS), objetivos
  táctiles ≥ 40 px, avisos y toasts sin encimarse. Escritorio sin cambios.
- **Tablas según el ancho del contenido** (container query): con el menú abierto en una laptop de
  1024 px se ven tarjetas; desde ~1280 px, tablas. Auditoría automática: sin desborde horizontal en
  21 pantallas a 375, 768, 1024 y 1280 px.
- **POS en celular**: barra fija con total y **Cobrar**; carrito en dos renglones; comprobante como
  hoja con Imprimir / Nueva venta siempre visibles; receta capturada editable desde el resumen.
- **Nota de remisión**: SKU, lote y caducidad se activan por separado en Configuración.

### Corregido (revisión de pantallas, 11/10/2026)

- **Crédito con abono inicial**: el cobro exigía crédito para el total aunque el abono cubriera una
  parte (el servidor sólo carga el resto). Ahora muestra «Se carga a crédito» y el abono mínimo.
- **Caja en el menú** para quien sólo supervisa turnos: lleva al historial (antes rebotaba).
- **Detalle de turno**: estados, movimientos de efectivo y métodos en español con signo correcto;
  nueva sección «Aperturas de cajón sin venta».
- **Historial de turnos, compras, productos y categorías**: un fallo de carga se muestra como error
  con **Reintentar** (antes parecía lista vacía). El detalle de compra ya no gira para siempre.
- **Venta**: «Imprimir ticket» y la nota sólo en ventas cerradas no anuladas y con permiso.
- **Clientes**: tarjetas del estado de cuenta con nombres correctos; alta sin correo ni teléfono;
  «Cliente activo» se guarda al editar; Deudores con su propia paginación y permiso en el enlace;
  configuración de crédito desde Deudores carga los datos reales.
- **Búsquedas**: proveedores y productos filtran Activos/Inactivos en el servidor (antes sólo los
  primeros 100); productos por nombre o SKU parcial; usuarios por nombre, usuario o correo.
- **Compras**: un solo vocabulario (Pagada / Pago parcial / Sin pagar / Anulada; Efectivo,
  Transferencia…); lote y caducidad van en pareja y costo mínimo $0.01, con el mismo mensaje en
  captura y edición. Kardex con tipos en español y «Saldo».
- **Dashboard**: «Top 5 productos más vendidos» por piezas; métodos de pago en español; sin
  filtros de fecha para quien no ve analítica.
- **Contraseña**: avisa si la nueva es igual a la actual. Toasts de información con icono.
- Controlado con existencia sin lote: el mensaje indica **Inventario › Asignar lote**.
- **Compras › Editar partida**: dejar lote y caducidad vacíos ahora quita el lote (antes se conservaba
  el anterior sin aviso). El formulario lo explica.
- **Descartar venta** usa la confirmación de la app (antes el diálogo del navegador).
- **Buscar cliente** en el POS y el directorio: el servidor rechazaba `page`/`limit` (corregido en el backend).

### Identidad única y densidad adaptativa (ADR-0021)

- Ticket, modal "Venta cobrada" y nota de remisión con la identidad azul de PharmaPOS (antes verde y
  dorado). El ticket tiene una sola fuente de estilo y la píldora del logo como marca.
- Nota de remisión con densidad adaptativa: cómoda hasta 7 productos, compacta desde 8 (21–24 en una
  sola hoja con totales y firmas; 50 productos en 2 hojas en lugar de 4). Ajustable en Configuración.

### Agregado

- **Inventario › Asignar lote** para la existencia sin lote (ADR-0022).
- **Dispositivos › Guía de conexión** sin tecnicismos (impresora, cajón, lector, problemas comunes).
- Alta de producto: explica que la caducidad se pide al capturar stock inicial (es del lote).
- Guía ejecutiva `docs/ejecutivo/LOTES_Y_CADUCIDADES.md`.

### Nota de remisión — rediseño "botica" (10/10/2026)

- Diseño premium y legible en impresora de un color: banda de guilloché, tipografías locales (Literata,
  IBM Plex Sans/Mono), **tabla con renglones alternos blanco/menta** para lectura con baja visión,
  lote y caducidad por partida, "N partidas · M piezas", total destacado y "Efectivo + crédito".
- Vista previa idéntica al papel (fuentes cargadas en el iframe). Botón "Imprimir o guardar PDF".

### Corregido (validación en vivo, 10/10/2026)

- **F5 cerraba la sesión** (crítico): con SSR, el servidor de Nuxt llamaba a `/auth/me` sin las cookies
  del navegador. La app pasa a **SPA** (`ssr: false`, ADR-0020) y se publica como estáticos.
- **Fechas en UTC:** historial, turnos y pagos mostraban la hora UTC (una venta de 6:26 p.m. aparecía
  como 00:26 del día siguiente). `utils/dates.ts` distingue momentos (hora local) de fechas de
  calendario (caducidades).
- **Carrito:** muestra "Ya pagado / Por cobrar" cuando hay abonos; avisa "Pagado de más" y el cobro no
  cierra una venta sobrepagada. Cambiar cantidad o quitar un producto ya no deja promesas sin atender
  y resincroniza con el servidor si éste lo rechaza.
- **Nota de remisión:** el modal anunciaba la copia equivocada (contaba dos veces).
- **Colores del tema:** faltaban los tonos 50–300 de éxito/advertencia/error (y 200–300 del primario);
  más de 150 clases (insignias, fondos, texto en modo oscuro) no generaban color.

### Corregido (revisión de calidad, de mayor a menor gravedad)

- **Cobro atorado.** Si el pago entraba pero el cierre fallaba, reintentar mandaba un pago de $0 que
  el servidor rechaza y la venta ya pagada no se podía cerrar. Ahora, con el saldo cubierto, el modal
  dice "El pago ya está registrado" y sólo cierra (**Cerrar venta**). El cierre también tolera un 409
  "ya completada" (respuesta perdida) y una consulta posterior fallida: la venta se da por cerrada y
  el carrito se libera.
- **Permisos de ventas.** Historial y detalle usan `canViewSalesHistory`; `canViewSalesSummary` es
  de gerencia (requiere el backend de la misma versión).
- **Detalle de compra** accesible con `canViewPurchases`; las acciones (recibir, cancelar, editar
  partidas, abonar, revertir pago) exigen `canManagePurchases`.
- **Deudores:** "Configurar crédito" y "Cobrar" respetan `canUpdateCreditConfig` y
  `canRegisterClientPayment`.
- **Historial de turnos** con permiso de ruta (`canViewAllShifts`), no sólo enlace oculto.
- **Devoluciones:** el efectivo estimado usa el importe NETO de la línea con la fórmula acumulativa
  del servidor (`utils/refund.ts`); antes ignoraba descuentos y prometía de más.
- **Descartar venta:** si el servidor no responde, el carrito se conserva y se avisa (antes se
  vaciaba la pantalla y el borrador "revivía" al volver).
- **Libro de controlados:** "Exportar CSV" usa la exportación oficial del servidor (completa, con BOM,
  bitácora de quién exportó y huella de integridad); antes se cortaba en silencio a 5,000 filas.
  Sólo gerencia (`canExportControlledLog`).
- **Pantallas sin estado de error:** tablero (conserva lo último cargado y ofrece reintento),
  detalle de turno (antes spinner infinito) y abrir turno / registrar operación (sin éxito falso).
- **Producto:** al editar, el IVA sólo se envía si cambió (antes un farmacéutico recibía 403 o un
  gerente cambiaba el IVA sin querer).
- **Código de barras** codificado en la URL (`encodeURIComponent`).
- **Crédito para clientes nuevos:** botón "Configurar crédito" en el listado de clientes (antes sólo
  existía en Deudores).
- **POS:** el cliente de respaldo del comprobante y la nota se fija al abrir el cobro (antes siempre
  llegaba vacío); Enter en "Efectivo recibido" confirma el cobro.
- **Páginas en minúsculas:** `pages/Index.vue` → `index.vue` y `pages/Login.vue` → `login.vue`
  (en Linux —CI, Docker, nube— la mayúscula podía romper la ruta raíz).
- **Bloqueo de actualización** también en Configuración › Ticket y › Dispositivos; **iconos
  locales** (`@iconify-json/ph`) para operar sin internet.
- Etiquetas de permisos y del rol Gerente actualizadas; icono propio para Compras.

### Agregado

- **Aviso de versión nueva sin recarga automática (ADR-0018).** `nuxt.config.ts` usa
  `experimental.emitRouteChunkError: 'manual'` y `checkOutdatedBuildInterval` de 5 min.
  Nuevos `composables/useAppUpdate.ts` (`useAppUpdate`, `useUpdateHold`),
  `plugins/app-update.client.ts` y `components/shared/AppUpdateBanner.vue`: "Actualizar ahora"
  o "Más tarde" (30 min); un archivo faltante (*chunk*) no se puede aplazar. Bloqueos mientras
  hay venta en curso o comprobante en el POS, cambios sin guardar en Configuración
  (`useSettingsForm`) o una compra a medio capturar.
- **Vigilante de conexión con el servidor (ADR-0017).** `composables/useConnectivity.ts`,
  `plugins/connectivity.client.ts` (sondea `GET /health/ready` cada 20 s, o 5 s fallando; avisa
  tras 2 fallos; 404 se trata como correcto; URL configurable con `NUXT_PUBLIC_HEALTH_URL`) y
  `components/shared/ConnectivityBanner.vue`. `$api` emite `pharma:network-suspect` ante errores
  de red. El POS deshabilita **Cobrar** sin servidor.
- **Nota de remisión (ADR-0019).** Documento en hoja Carta/A4 con total con letra:
  `utils/amount-in-words.ts`, `utils/remission-view.ts`, `utils/remission-html.ts` (un solo
  generador para vista previa e impresión, con escape de datos), `utils/print-html.ts`,
  `components/receipt/RemissionSheet.vue` y `RemissionModal.vue`, `printRemission` en
  `useReceiptPrint`, botón en el comprobante del POS y en el detalle de venta, y
  **Configuración › Nota de remisión** (`pages/settings/remission.vue`).
  `company.registerPrint()` acepta `document: 'TICKET' | 'REMISSION'` (copias numeradas por
  documento).
- **Configuración con pestañas** (`pages/settings.vue`) y secciones **Caja**, **Inventario**,
  **Descuentos**, **Impuestos**, **Nota de remisión**, **Dispositivos**, **Usuarios** y
  **Permisos**, con `stores/settings.ts` (caché de 60 s, guardado parcial con versión y conflicto
  409), `composables/useSettingsForm.ts`, bitácora de cambios y componentes de campos.
- **Descuentos en el POS** (`components/pos/PosDiscountModal.vue`, `utils/discount-policy.ts`):
  por línea o a toda la venta, tope por rol y autorización de gerente en la misma caja.
- **Dispositivos por caja**: `composables/useTerminal.ts` (perfil en `localStorage`),
  `usePrinterDevice.ts` (impresora emparejada por WebUSB) y `useCashDrawer.ts` (apertura del
  cajón auditada).
- **Pruebas unitarias con Vitest**: `vitest.config.ts`, script `pnpm test`, especificaciones
  `app/utils/amount-in-words.spec.ts`, `app/utils/remission-html.spec.ts` y
  `app/composables/useAppUpdate.spec.ts`, doble de `#app` en `test/nuxt-app-shim.ts`.
- Documentación: `README.md` del proyecto y carpeta `docs/` (arquitectura, módulos y guías
  ejecutivas).

### Cambiado

- **Tipografías servidas por la app** con `@fontsource/ibm-plex-mono` y `@fontsource/literata`
  (importadas en `assets/css/main.css`, subconjunto latino): sin Google Fonts, funcionan sin
  internet.
- **CI** (`.github/workflows/ci.yml`) ejecuta ahora `pnpm test` entre el typecheck y el build.
- Usuarios se administra en **Configuración › Usuarios**; `/users` redirige allí.
