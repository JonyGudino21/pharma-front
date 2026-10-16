# Compras

## Qué hace

Registra las facturas de los proveedores, las partidas con su lote y caducidad, los pagos
realizados y la recepción de la mercancía en el almacén.

## Cómo se usa

1. Compras → **Nueva compra**.
2. Elige el proveedor y escribe el folio de su factura.
3. Busca y agrega productos; ajusta cantidad y costo. En controlados (o en todo, si así se
   configuró) captura **lote y caducidad**.
4. Opcional: registra pagos ya hechos (transferencia, efectivo, tarjeta, crédito).
5. Guarda. Se abre el detalle de la compra.
6. Cuando llegue la mercancía: **Recibir mercancía**. En ese momento entra al inventario, se
   actualiza el costo promedio y queda registrada la deuda con el proveedor.
7. Registra pagos posteriores desde el detalle.

## Qué protege

- La mercancía **no entra al inventario** hasta que se recibe; se puede revisar antes.
- Lote y caducidad se piden **al capturar**, no hasta recibir.
- No se registra un pago mayor a lo que se debe.
- Si se cancela una compra ya recibida, se revierte el inventario y la deuda.
- Si cierras o actualizas la app con una compra a medio capturar, el aviso de versión nueva
  espera a que termines.

## Limitaciones

- Una compra recibida ya no se puede editar; sólo cancelar.
- Revertir un pago en efectivo requiere tener la caja abierta.
- Consultar compras y operarlas son permisos distintos.

## Consejos de operación

- Captura la compra al recibir la factura y pulsa **Recibir** sólo al contar físicamente la
  mercancía.
- Revisa el estado de cuenta de cada proveedor en **Proveedores** antes de pagar.
