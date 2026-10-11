# Arquitectura del frontend

Documento técnico de referencia de `pharma-front`. Describe cómo está armada la aplicación y
por qué. Lo específico de cada pantalla está en [`modulos/`](modulos).

> Las decisiones de arquitectura (ADR) se citan por número (ADR-0014 … ADR-0019). Los ADR viven
> en el *playbook* del proyecto, fuera de este repositorio; el backend los cita igual en
> `pharma-back/docs/`.

---

## 1. Panorama

```
 Navegador (una pestaña por caja)
 ┌──────────────────────────────────────────────────────────────────────┐
 │ app.vue                                                              │
 │  ├─ GlobalToast · ConnectivityBanner · AppUpdateBanner · SupportRef. │  ← siempre visibles
 │  └─ NuxtLayout (default | blank) → NuxtPage                          │
 │                                                                      │
 │ pages/*  ──usa──▶ stores/* (Pinia) ──llama──▶ $api (plugins/api.ts)  │
 │    │                                              │                  │
 │    └─ composables/* (impresión, atajos, ajustes)  │ fetch + cookies  │
 │                                                   ▼                  │
 │ plugins/connectivity.client.ts ──fetch──▶ /health/ready              │
 │ plugins/app-update.client.ts  ◀── hooks de Nuxt (versión nueva)      │
 │ WebUSB ──▶ impresora térmica / cajón (composables/usePrinterDevice)  │
 └──────────────────────────────────────────────────────────────────────┘
                                │ HTTPS, credentials: 'include'
                                ▼
                     pharma-back (NestJS) /api/*
```

- **Nuxt 4** con el directorio `app/` (convención de Nuxt 4). Enrutado por archivos.
- **SPA, sin SSR** (`ssr: false`, ADR-0020). Con SSR, el primer render de un F5 llamaba a
  `/auth/me` desde el servidor de Nuxt **sin las cookies httpOnly** del navegador y la sesión se
  cerraba en cada recarga. Como SPA, toda llamada al API sale del navegador y el build se publica
  como **archivos estáticos** (`.output/public` o `nuxt generate`): Nginx/IIS local o un CDN.
  Lo que depende del navegador sigue protegido con `import.meta.client` por compatibilidad.
- **Pinia** con *setup stores*. `nuxt.config.ts` agrega `stores/` a los auto-imports, aunque el
  código importa los stores explícitamente.
- **Tailwind v4** vía plugin de Vite; el tema (colores `primary`, `success`, `warning`, `error`)
  se define con `@theme` en `app/assets/css/main.css`.

## 2. Estructura de carpetas

| Carpeta | Contenido |
|---|---|
| `app/pages/` | Rutas. Cada página declara su permiso con `definePageMeta({ requiredPermission })`. |
| `app/layouts/` | `default.vue` (menú lateral + encabezado) y `blank.vue` (login). |
| `app/middleware/auth.global.ts` | Restaura sesión, redirige a `/login` y valida `requiredPermission`. |
| `app/stores/` | Un store por módulo. **Aquí viven las llamadas al API.** |
| `app/composables/` | Lógica reutilizable: `useReceiptPrint`, `usePrinterDevice`, `useTerminal`, `useCashDrawer`, `useSettingsForm`, `useTicketStudio`, `useKeyboardShortcuts`, `useConnectivity`, `useAppUpdate`, `useRequestState`, `useToast`, `useCurrency`, `useDate`. |
| `app/plugins/` | `api.ts` (cliente HTTP `$api`), `connectivity.client.ts`, `app-update.client.ts`, `apexcharts.client.ts`. |
| `app/components/` | Por módulo: `pos/`, `receipt/`, `sales/`, `inventory/`, `catalog/`, `categories/`, `purchases/`, `suppliers/`, `clients/`, `users/`, `settings/`, `shared/`. |
| `app/utils/` | Lógica pura y probable: ESC/POS, modelo del ticket, nota de remisión, importe con letra, aritmética en centavos, política de descuentos, RFC, etiquetas de roles/permisos. |
| `app/types/` | Tipos compartidos: `auth.ts`, `receipt.ts`, `settings.ts`, `usb.d.ts` (WebUSB). |

## 3. Flujo de datos

**pages → stores → `$api` → backend.** Las páginas no llaman a `fetch` directamente (salvo
excepciones puntuales, ver abajo); piden a un store, el store usa `useNuxtApp().$api` y guarda el
resultado en estado reactivo.

```ts
// patrón típico de un store
async function fetchSales(page = 1) {
  const { $api } = useNuxtApp()
  const res = await $api<ApiResponse<{ sales: SaleListRow[]; pagination: … }>>(`/sales?${params}`)
  …
}
```

- Las respuestas del backend tienen la forma `ApiResponse<T> = { success, message, data }`
  (`types/auth.ts`). Las listas paginadas traen `pagination: { total, page, limit, totalPages }`
  y la colección bajo un nombre que varía por recurso (`sales`, `users`, `products`, `data`…).
- Excepciones donde la página llama a `$api` sin store: `pages/account/password.vue`
  (cambio de contraseña), `pages/clients/[id].vue` (estado de cuenta) y la exportación CSV de
  `pages/inventory/controlled.vue`.
- `useRequestState` (`composables/useRequestState.ts`) da a un recurso cuatro estados
  (`inicial | cargando | ok | error`) para distinguir **"no hay datos"** de **"no se pudieron
  cargar"**. Lo usan `salesHistory` y el estado de cuenta del cliente; otros stores
  (caducidades, libro de controlados, turno de caja, usuarios) guardan un `FalloPeticion` con
  `describirFallo()`.

### Stores

| Store | Responsabilidad |
|---|---|
| `auth` | Usuario, matriz de permisos, `can(permiso)`, login/logout/perfil. |
| `ui` | Menú lateral y registro de incidentes (referencias de fallos 5xx). |
| `settings` | Espejo en caché de la configuración del servidor (ver §7). |
| `company` | Ficha de la farmacia, plantillas de ticket y registro de impresiones. |
| `sales` | **La venta viva del mostrador** (carrito DRAFT). |
| `salesHistory` | Consulta de ventas cerradas, devoluciones y anulaciones. |
| `cashShift` | Turno actual, apertura/cierre, operaciones de efectivo, historial. |
| `inventory` | Kardex, ajustes, stock vendible, caducidades, libro de controlados, mermas. |
| `product`, `category` | Catálogo. |
| `purchase`, `supplier` | Compras y proveedores. |
| `client` | Clientes, deudores, abonos y crédito. |
| `userManagement` | Usuarios, sesiones y matriz de permisos por rol. |
| `analytics` | Tablero financiero. |

## 4. El cliente HTTP `$api` (`plugins/api.ts`)

Instancia de `$fetch.create` envuelta para poder reintentar tras renovar la sesión.

| Aspecto | Comportamiento |
|---|---|
| `baseURL` | `runtimeConfig.public.apiBaseUrl` (`NUXT_PUBLIC_API_BASE_URL`). |
| `credentials` | `'include'`: obligatorio porque el API vive en otro origen y la sesión va en cookies. |
| Timeout | **15 s**. Sin él una petición colgada dejaba el POS bloqueado. |
| `x-request-id` | UUID por petición; se conserva en el reintento. |
| `Idempotency-Key` | UUID en todo `POST`/`PATCH`; se conserva en el reintento para que un cobro que sí llegó no se duplique. El store de ventas fija su propia clave estable por intento de cobro. |
| Métodos | Tipo `MetodoHttp` cerrado: un método mal escrito falla al compilar. |

### Manejo de errores (centralizado)

`onRequestError` / `onResponseError` muestran el aviso; **los stores no repiten el toast**, sólo
deciden qué hacer con la pantalla.

| Caso | Aviso |
|---|---|
| Timeout | "El servidor tardó demasiado en responder. Verifica la venta antes de reintentar." |
| Sin respuesta (red) | "Error de red: No se pudo conectar al servidor". Además dispara el evento `pharma:network-suspect` para que el vigilante de conexión compruebe en el acto. |
| 400 / 409 | Mensaje del backend (o "Verifica los datos ingresados."). |
| 401 | Ver §5. En `/auth/login` (y demás rutas sin renovación) se muestra el mensaje del backend o "Credenciales incorrectas". |
| 403 | Mensaje del backend o "No tienes permiso para esta operación." |
| 429 | "Demasiados intentos. Espera un momento e inténtalo de nuevo." |
| 5xx | Se registra la referencia `requestId` completa en `ui.registrarIncidente()` (persistida en `sessionStorage`, máx. 10) y se muestra el aviso. `SupportReference.vue` deja la referencia visible y copiable para soporte. |

## 5. Autenticación: cookies `httpOnly` + renovación

- El backend emite **access** y **refresh** en cookies `httpOnly` (inaccesibles para JavaScript)
  y una **marca legible** `session_active=1` que no concede nada: sólo permite decidir de forma
  síncrona si hay sesión.
- `stores/auth.ts`: `isAuthenticated = !!session_active`. `login()` hace `POST /auth/login`, pone
  la marca y llama a `fetchProfile()` (`GET /auth/me` → usuario + matriz de permisos).
  `logout()` hace `POST /auth/logout` y limpia el estado local aunque falle. `clearSession()`
  también vacía la caché de configuración.
- `middleware/auth.global.ts` en cada navegación:
  1. Si hay marca pero no hay usuario en memoria (F5), llama a `fetchProfile()`.
  2. En `/login` con sesión → `/`.
  3. Sin sesión → `/login`.
  4. Si la ruta declara `requiredPermission` y `auth.can()` es falso → toast "Acceso denegado" y `/`.
- **Renovación** (en `$api`): ante un 401 de una ruta renovable, se hace **una sola**
  `POST /auth/refresh` compartida por todas las peticiones que fallaron a la vez (el backend rota
  el refresh token), y se reintenta **una vez** la petición original con las mismas cabeceras.
  Rutas que nunca renuevan: `/auth/refresh`, `/auth/login`, `/auth/logout`,
  `/auth/change-password`.
- Si la renovación falla: se borra la marca, se avisa una vez "Tu sesión ha expirado…" y a los
  3 s se hace una redirección dura a `/login`. El carrito DRAFT se conserva en el backend y el POS
  lo recupera al volver (`sales.resumeDraft()`).
- Los permisos en el front **sólo ocultan** lo que no se puede usar; quien decide es el backend.

## 6. Permisos en la interfaz

- Por ruta: `definePageMeta({ requiredPermission: 'canX' })` + middleware.
- Por elemento: `v-if="authStore.can('canX')"`.
- Menú (`layouts/default.vue`): cada entrada se filtra con el mismo permiso que exige la página.
  Las secciones de Configuración salen de una sola lista, `utils/settings-sections.ts`, que
  alimenta tanto el menú como las pestañas de `pages/settings.vue`.

La tabla completa de permisos por pantalla está en
[`modulos/USUARIOS_Y_PERMISOS.md`](modulos/USUARIOS_Y_PERMISOS.md).

## 7. Espejo de configuración (`stores/settings.ts`)

La configuración de operación vive en el servidor por *namespaces*: `inventory`, `cash`,
`discounts`, `taxes`, `remission` (`types/settings.ts`, espejo de `src/settings/definitions` del
backend).

- `fetch(ns)` → `GET /settings/:ns`. Caché por namespace con **frescura de 60 s** (el POS vive
  abierto todo el turno y debe enterarse de cambios del gerente). Peticiones simultáneas al mismo
  namespace se comparten. `fetch(ns, { force: true })` ignora la caché (pantallas de
  Configuración).
- `save(ns, version, values)` → `PATCH /settings/:ns` con **sólo los campos cambiados** y la
  versión que el usuario tenía en pantalla. Si otro usuario guardó antes, el servidor responde
  **409**.
- `history(ns)` → `GET /settings/:ns/history`.
- `valuesOf(ns)` lee la copia en caché de forma síncrona (lo usan POS, formularios de producto y
  compra, impresión).
- Se vacía al cerrar sesión.
- Regla general: la validación del front **sólo da retroalimentación**; si el servidor no
  entrega la configuración, cada pantalla usa un valor conservador (p. ej. el botón de descuento
  no aparece; la nota de remisión usa `DEFAULT_REMISSION_SETTINGS`).

`composables/useSettingsForm.ts` estandariza las pantallas de Configuración: carga forzada,
detección de cambios contra lo último guardado, guardado parcial con versión, conflicto 409,
confirmación al salir con cambios (ruta, cierre de pestaña), `Ctrl/Cmd+S` y bloqueo de la
actualización de la app mientras haya cambios sin guardar.

## 8. Impresión

Dos documentos por venta, cada uno con su **numeración de copias** en el servidor
(`POST /sales/:id/prints` con `document: 'TICKET' | 'REMISSION'` → `copyNumber`: 1 = original,
2+ = copia). El registro se hace **antes** de imprimir: si el papel no sale, la siguiente
impresión saldrá como copia, que es lo correcto para la bitácora.

### 8.1 Ticket: térmica (WebUSB + ESC/POS) o navegador

```
saleToReceiptView(sale)  ──▶ ReceiptSaleView (modelo único)
        │                        │
        │                        ├─▶ ReceiptPreview.vue (HTML en pantalla / impresión del navegador)
        │                        └─▶ buildThermalReceipt() ─▶ encodeReceipt() ─▶ bytes ESC/POS ─▶ WebUSB
```

- **Perfil de esta caja** (`composables/useTerminal.ts`): se guarda en `localStorage`
  (`pharma.terminal.v1`) **por navegador**, porque la impresora y el cajón están conectados a esa
  PC y el permiso WebUSB es por navegador. Campos: nombre de la caja, modo (`thermal` |
  `browser`), impresora emparejada (vendor/product/serie), impresión automática, abrir cajón en
  cobros en efectivo, pin del cajón (2 o 5).
- **Dispositivo** (`composables/usePrinterDevice.ts`): busca la impresora emparejada entre los
  dispositivos ya autorizados; si no hay emparejamiento y sólo hay uno autorizado, lo usa. El
  selector USB sólo se abre tras un clic (lo exige el navegador). Envía bytes al endpoint OUT y
  **siempre** cierra el dispositivo.
- **Encoder** (`utils/escpos.ts`, `utils/encode-receipt.ts`): ESC/POS propio, sin librería.
  Charset `ascii` (quita acentos) o `cp850` (los imprime). 58 mm = 32 columnas, 80 mm = 48. El
  TOTAL nunca se recorta. La vista previa térmica (`ThermalPreview.vue`) dibuja exactamente las
  mismas líneas que se envían.
- **Navegador** (`utils/print-html.ts` → `printHtmlDocument`): escribe el documento en un
  **iframe oculto**, espera fuentes e imágenes (tope 3 s) y llama a `print()`. No usa
  `window.open` (el navegador lo bloquea tras varios `await`).
- `composables/useReceiptPrint.ts`:
  - `printSale(sale)` — bloquea borradores y ventas anuladas; elige térmica si está disponible,
    si falla cae al navegador (salvo en automático).
  - `afterSaleCompleted(sale)` — al cobrar: impresión automática térmica (si el perfil lo pide)
    con pulso de cajón en el mismo envío si hubo efectivo; o sólo el pulso. Nunca bloquea la
    venta.
  - `printTest(...)` — impresión de prueba desde Configuración; no registra copia y dice
    "IMPRESIÓN DE PRUEBA · NO ES UN COMPROBANTE".
- **Cajón sin venta** (`composables/useCashDrawer.ts`): busca impresora → registra
  `POST /cash-shift/drawer-events` (quién, por qué, qué caja) → **sólo si se registró**, manda el
  pulso.

### 8.2 Nota de remisión (ADR-0019)

Documento en hoja Carta o A4, no fiscal. Un solo generador para vista previa y papel:

```
saleToRemissionView(sale)  (utils/remission-view.ts; reutiliza saleToReceiptView)
        ▼
renderRemissionHtml(view, company, cfg)  (utils/remission-html.ts → documento HTML completo)
        ├─▶ RemissionSheet.vue: <iframe srcdoc sandbox=""> a escala (vista previa)
        └─▶ printHtmlDocument(html): iframe oculto → diálogo del navegador (o "Guardar como PDF")
```

- Todo texto capturado por personas pasa por `esc()`; la vista previa va en un iframe
  `sandbox=""` (sin scripts).
- Folio derivado del de la venta: `FAC-…` → `NR-…` (`remissionFolio`).
- Importe con letra (`utils/amount-in-words.ts`, en centavos enteros).
- Detalle en [`modulos/IMPRESION.md`](modulos/IMPRESION.md).

## 9. Conectividad y operación sin conexión (ADR-0017)

- Lo que se vigila es **la conexión con el servidor**, no "internet": en una instalación local
  el sistema opera sin internet; en la nube, no.
- `plugins/connectivity.client.ts` consulta `GET /health/ready` (sin `$api`, sin credenciales):
  cada **20 s** si todo va bien y cada **5 s** si falla; timeout de 4 s; un primer fallo se
  confirma a los 1.5 s y se necesitan **2 fallos seguidos** para avisar. **404 cuenta como
  correcto** (un servidor o proxy sin esa ruta no es una caída). 503 = base de datos caída.
- También comprueba al instante con los eventos `online`, `offline`, `visibilitychange` y
  `pharma:network-suspect` (lo emite `$api` ante un error sin respuesta).
- URL: `NUXT_PUBLIC_HEALTH_URL` o, por omisión, `<origen de NUXT_PUBLIC_API_BASE_URL>/health/ready`.
- Estado compartido en `useConnectivity()`: `unknown | ok | server-down | db-down`,
  `canOperate` (falso sólo cuando **se sabe** que no se puede operar), `lastOkAt`.
- `ConnectivityBanner.vue` aparece arriba al centro; el POS deshabilita **Cobrar**.
- **No hay cola offline**: sin servidor no se registran ventas. La interfaz conserva lo que está
  en pantalla y pide anotar la venta a mano.
- **Recursos locales**: las tipografías se sirven con `@fontsource` (importadas en `main.css`,
  subconjunto latino) y la impresión usa fuentes del sistema; no se depende de Google Fonts.

Detalle en [`modulos/ACTUALIZACION_Y_CONECTIVIDAD.md`](modulos/ACTUALIZACION_Y_CONECTIVIDAD.md).

## 10. Estrategia de actualización (ADR-0018)

- `nuxt.config.ts`: `experimental.emitRouteChunkError: 'manual'` (Nuxt **no recarga solo**) y
  `checkOutdatedBuildInterval: 5 min` (consulta si hay build nuevo cada 5 minutos).
- `plugins/app-update.client.ts` traduce los hooks `app:manifest:update` (hay versión nueva) y
  `app:chunkError` (falta un archivo de la versión vieja) a estado en `useAppUpdate()`.
- `AppUpdateBanner.vue` pregunta: **Actualizar ahora** / **Más tarde** (aplaza 30 min). Si el
  motivo es un archivo faltante (`chunk`), el aviso es urgente y no se puede aplazar.
- **Bloqueos** (`useUpdateHold(clave, motivo)`): mientras alguna pantalla declare una operación
  en curso, "Actualizar ahora" queda deshabilitado y se explica por qué. Registrados hoy en:
  POS (venta en curso o comprobante en pantalla), `useSettingsForm` (cambios sin guardar) y
  `pages/purchases/create.vue` (compra a medio capturar).
- Nunca se recarga automáticamente.

## 11. Atajos de teclado

`composables/useKeyboardShortcuts.ts`: F1–F12 y `Escape` se capturan aunque el foco esté en un
campo; las combinaciones se normalizan como `ctrl+alt+meta+tecla`; las teclas simples se ignoran
mientras se escribe (para no interferir con el escáner). Atajos en uso:

| Pantalla | Atajos |
|---|---|
| POS | `F2` cobrar · `F3` buscar · `F4` cliente · `F9` descartar · `Esc` cerrar modal / volver al escáner · `Enter` en el escáner |
| Configuración (todas las secciones con formulario, Ticket y Dispositivos) | `Ctrl+S` / `Cmd+S` guardar |

## 12. Pruebas

- **Vitest** (`vitest.config.ts`): entorno `node`, incluye `app/**/*.spec.ts`. No arranca Nuxt;
  `#app` se sustituye por un doble mínimo (`test/nuxt-app-shim.ts`, sólo `useState`).
- Especificaciones actuales:
  - `app/utils/amount-in-words.spec.ts` — importe con letra.
  - `app/utils/remission-html.spec.ts` — escape HTML, folio NR y documento de la nota.
  - `app/composables/useAppUpdate.spec.ts` — aviso de versión, aplazamiento y bloqueos.
- `pnpm test` en local; CI lo corre entre `typecheck` y `build`.
- Lo que depende del navegador (WebUSB, impresión, iframes) se prueba a mano.

## 13. Variables de entorno

| Variable | Por omisión | Uso |
|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | `http://localhost:3005/api` | Base de `$api`. |
| `NUXT_PUBLIC_HEALTH_URL` | `''` → `<origen del API>/health/ready` | Sonda de conexión. |

## 14. Convenciones

- Código, comentarios y mensajes en español.
- Dinero: el backend envía `Decimal` como cadena; el front convierte con `Number()` para mostrar
  y usa `utils/money.ts` (centavos enteros) donde compara o resta (cobro, crédito).
- Fechas y moneda: `useDate()` y `useCurrency()` (es-MX, MXN).
- Archivos de `pages/` en minúsculas (ver `CONTRIBUTING.md` §6).
