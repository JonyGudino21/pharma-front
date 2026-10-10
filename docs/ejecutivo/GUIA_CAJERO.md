# Guía rápida del cajero

Todo lo que necesitas para cobrar en el mostrador. Tenla impresa junto a la caja.

---

## 1. Antes de empezar

1. Entra con tu correo y contraseña.
2. Ve a **Caja** y **abre tu turno** con el dinero que hay en el cajón (el sistema puede
   proponerte el fondo de siempre; cámbialo si no coincide). Sin turno abierto no se pueden
   recibir pagos en efectivo.
3. Abre **Punto de Venta**. El cursor queda listo en la barra del escáner.

## 2. Teclas rápidas

| Tecla | Qué hace |
|---|---|
| **F2** | Cobrar |
| **F3** | Buscar un producto por nombre |
| **F4** | Elegir cliente (o volver a "Público General") |
| **F9** | Descartar la venta (pide confirmación) |
| **Esc** | Cerrar la ventana que esté abierta y regresar al escáner |
| **Enter** | Agregar lo que escribiste en la barra del escáner |

Las teclas F no hacen nada mientras haya una ventana abierta o el sistema esté procesando: así no
se descarta una venta por accidente a mitad de un cobro.

## 3. Escanear productos

- Pasa el código por el lector: el producto se agrega solo.
- **Varias piezas iguales**: escribe la cantidad, un asterisco y escanea. Ejemplo: `3*` y luego el
  código agrega 3 piezas. Máximo 999 por escaneo.
- Mientras el sistema procesa, la barra dice "Procesando..." y no acepta lecturas; en cuanto
  termina, vuelve a estar lista sola.
- Si no tiene código o no lo encuentra: **F3**, escribe al menos 2 letras del nombre y elige.
  Los productos sin existencias aparecen deshabilitados.
- En la lista puedes subir o bajar cantidades con **+** y **−**, o quitar el producto.

Mensajes que puedes ver:

| Mensaje | Qué hacer |
|---|---|
| "No se encontró un producto con el código…" | Búscalo por nombre (F3) o avisa al encargado. |
| "…no tiene un precio de venta válido" | No lo vendas; avisa al encargado para corregirlo. |
| "…no tiene lotes vigentes (N uds. caducadas)" | Lo que hay está caducado: no se puede vender. |
| "…no tiene existencias disponibles" | No hay en el sistema. |

## 4. Cliente

- Por omisión la venta es a **Público General**.
- **F4** para elegir un cliente registrado. Si el cliente tiene precios especiales, el sistema
  cambia los precios de la lista automáticamente.

## 5. Descuentos

- Sólo si el dueño los activó. Botón en cada producto o **"Descuento a toda la venta"**.
- Elige el porcentaje y escribe el motivo.
- Si pides más de lo que tu puesto permite, aparece un segundo paso: **un gerente escribe su
  usuario y contraseña en tu caja** para autorizar. No se guarda en tu computadora.
- Una vez que hay un pago registrado, ya no se pueden cambiar los descuentos.

## 6. Cobrar

1. Pulsa **F2** (o el botón **Cobrar**).
2. Si la venta lleva un **medicamento controlado**, primero se piden los datos de la receta:
   folio, nombre del médico, cédula profesional y nombre del paciente. Los cuatro son
   obligatorios.
3. Elige la forma de pago:
   - **Efectivo**: escribe lo que te dieron (o toca un billete sugerido). El sistema calcula el
     **cambio**. No deja cobrar si lo recibido es menor al total.
   - **Tarjeta** o **Transferencia**: se registra el total exacto.
   - **Crédito** (sólo clientes con crédito autorizado): muestra el crédito disponible; puedes
     registrar un abono inicial en efectivo.
4. Pulsa **Cobrar** con el ratón (Enter no confirma el cobro, a propósito).
5. Aparece el **comprobante** con el ticket.

## 7. Ticket o nota de remisión

En el comprobante tienes:

| Botón | Para qué |
|---|---|
| **Imprimir** | Ticket normal de la impresora de la caja. Si tu caja está configurada para imprimir sola, ya habrá salido. |
| **Nota de remisión (hoja carta)** | Documento en hoja completa con datos del cliente y total con letra. Úsala cuando un cliente o empresa pida comprobante de entrega o la venta sea a crédito. **No es factura.** En la ventana de impresión puedes elegir "Guardar como PDF". |
| **Nueva venta** | Cierra el comprobante y deja todo listo para el siguiente cliente. |

- La primera impresión de cada documento dice **ORIGINAL**; las siguientes, **COPIA 2, 3…**. Es
  normal y queda registrado.
- Si la impresora no responde, el sistema te avisa. **La venta ya está cobrada**: no la vuelvas a
  cobrar, sólo reimprime.

## 8. Si cierras la página o se va la luz

No pasa nada con la venta que estabas capturando: al volver a entrar al Punto de Venta verás
"Recuperamos tu venta en curso con N productos". **Revísala antes de cobrar.**

## 9. Aviso rojo "Sin conexión con el servidor"

Aparece arriba cuando el sistema no puede comunicarse con el servidor.

1. **No cierres la ventana** ni recargues. Lo que tienes en pantalla se conserva.
2. El botón **Cobrar** se desactiva: en ese momento no se pueden registrar ventas.
3. **Anota la venta a mano** (productos, cantidades, total, forma de pago) para capturarla
   cuando vuelva la conexión.
4. Revisa que el cable de red / Wi-Fi esté bien y que la computadora del servidor esté encendida.
5. Pulsa **Reintentar** en el aviso. Cuando regrese verás "Conexión con el servidor
   restablecida." y el aviso desaparece.
6. Si dice "El servidor no puede acceder a su base de datos", el problema está en el servidor:
   avisa al encargado o a soporte.

## 10. Aviso "Hay una versión nueva de PharmaPOS"

Aparece abajo a la derecha cuando se publicó una actualización.

- **No interrumpe nada** y la página **nunca se recarga sola**.
- Termina la venta que estás atendiendo y pulsa **Actualizar ahora**. La página se recarga en
  segundos.
- Si estás ocupado, pulsa **Más tarde**: el aviso vuelve en 30 minutos.
- Si hay una venta en curso o el comprobante en pantalla, el botón aparece deshabilitado y te dice
  por qué: termina o cancela primero.
- Si dice **"Esta pantalla necesita la versión nueva"** (aviso naranja, sin "Más tarde"):
  actualiza en cuanto termines la venta actual; algunas pantallas no abrirán hasta hacerlo.

## 11. Aviso "El servidor tuvo un problema…"

Si aparece un aviso de soporte con una **referencia**, cópiala con el botón y envíasela al
encargado o a soporte junto con la hora. Sirve para encontrar exactamente qué pasó.

## 12. Al terminar el turno

1. Ve a **Caja**.
2. Cuenta el dinero físico del cajón y escríbelo en **Total Físico Contado**.
3. Pulsa **Realizar Corte de Caja** y confirma.
4. Según la configuración verás el resultado completo (faltante/sobrante) o sólo lo que contaste
   (cierre ciego: el encargado revisa el arqueo).
5. Cierra sesión desde tu nombre (arriba a la derecha) → **Cerrar Sesión**.
