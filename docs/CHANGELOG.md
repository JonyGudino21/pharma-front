# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado
[SemVer](https://semver.org/lang/es/) según `CONTRIBUTING.md`. Las versiones publicadas se
etiquetan `vX.Y.Z` en `main`; el historial anterior a este archivo está en `git log`.

## [Sin publicar]

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
