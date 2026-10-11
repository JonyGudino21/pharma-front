# Lotes y caducidades: cómo funciona y cómo explicarlo

## La idea en una frase

**La caducidad no es del producto, es de cada caja.** Un mismo medicamento (por ejemplo, Paracetamol)
puede tener cajas que caducan en marzo y otras en diciembre. Por eso el sistema guarda la caducidad
junto con el **lote**: el número que el laboratorio imprime en la caja, al lado de la fecha.

## ¿Qué hace el sistema con eso? (FEFO)

FEFO significa *lo primero que caduca, es lo primero que sale*. Cuando vendes, el sistema descuenta
automáticamente del lote que caduca antes. Así:

- casi nunca se te caduca mercancía en el anaquel;
- el sistema te avisa qué lotes están por caducar (Inventario › Caducidades);
- en medicamentos controlados queda registrado qué lote se le vendió a cada paciente (lo pide COFEPRIS).

> Ejemplo real (prueba del 10/10/2026): Amoxicilina con un lote que caduca en 01/2027 y otro en
> 11/2026. Al vender 3 piezas, el sistema las tomó del lote de 11/2026.

## ¿Dónde se captura el lote?

| Situación | Dónde | Qué pide |
|---|---|---|
| Producto nuevo **con** piezas en mano | Catálogo › Productos › Nuevo, campo «Stock inicial» | Al poner piezas aparece «Lote del inventario inicial»: número de lote y caducidad. |
| Producto nuevo **sin** piezas todavía | Catálogo › Productos › Nuevo | No pide caducidad (no hay cajas). Se captura cuando llega la compra. |
| Llega mercancía del proveedor | Compras › la compra › **Recibir** | Lote y caducidad de cada partida. |
| Mercancía que ya tenías **antes** de usar lotes | Inventario › buscar el producto › **Asignar lote** | Número de lote, caducidad y cuántas piezas son de ese lote. |

## Prueba guiada (10 minutos)

1. **Inventario** → busca un producto → **Asignar lote**. Verás *Existencia / Con lote / Sin lote*.
2. Toma una caja física, copia su **número de lote** y su **caducidad**, y escribe cuántas piezas tienes
   de ese lote. Pulsa **Asignar lote**.
3. Si tienes cajas de otro lote, el formulario se queda abierto: repite con el siguiente.
4. Cuando «Sin lote» llegue a 0, ese producto ya está completo.
5. Ve al **Punto de venta**, vende 1 pieza y abre la **Nota de remisión**: bajo el producto verás
   «Lote … · Cad. MM/AAAA», el lote que caduca primero.
6. En **Inventario › Caducidades** verás tus lotes ordenados por fecha, con semáforo.

## Cómo explicárselo al cliente final

- «Cada caja tiene un número de lote y una fecha de caducidad; el sistema las registra.»
- «Cuando vendemos, el sistema saca primero lo que caduca antes, para que nunca se te entregue algo
  viejo habiendo algo más nuevo, y nunca algo caducado.»
- «En la nota de remisión puedes ver de qué lote es lo que te llevas, por si necesitas reportarlo.»

## Importante para empezar a operar

- **Medicamentos controlados**: no se pueden vender si no tienen lote. Asigna el lote de toda su
  existencia antes del primer día de venta.
- Si quieres que **todo** producto exija lote al entrar, activa *Configuración › Inventario › Exigir
  lote en toda entrada*.
