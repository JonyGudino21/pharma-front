# Módulo: Actualización de la app y conectividad

Dos avisos globales montados en `app.vue`, fuera del layout, para verse en cualquier pantalla:
`SharedConnectivityBanner` (arriba al centro) y `SharedAppUpdateBanner` (abajo a la derecha).

---

## 1. Conectividad con el servidor (ADR-0017)

### Piezas

| Pieza | Función |
|---|---|
| `app/composables/useConnectivity.ts` | Estado compartido (`useState`): `status`, `lastOkAt`, `checking`, `canOperate`, `recheck()`. |
| `app/plugins/connectivity.client.ts` | Vigilante: sondea `/health/ready` y actualiza el estado. |
| `app/components/shared/ConnectivityBanner.vue` | Aviso y botón "Reintentar". |
| `app/plugins/api.ts` | Emite `pharma:network-suspect` cuando una petición no obtiene respuesta. |
| `app/pages/pos/index.vue` | Deshabilita **Cobrar** cuando `canOperate` es falso. |

### Estados

| `status` | Significado | `canOperate` |
|---|---|---|
| `unknown` | Aún no hay sondeo | `true` (no bloquea) |
| `ok` | Servidor y base de datos responden | `true` |
| `server-down` | Sin respuesta (caído, red local, sin internet en la nube) | `false` |
| `db-down` | El servidor responde 503: su base de datos no | `false` |

### Algoritmo del vigilante

| Parámetro | Valor |
|---|---|
| Primer sondeo | 1 s tras arrancar |
| Intervalo con todo bien | 20 s |
| Intervalo fallando | 5 s |
| Confirmación tras el primer fallo | 1.5 s |
| Fallos seguidos para avisar | 2 |
| Timeout por sondeo | 4 s |
| Respuesta 2xx | `ok` |
| Respuesta 404 | `ok` (servidor/proxy sin la ruta: no se bloquea por una sonda que no existe) |
| Respuesta 503 | fallo `db-down` |
| Otra respuesta / excepción | fallo `server-down` |

- Usa `fetch` directo con `cache: 'no-store'`, sin `$api` ni credenciales (no pasa por la
  renovación de sesión ni por los toasts).
- Comprobación inmediata ante `online`, `offline`, `visibilitychange` (pestaña visible) y
  `pharma:network-suspect`. `recheck()` (botón Reintentar) emite ese mismo evento.
- Al recuperarse: toast "Conexión con el servidor restablecida.".
- URL: `NUXT_PUBLIC_HEALTH_URL` o `new URL(apiBaseUrl).origin + '/health/ready'`. Si no se puede
  construir, el vigilante no arranca. El backend expone `/health*` sin el prefijo `/api`.

### Banner

- Título: "Sin conexión con el servidor" o "El servidor no puede acceder a su base de datos".
- Texto: no se pueden registrar ventas ni cobros; **no cerrar la ventana**: lo que está en
  pantalla se conserva y se reintenta solo; "Última conexión correcta: …"; "anota la venta a mano
  y captúrala al volver".

### Fuentes locales

`main.css` importa `@fontsource/ibm-plex-mono` (400/600/700) y `@fontsource/literata` (500/700),
subconjunto latino. Nada depende de Google Fonts; la impresión usa fuentes del sistema.

### Limitaciones

- No hay cola offline: sin servidor no se cobra.
- El estado vive en memoria de la pestaña.

---

## 2. Aviso de versión nueva (ADR-0018)

### Configuración (`nuxt.config.ts`)

```ts
experimental: {
  emitRouteChunkError: 'manual',            // Nuxt avisa, no recarga
  checkOutdatedBuildInterval: 5 * 60 * 1000 // busca build nuevo cada 5 min
}
```

### Piezas

| Pieza | Función |
|---|---|
| `app/plugins/app-update.client.ts` | `app:manifest:update` → `markAvailable('manifest')`; `app:chunkError` → `markAvailable('chunk')`. No recarga. |
| `app/composables/useAppUpdate.ts` | `useAppUpdate()` (estado y acciones) y `useUpdateHold(clave, motivo)`. |
| `app/components/shared/AppUpdateBanner.vue` | Aviso con "Actualizar ahora" / "Más tarde". |

### `useAppUpdate()`

| Miembro | Descripción |
|---|---|
| `available`, `reason` (`manifest` \| `chunk`), `snoozedUntil` | Estado (`useState`). |
| `holds` / `blockedBy` | Operaciones en curso (clave → motivo) y el primer motivo. |
| `markAvailable(why)` | `chunk` tiene prioridad sobre `manifest` y anula un aplazamiento. |
| `snooze()` | Aplaza `UPDATE_SNOOZE_MS` = **30 min**. Sin efecto si el motivo es `chunk`. |
| `hold(key, why)` / `release(key)` | Registrar/liberar bloqueo. |
| `apply()` | `window.location.reload()` **sólo** si no hay bloqueos; devuelve `false` si no recargó. |

`useUpdateHold(key, () => motivo | null)` registra el bloqueo mientras la función devuelva texto
y lo libera al cambiar a `null` o al salir de la pantalla.

### Bloqueos registrados

| Clave | Dónde | Motivo |
|---|---|---|
| `pos` | `pages/pos/index.vue` | "Hay un comprobante de venta en pantalla." / "Hay una venta en curso en el punto de venta." |
| `settings:<ns>` | `composables/useSettingsForm.ts` | "Tienes cambios sin guardar en Configuración." |
| `purchase-create` | `pages/purchases/create.vue` | "Tienes una compra a medio capturar." |
| `settings:ticket` | `pages/settings/ticket.vue` | "Tienes cambios sin guardar en la configuración del ticket." |
| `settings:devices` | `pages/settings/devices.vue` | "Tienes cambios sin guardar en los dispositivos de esta caja." |

> Convención: toda pantalla nueva que guarde trabajo en memoria debe registrar su `useUpdateHold`
> (revisarlo en el PR).

### Iconos sin internet

`nuxt.config.ts` → `icon: { serverBundle: 'local', clientBundle: { scan: true } }` con la colección
`@iconify-json/ph` instalada: los ~160 iconos usados viajan dentro del build y no se piden a la API de
Iconify. Un icono nuevo escrito como texto literal (`'ph:…'`) se detecta solo al compilar.

### Banner

- Normal (`manifest`): "Hay una versión nueva de PharmaPOS" — "Actualiza cuando termines…".
  Botones **Actualizar ahora** y **Más tarde**.
- Urgente (`chunk`): "Esta pantalla necesita la versión nueva" — sin "Más tarde".
- Con bloqueo: "Actualizar ahora" deshabilitado y el motivo + "Termina o cancela para poder
  actualizar.".
- Un reloj de 15 s hace reaparecer el aviso al vencer el aplazamiento sin que el usuario navegue.

### Pruebas

`app/composables/useAppUpdate.spec.ts`: arranque sin aviso, bloqueo y liberación, aplazamiento de
30 min, `chunk` no aplazable y con prioridad, y `useUpdateHold` limpiándose al salir.

### Limitaciones

- El aplazamiento vive en memoria: recargar la página por otra vía lo reinicia (y ya carga la
  versión nueva).
- Configuración › Ticket y › Dispositivos tienen su propia detección de cambios y no registran
  bloqueo.
