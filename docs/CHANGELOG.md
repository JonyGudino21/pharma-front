# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado
[SemVer](https://semver.org/lang/es/) según `CONTRIBUTING.md`. Las versiones publicadas se
etiquetan `vX.Y.Z` en `main`; el historial anterior a este archivo está en `git log`.

## [Sin publicar]

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
