# Configuración

## Qué hace

Reúne las reglas de operación de la farmacia. Casi todo se guarda en el servidor y aplica a
**todas las cajas**; la sección **Dispositivos** se configura **en cada computadora**.

| Sección | Qué se define |
|---|---|
| **Ticket** | Datos de la farmacia (razón social, RFC, domicilio, teléfono, logo, pie) y diseño del ticket (58 u 80 mm, tamaño de letra, acentos, qué datos y en qué orden). |
| **Caja** | Tolerancia del corte, fondo sugerido, límite de efectivo en caja, cierre ciego. |
| **Inventario** | Días para alertas de caducidad (horizonte, advertencia, crítico), si se vende hasta el día impreso, lote obligatorio para todo, existencia mínima sugerida. |
| **Descuentos** | Activar descuentos, tope por puesto, máximo absoluto, motivo obligatorio, autorización de gerente, vender bajo costo. |
| **Impuestos** | Tasa general (16 % u 8 % frontera), IVA para productos nuevos, desglose en el ticket; asignar IVA a toda una categoría. |
| **Nota de remisión** | Activar, tamaño de hoja (Carta/A4), qué incluye (pagos y saldo, firmas, IVA; y bajo cada producto el código, el lote y la caducidad, cada uno por separado), leyenda y condiciones. |
| **Dispositivos** | Nombre de esta caja, impresora térmica USB o del navegador, impresión automática, abrir cajón al cobrar en efectivo, pin del cajón. |
| **Usuarios / Permisos** | Ver [USUARIOS_Y_PERMISOS.md](USUARIOS_Y_PERMISOS.md). |

## Cómo se usa

1. Menú **Configuración** → elige la pestaña.
2. Cambia lo necesario. Lo modificado se marca y aparece una barra para **Guardar** o
   **Descartar** (también **Ctrl+S**).
3. Cada sección muestra quién hizo el último cambio y cuándo, y una **bitácora** con el historial.
4. En Ticket y Nota de remisión hay **vista previa** en vivo, aun sin guardar; en Ticket y
   Dispositivos puedes **imprimir una prueba**.

## Qué protege

- **Nadie pisa los cambios de otro**: si alguien guardó mientras tú editabas, el sistema avisa y
  te deja recargar sin perder lo que escribiste.
- **No se pierden cambios por accidente**: pide confirmación al salir con cambios sin guardar.
- **Reglas coherentes**: no deja guardar valores fuera de rango (por ejemplo, un tope de cajero
  mayor al máximo).
- **Bitácora** de cada cambio con autor y fecha.
- La app no se actualiza mientras haya cambios sin guardar en caja, inventario, descuentos,
  impuestos o nota de remisión.

## Limitaciones

- **Dispositivos** se guarda en el navegador de esa computadora: hay que configurarlo en cada
  caja, y se pierde si se borran los datos del navegador.
- La impresora térmica USB requiere Chrome o Edge.
- Cambios en Caja aplican desde el siguiente corte; en Impuestos, a los productos que se agreguen
  a una venta desde ese momento.

## Consejos de operación

- Configura **Ticket** y **Dispositivos** el día de la instalación y haz una impresión de prueba.
- Antes de activar descuentos, define los topes por puesto.
- Deja la leyenda de la nota de remisión que aclara que **no es factura**, salvo indicación de tu
  contador.
