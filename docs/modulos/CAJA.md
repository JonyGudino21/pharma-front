# Módulo: Caja (turnos, arqueo y cajón)

Apertura y cierre del turno de efectivo, retiros/ingresos, apertura auditada del cajón y
auditoría de turnos.

## Rutas

| Ruta | Archivo | Permiso |
|---|---|---|
| `/cash-shifts` | `app/pages/cash-shifts/index.vue` | `canOpenShift` |
| `/cash-shifts/history` | `app/pages/cash-shifts/history.vue` | *(sin `requiredPermission`; el enlace sólo se muestra con `canViewAllShifts`)* |
| `/cash-shifts/:id` | `app/pages/cash-shifts/[id].vue` | `canViewAllShifts` |

En el menú, "Caja" aparece con `canOpenShift` **o** `canViewAllShifts`.

## Store: `stores/cashShift.ts`

- `currentShift` + `currentShiftError`: un fallo al consultar el turno **no** se interpreta como
  "no tengo turno" (evita abrir un segundo turno con el servidor lento).
- `drawer` (sólo en el turno actual): `limit`, `overLimit`, `cashOnHand` (sólo para gerencia; al
  cajero llega `null`), `blindClose`.
- `closeShift()` devuelve `{ blind: true, summary: { initial, real } }` con cierre ciego, o el
  resumen completo (`initial`, `salesCash`, `manualIngress`, `withdrawals`, `expected`, `real`,
  `difference`, `status`, `tolerance`).

## Endpoints consumidos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/cash-shift/current-shift` | Turno abierto del usuario (o `null`). |
| POST | `/cash-shift/open` | `{ initialAmount, notes? }`. |
| POST | `/cash-shift/close` | `{ realAmount, notes? }` → resumen (ciego o completo). |
| POST | `/cash-shift/register-operation` | `{ type: MANUAL_WITHDRAW \| EXPENSE \| MANUAL_ADD, amount, reason }`. |
| POST | `/cash-shift/drawer-events` | `{ kind: MANUAL \| TEST, reason, terminal }` antes de abrir el cajón. |
| GET | `/cash-shift?page&limit&status&startDate&endDate` | Historial. |
| GET | `/cash-shift/:id` | Detalle (transacciones y ventas). |
| GET | `/settings/cash` | Fondo sugerido. |

## Pantalla "Mi Turno de Caja" (`/cash-shifts`)

- **Sin turno**: formulario de apertura (fondo inicial y notas). Si `settings.cash.suggestedOpeningFloat > 0`
  y el campo está vacío, se **propone** ese monto.
- **Con turno**:
  - Aviso si el efectivo estimado rebasó el límite (`drawer.overLimit`): con `canWithdrawCash`
    sugiere hacer una sangría; sin él, pedirla a gerencia. El efectivo estimado sólo se muestra si
    el servidor lo envía.
  - Con `canWithdrawCash`: **operaciones de efectivo** (Sangría/Retiro, Gasto, Ingreso manual;
    monto > 0 y motivo obligatorio) y **abrir cajón sin venta** (motivo de al menos 3
    caracteres).
  - **Cierre de turno**: total físico contado (≥ 0) y notas → confirmación → resumen.
    Con cierre ciego (`drawer.blindClose`) y sin `canViewAllShifts`, el texto explica que sólo
    se verá lo contado y el resumen sólo muestra fondo inicial y contado.
    Con resumen completo se marca "Faltante detectado" / "Sobrante detectado".
- **Error al consultar el turno**: tarjeta "No pudimos consultar tu turno" con reintento; no se
  ofrece abrir caja.

## Apertura del cajón sin venta (`composables/useCashDrawer.ts`)

Orden deliberado: 1) buscar la impresora de esta caja (si no hay, no se registra nada);
2) registrar el evento en el servidor con usuario, motivo y nombre de la caja; 3) **sólo si se
registró**, enviar el pulso. Si el servidor no responde, el cajón no se abre.

## Historial y detalle

- `/cash-shifts/history`: tabla paginada con estado (Abierto, Cerrado, Auditoría) y diferencia
  coloreada; enlace al detalle sólo con `canViewAllShifts`.
- `/cash-shifts/:id`: datos del turno, notas, operaciones manuales y ventas.

## Permisos

| Permiso | Efecto |
|---|---|
| `canOpenShift` | Abrir/cerrar su turno. |
| `canWithdrawCash` | Operaciones de efectivo y abrir cajón sin venta. |
| `canViewAllShifts` | Historial con detalle; ve el arqueo completo aunque haya cierre ciego. |

## Estados de error

| Situación | Comportamiento |
|---|---|
| Falla la consulta del turno | Tarjeta de error con reintento. |
| Falla `settings/cash` | La caja abre sin sugerencia de fondo. |
| Falla el registro del evento de cajón | Toast del interceptor; el cajón **no** se abre. |
| No hay impresora emparejada | "No se encontró la impresora de esta caja… Revisa Configuración › Dispositivos." |
| Falla el detalle del turno | La pantalla queda en blanco (no hay estado de error). |

## Decisiones relevantes

- **Cierre ciego** configurable (Configuración › Caja): el cajero no ve el esperado ni la
  diferencia; gerencia revisa.
- **Auditoría primero** en el cajón: una apertura sin rastro es lo que el control impide.
- La configuración de caja aplica desde el siguiente cierre (lo dice el mensaje de guardado).
