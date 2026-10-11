# Ventas: historial, devoluciones y anulaciones

## Qué hace

Permite consultar todas las ventas, ver el detalle de cada una, reimprimir su ticket o nota de
remisión, registrar devoluciones y anular ventas.

## Cómo se usa

**Buscar una venta**
1. Menú **Ventas**.
2. Filtra por folio, fechas, estado (completada, parcial, pendiente, devuelta, anulada) o estado
   de pago.
3. Abre la venta para ver productos, pagos, devoluciones e impresiones realizadas.

**Reimprimir**: botón de imprimir ticket o **Nota de remisión**. Saldrán marcados como COPIA.

**Devolución**
1. En el detalle, **Devolver**.
2. Indica cuántas piezas de cada producto regresan (el sistema no deja devolver más de lo vendido
   menos lo ya devuelto).
3. Para cada producto elige si **vuelve al anaquel** o **se da de baja** (por ejemplo, si está
   dañado).
4. Decide si se reembolsa al cliente y confirma. El sistema muestra una estimación del efectivo a
   devolver.

**Anular**
1. En el detalle, **Anular** y confirma. Todo lo vendido regresa al inventario y, si hubo pagos,
   el dinero sale de la caja de quien anula. No se puede deshacer.

## Qué protege

- **No se imprimen comprobantes de ventas anuladas**: evita que alguien reclame dos veces.
- **Devoluciones con tope**: no se devuelve más de lo que se vendió.
- **Cada impresión queda registrada** con su número de copia.
- **Permisos**: sólo quien tiene permiso puede devolver o anular (normalmente gerencia).
- Si el servidor no responde, la pantalla lo dice claramente en lugar de mostrar "no hay ventas".

## Limitaciones

- El efectivo a devolver que se muestra es una estimación; el cálculo final lo hace el servidor.
- Una venta anulada no se puede reactivar.

## Consejos de operación

- Revisa diariamente las ventas "Pendientes" o "Parciales": son ventas a crédito o con saldo.
- Antes de anular, verifica que la caja tenga efectivo suficiente si hubo pagos en efectivo.
- Usa el motivo de cada línea en las devoluciones: ayuda a detectar productos con problemas.
