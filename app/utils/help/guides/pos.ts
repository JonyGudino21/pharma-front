import type { HelpGuide } from '../types'

export const pos: HelpGuide = {
  id: 'pos',
  title: 'Punto de venta',
  summary: 'Pasa los productos, cobra y entrega el ticket. Todo lo que necesitas en el mostrador.',
  icon: 'ph:shopping-cart-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'Aquí atiendes al cliente: pasas los productos, eliges al cliente si hace falta, cobras e imprimes el comprobante.' },
        {
          type: 'steps',
          items: [
            'Abre tu turno en **Caja**. Sin turno abierto no puedes recibir efectivo.',
            'Entra a **Punto de Venta**. El cursor ya está en el campo «Escanea un código de barras…».',
            'Pasa los productos, pulsa `F2` y cobra.',
          ],
        },
        { type: 'tip', icon: 'ph:cloud-check-bold', text: 'La venta se guarda en el servidor mientras la capturas. Si recargas la página, se va la luz o se cierra tu sesión, al volver verás «Recuperamos tu venta en curso con N productos. Revísala antes de cobrar.» Puede ser de un cliente anterior: revísala.' },
        { type: 'tip', icon: 'ph:lock-simple-bold', text: '¿No ves **Punto de Venta** en el menú? Pide a gerencia el permiso «Vender en el punto de venta».' },
      ],
    },
    {
      id: 'vender',
      title: 'Pasar productos y teclas rápidas',
      icon: 'ph:barcode-bold',
      blocks: [
        {
          type: 'list',
          items: [
            '**Escanea** el código: el producto se agrega solo.',
            '**Varias piezas iguales**: escribe la cantidad y un asterisco, por ejemplo `3*`, y luego escanea. Máximo 999 por vez.',
            '**Sin código**: pulsa `F3` o **Buscar**, escribe al menos 2 letras del nombre o del SKU y elige. Los que dicen «Sin stock» no se pueden elegir.',
            '**Cambiar cantidad**: usa los botones **+** y **−** de cada renglón. El bote de basura quita el producto.',
          ],
        },
        { type: 'p', text: 'Teclas rápidas:' },
        {
          type: 'list',
          items: [
            '`F2` Cobrar.',
            '`F3` Buscar un producto por nombre o SKU.',
            '`F4` Elegir cliente.',
            '`F9` Descartar la venta (pide confirmación).',
            '`Esc` Cerrar la ventana abierta y volver al escáner.',
            '`Enter` Agregar lo que escribiste en el campo del escáner.',
          ],
        },
        { type: 'tip', icon: 'ph:keyboard-bold', text: 'Las teclas F no hacen nada si hay una ventana abierta o el campo dice «Procesando...». Así no se descarta una venta por accidente.' },
        { type: 'warn', text: '**Descartar venta** borra toda la venta en curso y no se puede deshacer.' },
      ],
    },
    {
      id: 'cliente',
      title: 'Elegir cliente',
      icon: 'ph:user-bold',
      blocks: [
        { type: 'p', text: 'Si no eliges a nadie, la venta es a **Público General**.' },
        {
          type: 'steps',
          items: [
            'Pulsa `F4` o toca el recuadro del cliente (a la derecha).',
            'Busca por nombre, teléfono o email y elige. Para quitarlo, elige «Público General».',
          ],
        },
        {
          type: 'list',
          items: [
            'Si el cliente tiene precios especiales, los productos cambian solos a su precio (etiqueta **Precio cliente**) y verás «Precios de … aplicados». Si vuelves a **Público General**, regresan al precio de lista.',
            'En la lista, la etiqueta **Crédito** indica que puede comprar a crédito, y «Debe $…» lo que ya debe.',
            'Puedes cambiar de cliente en cualquier momento antes de cobrar.',
          ],
        },
      ],
    },
    {
      id: 'descuentos',
      title: 'Descuentos y autorización',
      icon: 'ph:percent-bold',
      blocks: [
        { type: 'p', text: 'Sólo aparecen si gerencia los activó en **Configuración › Descuentos**. Usa el botón **%** de un producto o **Descuento a toda la venta**.' },
        {
          type: 'steps',
          items: [
            'Elige 5, 10, 15 o 20 %, o escribe el porcentaje. Debajo ves «Tu tope» y en cuánto queda.',
            'Escribe el **Motivo** (por ejemplo, «cliente frecuente»).',
            'Pulsa **Aplicar**.',
            'Si pides más que tu tope, el botón dice **Continuar**: un gerente escribe en tu caja su «Usuario o correo del gerente» y su «Contraseña», y pulsa **Autorizar y aplicar**. Sus datos no se guardan.',
          ],
        },
        { type: 'tip', icon: 'ph:arrow-counter-clockwise-bold', text: 'Para quitar un descuento, abre el mismo botón y pulsa **Quitar descuento**.' },
        { type: 'warn', text: 'Cada descuento queda registrado con su motivo y con quién lo autorizó. En cuanto hay un pago registrado, los descuentos ya no se pueden cambiar.' },
      ],
    },
    {
      id: 'precios',
      title: 'Cambiar el precio y precios por cliente',
      icon: 'ph:tag-bold',
      blocks: [
        { type: 'p', text: 'Puedes cambiar el precio de un producto en la venta: por ejemplo, a la farmacia A le das el paracetamol a $10 y a la farmacia B a $12. Quién puede hacerlo lo decide gerencia en **Configuración › Precios en caja**.' },
        {
          type: 'steps',
          items: [
            'Si es para un cliente, **elígelo primero** (`F4`).',
            'En el producto, toca su precio subrayado (por ejemplo **$45.50 c/u ✎**).',
            'Escribe el **Precio nuevo por pieza** (con IVA). Abajo ves si deja ganancia.',
            'Con cliente, deja marcada **Guardar como precio especial de …** para que la próxima vez se le cobre ese precio solo. Desmárcala si es sólo por esta vez.',
            'Escribe el motivo si te lo piden y pulsa **Cambiar precio**.',
          ],
        },
        {
          type: 'list',
          items: [
            '**Precio cliente**: es el precio especial guardado de ese cliente.',
            '**Precio editado**: lo cambiaste sólo para esta venta.',
            'El triángulo de aviso junto al precio significa que **no deja ganancia** (igual al costo) o que está **debajo del costo**. Pasa el cursor encima para ver el detalle.',
          ],
        },
        { type: 'warn', text: 'Un precio debajo del costo no se acepta, salvo que gerencia lo permita. Igual al costo sí se acepta, pero con el aviso de «sin ganancia». En cuanto hay un pago registrado, el precio ya no se puede cambiar.' },
        { type: 'tip', icon: 'ph:arrow-counter-clockwise-bold', text: 'Si guardas para el cliente un precio igual al de lista, se le quita el precio especial: vuelve a pagar la lista y sigue sus cambios.' },
      ],
    },
    {
      id: 'cobrar',
      title: 'Cobrar',
      icon: 'ph:money-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Pulsa `F2` o **Cobrar (F2)**. Si hay un medicamento controlado, primero se piden los datos de la receta.',
            'Elige **Efectivo**, **Tarjeta** o **Transferencia**.',
            'En efectivo, escribe lo que te dieron en «Efectivo recibido» o toca un billete sugerido. Abajo ves el **Cambio**.',
            'Pulsa **Cobrar**. Aparece el comprobante.',
          ],
        },
        { type: 'tip', icon: 'ph:keyboard-bold', text: 'En «Efectivo recibido», `Enter` también cobra si lo recibido alcanza. No deja cobrar si te dieron menos del total.' },
        { type: 'warn', text: 'Con **Tarjeta** o **Transferencia** se registra el total exacto. Pulsa **Cobrar** sólo cuando la terminal o el banco ya confirmaron el pago.' },
        { type: 'p', text: '**A crédito** (sólo clientes con crédito autorizado): pulsa **Cargar a crédito**. Verás el crédito «Disponible». Si deja algo a cuenta, escríbelo en «Abono inicial (opcional)»: se registra como efectivo. A crédito sólo se carga lo que queda después del abono: la línea «Se carga a crédito» te dice cuánto, y si el disponible no alcanza te indica el abono mínimo.' },
        { type: 'tip', icon: 'ph:shield-check-bold', text: 'Si se cae la red a mitad del cobro y vuelves a pulsar **Cobrar**, el sistema reconoce que es el mismo pago: no se cobra dos veces.' },
      ],
    },
    {
      id: 'controlados',
      title: 'Medicamentos controlados',
      icon: 'ph:prescription-bold',
      blocks: [
        { type: 'p', text: 'En la lista llevan la etiqueta **Controlado**. Al cobrar aparece «Medicamento controlado» y pide cuatro datos de la receta: **Folio de receta**, **Médico**, **Cédula profesional** y **Paciente**. Luego pulsa **Continuar a cobro**.' },
        { type: 'warn', text: 'Estos datos van al **Libro de controlados**, el registro que pide COFEPRIS. Cópialos tal cual vienen en la receta. Revísalos antes de continuar: si cancelas el cobro y vuelves a pulsar `F2`, ya no se piden de nuevo para esta venta.' },
        { type: 'p', text: 'Un controlado **sin lote** no se puede vender. Gerencia debe asignarle lote y caducidad en **Inventario › Control**: busca el producto y pulsa **Asignar lote**.' },
      ],
    },
    {
      id: 'comprobante',
      title: 'Ticket, nota de remisión y PDF',
      icon: 'ph:receipt-bold',
      blocks: [
        { type: 'p', text: 'Al cobrar aparece «Venta cobrada» con su folio y el ticket en pantalla.' },
        {
          type: 'list',
          items: [
            '**Imprimir**: el ticket en la impresora de la caja. Si tu caja imprime sola al cobrar (**Configuración › Dispositivos**), ya habrá salido.',
            '**Nota de remisión (hoja carta)**: documento en hoja completa con datos del cliente y total con letra, para entregas o ventas a crédito. No es una factura. Pulsa **Imprimir o guardar PDF**; para el PDF, elige «Guardar como PDF» como impresora. Si no ves el botón, falta el permiso «Imprimir tickets y notas de remisión» o la nota está apagada en **Configuración › Nota de remisión**.',
            '**Nueva venta**: cierra el comprobante y deja todo listo para el siguiente cliente.',
          ],
        },
        { type: 'tip', icon: 'ph:copy-bold', text: 'La primera impresión dice **ORIGINAL** y las siguientes **COPIA 2**, **COPIA 3**… Es normal y queda registrado.' },
        { type: 'warn', text: 'Si la impresora falla, **la venta ya está cobrada**. No la vuelvas a cobrar: reimprime con **Imprimir** o desde **Ventas**.' },
      ],
    },
    {
      id: 'problemas',
      title: 'Si algo no funciona',
      icon: 'ph:lifebuoy-bold',
      blocks: [
        {
          type: 'faq',
          items: [
            { q: '«No se encontró un producto con el código …»', a: 'Búscalo por nombre con `F3`. Si tampoco aparece, avisa al encargado para que lo dé de alta o le ponga el código.' },
            { q: '«… no tiene un precio de venta válido» o «… está dado de baja y no puede venderse.»', a: 'No lo vendas. Avisa al encargado para que lo corrija en **Catálogo › Productos**.' },
            { q: '«… no tiene lotes vigentes (N uds. caducadas).»', a: 'Todo lo que hay de ese producto está caducado. No se puede vender.' },
            { q: '«… no tiene existencias disponibles.», pero en el anaquel sí hay.', a: 'Si es un controlado, seguramente no tiene lote: pide a gerencia **Inventario › Control › Asignar lote**. Si no es controlado, hay que revisar el inventario.' },
            { q: '«La cantidad debe estar entre 1 y 999.»', a: 'El número antes del asterisco es muy grande o es cero. Escribe, por ejemplo, `3*` y vuelve a escanear.' },
            { q: '«¡ALERTA! No tienes caja abierta. Abre turno para recibir efectivo.»', a: 'Ve a **Caja**, abre tu turno y vuelve a cobrar. La venta sigue ahí.' },
            { q: 'Aviso rojo «Sin conexión con el servidor» (o «El servidor no puede acceder a su base de datos»).', a: 'El botón **Cobrar** se desactiva. **No cierres la ventana**: lo que tienes se conserva. Anota la venta a mano, revisa el cable o el Wi-Fi y pulsa **Reintentar**. Cuando regrese verás «Conexión con el servidor restablecida.»' },
            { q: 'Aviso «Hay una versión nueva de PharmaPOS».', a: 'Termina la venta y pulsa **Actualizar ahora**; la página se recarga. **Más tarde** lo pospone 30 minutos. Con una venta en curso el aviso se reduce, sin botón de actualizar, y explica: «Hay una venta en curso en el punto de venta. Termina o cancela para poder actualizar.» Si dice «Esta pantalla necesita la versión nueva», actualiza en cuanto termines.' },
            { q: 'Al cobrar dice «El pago de esta venta ya está registrado (…). Sólo falta cerrarla: no se volverá a cobrar.»', a: 'Un intento anterior sí cobró, pero no terminó de cerrar. Pulsa **Cerrar venta**. No pidas el dinero otra vez.' },
            { q: 'En el resumen aparece «Pagado de más» y no deja cobrar.', a: 'Ya se registró más dinero que el total (por ejemplo, quitaste productos después de un pago). Agrega lo que falta o descarta la venta y devuelve la diferencia. Avisa al encargado.' },
            { q: '«Límite de crédito excedido. Disponible: …»', a: 'El cliente no tiene crédito suficiente. Cobra una parte en efectivo o pide a gerencia que revise su límite en **Clientes**.' },
            { q: '«Recuperamos la venta, pero no pudimos cargar los datos del cliente…»', a: 'Vuelve a elegir al cliente con `F4` antes de cobrar a crédito.' },
            { q: '«Venta completada, pero no pudimos cargar su ticket. Reimprímelo desde el historial de ventas.»', a: 'La venta sí quedó cobrada. Reimprime el ticket desde **Ventas**.' },
            { q: '«No se encontró la impresora de esta caja…» o «La impresora no respondió…»', a: 'La venta ya está cobrada. Revisa la impresora y pulsa **Imprimir**. Para configurarla, mira la guía de **Configuración › Dispositivos**.' },
          ],
        },
      ],
    },
  ],
}
