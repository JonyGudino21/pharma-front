# Punto de venta

## Qué hace

Es la pantalla donde se atiende al cliente: se escanean o buscan los productos, se elige el
cliente si aplica, se hacen descuentos permitidos, se cobra y se imprime el comprobante.

## Cómo se usa

1. El cajero abre su turno en **Caja** y entra a **Punto de Venta**.
2. Escanea los productos (o los busca por nombre con **F3**). Para varias piezas iguales escribe
   `3*` antes del código.
3. Si es un cliente registrado, lo elige con **F4**; si tiene precios especiales, se aplican solos.
4. Si corresponde un descuento, lo aplica con su motivo. Si supera lo que su puesto permite, un
   gerente lo autoriza con su usuario y contraseña ahí mismo.
5. **F2** para cobrar: efectivo (con cálculo de cambio), tarjeta, transferencia o crédito del
   cliente. Si hay medicamentos controlados, primero se capturan los datos de la receta.
6. Aparece el comprobante: **Imprimir** ticket, **Nota de remisión** o **Nueva venta**.

La guía detallada para el personal está en [GUIA_CAJERO.md](GUIA_CAJERO.md).

## Qué protege

- **No se pierde la venta**: lo capturado se guarda en el servidor al momento. Si se recarga la
  página, se va la luz o caduca la sesión, al volver aparece la venta recuperada.
- **No se vende lo que no se debe**: bloquea productos sin precio, dados de baja, sin existencias
  o con lotes caducados.
- **No se cobra dos veces**: si la red falla a mitad del cobro y el cajero reintenta, el servidor
  reconoce que es el mismo cobro.
- **Controlados con receta**: no se puede cerrar la venta sin folio, médico, cédula y paciente;
  queda en el libro de controlados.
- **Descuentos con tope por puesto** y con motivo; lo que excede requiere autorización de un
  gerente y queda registrado quién autorizó.
- **Sin servidor no se cobra**: el botón se desactiva y se explica por qué, en lugar de fallar a
  medias.
- **No se actualiza a media venta**: el aviso de versión nueva espera a que se termine.

## Limitaciones

- Sin conexión con el servidor no se pueden registrar ventas (no hay modo fuera de línea): hay que
  anotarlas a mano y capturarlas después.
- El crédito sólo está disponible para clientes con crédito autorizado y saldo suficiente.
- El cobro se confirma con el botón, no con Enter.

## Consejos de operación

- Mantén el lector apuntando a la barra del escáner; si el cursor se pierde, pulsa **Esc**.
- Revisa la venta recuperada antes de cobrarla: puede ser de un cliente anterior.
- Si la impresora falla después de cobrar, **no vuelvas a cobrar**: reimprime desde el
  comprobante o desde **Ventas**.
- Configura el descuento máximo por puesto en **Configuración › Descuentos** antes de activarlos.
