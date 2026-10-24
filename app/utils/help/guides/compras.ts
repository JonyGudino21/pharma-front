import type { HelpGuide } from '../types'

export const compras: HelpGuide = {
  id: 'compras',
  title: 'Compras a proveedores',
  summary: 'Registra la factura del proveedor, lo que pagaste y mete la mercancía al inventario cuando llega.',
  icon: 'ph:truck-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'En **Compras** capturas cada factura o ticket de un proveedor: qué productos llegaron, a qué costo, con qué lote y caducidad, y cuánto le has pagado.' },
        {
          type: 'list',
          items: [
            'Primero se guarda como **borrador**: la mercancía todavía **no** entra al inventario.',
            'Cuando cuentas la mercancía, pulsas **Ingresar a Almacén (Recibir)** y entonces sí se suma al inventario.',
            'Los pagos (abonos) al proveedor se registran en la misma compra.',
          ],
        },
        { type: 'tip', icon: 'ph:lock-key-bold', text: 'Para ver compras necesitas un permiso, y para crearlas o recibirlas otro. Si no ves el menú **Compras** o el botón **Nueva Orden**, pide a gerencia el permiso.' },
      ],
    },
    {
      id: 'crear-compra',
      title: 'Capturar una compra nueva',
      icon: 'ph:plus-circle-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Entra a **Compras** y pulsa **Nueva Orden**.',
            'En **Proveedor** elige a quién le compraste. Si no aparece, primero dalo de alta en **Proveedores**.',
            'En **Fecha límite de pago** (opcional) queda propuesta la fecha con los días de crédito del proveedor. Cámbiala, toca 15 / 30 / 45 días o pulsa **Sin fecha**. En el detalle de la compra la puedes cambiar con **Cambiar**.',
            'En **Folio de Factura / Ticket** escribe el folio que trae su factura o ticket. Si el proveedor no te dio folio, toca el **folio sugerido** que aparece debajo (por ejemplo, «FAC-001-ALV-20261023») o deja el campo vacío: se guarda con ese mismo.',
            'En **Agregar producto** escanea el código de barras o escribe el nombre o el SKU. Con el lector, el producto se agrega solo; si escribes, elige de la lista. Arriba a la derecha puedes buscar sólo por **Nombre** o sólo por **Código**.',
            'En cada renglón ajusta **Cant.** y **Costo Unit.** (el costo que te cobró el proveedor). Captura **Lote** y **Caducidad** si los tienes.',
            'Si ya pagaste algo, agrégalo en **Pagos (Abonos)** (ve la sección de pagos). Si no, déjalo vacío: queda como «Compra a crédito (Sin pago inicial)».',
            'Revisa el **Resumen Financiero** y pulsa **Guardar Borrador**. Se abre el detalle de la compra.',
          ],
        },
        { type: 'tip', icon: 'ph:floppy-disk-back-bold', text: 'El botón **Guardar Borrador** se queda gris mientras falte algo: proveedor, al menos un producto, cantidades mayores a cero, el lote y caducidad que sean obligatorios, o un pago con monto en cero.' },
        { type: 'tip', icon: 'ph:trash-bold', text: 'Para quitar un renglón pulsa el bote de basura a la derecha.' },
      ],
    },
    {
      id: 'folio',
      title: 'El folio sugerido',
      icon: 'ph:receipt-bold',
      blocks: [
        { type: 'p', text: 'No todos los proveedores entregan factura o ticket con folio. Para que toda compra se pueda buscar y no se capture dos veces, el sistema propone uno:' },
        {
          type: 'list',
          items: [
            '**FAC**: prefijo fijo.',
            '**001**: el número de compra de ese proveedor en el día (002, 003…).',
            '**ALV**: clave del proveedor, las tres primeras letras de su nombre sin palabras como «Distribuidora» o «Laboratorios» («Distribuidora Alvex» → ALV).',
            '**20261023**: la fecha (año, mes, día).',
          ],
        },
        { type: 'warn', text: 'Si el proveedor sí te dio folio, escribe el suyo: es el que vas a buscar cuando te cobre. El sistema no deja guardar dos compras del mismo proveedor con el mismo folio (las canceladas no cuentan).' },
      ],
    },
    {
      id: 'producto-nuevo',
      title: 'Compraste un producto que no está en el catálogo',
      icon: 'ph:package-bold',
      blocks: [
        { type: 'p', text: 'No hace falta salir de la compra. Cuando la búsqueda dice «No encontramos …»:' },
        {
          type: 'steps',
          items: [
            'Pulsa **Dar de alta este producto**. Se abre el alta con lo que escribiste: el **nombre**, o el **código de barras** si lo escaneaste.',
            'Llena lo que falta: **costo**, **precio de venta** (con IVA), IVA, si es **controlado** y sus categorías.',
            'Pulsa **Guardar Producto**. Se crea en el catálogo con su SKU y se agrega a la compra.',
            'En la compra ajusta la cantidad, el costo y el lote.',
          ],
        },
        { type: 'tip', icon: 'ph:truck-bold', text: 'Aquí no se pide «Stock inicial»: las piezas entran al inventario cuando **recibes** la compra, con su lote y caducidad.' },
        { type: 'tip', icon: 'ph:plus-bold', text: 'Aunque la búsqueda sí encuentre algo, al final de la lista está **¿Es un producto nuevo? Darlo de alta**.' },
      ],
    },
    {
      id: 'lotes',
      title: 'Lote y caducidad',
      icon: 'ph:calendar-check-bold',
      blocks: [
        { type: 'p', text: 'El **lote** y la **caducidad** vienen impresos en la caja del medicamento. Capturarlos aquí es lo que después te permite ver qué está por caducar en **Inventario › Caducidades**.' },
        {
          type: 'list',
          items: [
            'Los productos **controlados** (aparecen con la marca «Controlado») siempre piden lote y caducidad.',
            'Si en **Configuración › Inventario** se activó exigir lote en toda entrada, todos los productos los piden.',
            'Captura **los dos juntos** (lote y caducidad) o ninguno: el sistema no acepta uno sin el otro.',
            'Si el mismo producto llega con dos lotes distintos, agrégalo dos veces y captura cada lote en su renglón.',
          ],
        },
        { type: 'warn', text: 'Un controlado sin lote ni caducidad no se puede recibir. Captúralos con cuidado: quedan en el **Libro de controlados**.' },
      ],
    },
    {
      id: 'partidas',
      title: 'Corregir productos antes de recibir',
      icon: 'ph:list-dashes-bold',
      blocks: [
        { type: 'p', text: 'Mientras la compra no se haya recibido, en el detalle puedes corregir la sección **Partidas** (los renglones de productos):' },
        {
          type: 'list',
          items: [
            '**+ Agregar**: busca otro producto, escribe cantidad, costo, lote y caducidad, y pulsa **Agregar**.',
            'Lápiz: abre **Editar Partida** para cambiar cantidad, costo, lote o caducidad. Pulsa **Actualizar**.',
            'Bote de basura: quita el producto de la orden.',
          ],
        },
        { type: 'tip', icon: 'ph:lock-bold', text: 'Una vez recibida, la compra ya no se puede editar; sólo cancelar. El proveedor y el folio no se pueden cambiar desde la pantalla.' },
      ],
    },
    {
      id: 'pagos',
      title: 'Pagar al proveedor',
      icon: 'ph:wallet-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Abre la compra desde **Compras** (flecha a la derecha del renglón).',
            'En **Historial de Pagos** pulsa **+ Abonar**. Sólo aparece si todavía se debe algo.',
            'Elige el **Método de Pago**: efectivo, transferencia o tarjeta.',
            'En **Monto a Pagar** ya viene lo que se debe; cámbialo si vas a pagar sólo una parte.',
            'Si tienes un folio o número de transferencia, escríbelo en **Referencia / Folio**. Pulsa **Registrar Abono**.',
          ],
        },
        { type: 'warn', text: 'Pagar en **efectivo** saca el dinero de tu caja: necesitas un turno de caja abierto y quedará registrado como salida en el turno.' },
        { type: 'tip', icon: 'ph:arrow-counter-clockwise-bold', text: '¿Te equivocaste? Pulsa el bote de basura junto al pago para **Revertir Pago**. Si fue en efectivo, ten la caja abierta: el dinero regresa a ella.' },
      ],
    },
    {
      id: 'recibir',
      title: 'Recibir la mercancía',
      icon: 'ph:package-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Cuando llegue el pedido, cuenta las piezas y compáralas con la compra. Corrige cantidades o lotes si hace falta.',
            'Pulsa **Ingresar a Almacén (Recibir)**.',
            'Lee el aviso y confirma con **Sí, Ingresar a Almacén**.',
          ],
        },
        { type: 'p', text: 'Al recibir: las piezas entran al inventario, se recalcula el costo promedio de cada producto y la deuda queda sumada al saldo del proveedor.' },
        { type: 'warn', text: 'Recibir **no se puede deshacer**; sólo se puede cancelar la compra completa. Pulsa el botón sólo con la mercancía contada en la mano.' },
      ],
    },
    {
      id: 'cancelar',
      title: 'Cancelar una compra',
      icon: 'ph:prohibit-bold',
      blocks: [
        { type: 'p', text: 'En el detalle, pulsa **Cancelar Compra** y confirma con **Sí, Cancelar Compra**.' },
        {
          type: 'list',
          items: [
            'Si la mercancía ya se había recibido, **se saca del inventario** y se quita la deuda con el proveedor.',
            'Lo que ya le habías pagado queda como **saldo a favor** con ese proveedor (en **Proveedores** su deuda puede verse en negativo).',
            'La compra queda como «Cancelado» y ya no se puede tocar.',
          ],
        },
        { type: 'warn', text: 'Cancelar una compra recibida mueve inventario. Si parte de esas piezas ya se vendió, el inventario puede quedar descuadrado: avisa a gerencia antes.' },
      ],
    },
    {
      id: 'estados',
      title: 'Qué significa cada estado',
      icon: 'ph:tag-bold',
      blocks: [
        { type: 'p', text: 'En la lista de **Compras** cada orden muestra dos etiquetas. Puedes filtrar por **Proveedor** y por **Estado de Pago**.' },
        {
          type: 'list',
          items: [
            '**Estado de Pago**: «Pendiente» (no se ha pagado nada), «Pago Parcial» (se pagó una parte), «Pagado» (no se debe nada) o «Cancelado».',
            '**Recepción (Stock)**: «Por Recibir» (aún no entra al inventario), «En Almacén» (ya se recibió) o «Anulado» (se canceló).',
            'La columna **Importes** muestra el total y la «Deuda» que falta pagar, o «Sin deuda».',
          ],
        },
        { type: 'tip', icon: 'ph:translate-bold', text: 'En el detalle de una compra las etiquetas cambian de nombre: PENDING = Pendiente, PARTIAL = Pago Parcial, PAID = Pagado, CANCELLED = Cancelado; «EN TRÁNSITO» = Por Recibir y «REGISTRADO» = En Almacén.' },
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
            { q: '«Se requiere caja abierta para pagar en efectivo al proveedor.»', a: 'Abre tu turno en **Caja** y vuelve a registrar el pago, o elige transferencia si no salió de la caja.' },
            { q: '«El monto es inválido o supera la deuda.»', a: 'El abono no puede ser cero ni mayor que el **Saldo Pendiente**. Revisa el monto.' },
            { q: '«El medicamento controlado … requiere lote y caducidad.»', a: 'Edita el renglón con el lápiz y captura el lote y la caducidad que vienen en la caja.' },
            { q: '«… no tiene lote ni caducidad. La configuración de inventario los exige en toda entrada…»', a: 'Antes de recibir, edita cada renglón marcado y captura su lote y caducidad.' },
            { q: '«El número de lote y la fecha de caducidad deben ir juntos.»', a: 'Escribiste uno sin el otro. Captura los dos o deja ambos vacíos (si el producto no los exige).' },
            { q: '«No tienes caja abierta para registrar la devolución de este efectivo.»', a: 'Para revertir un pago en efectivo, primero abre tu turno en **Caja**.' },
            { q: '«No puedes modificar productos de una compra ya ingresada al almacén.»', a: 'Ya se recibió. Si está mal, cancela la compra y captúrala de nuevo.' },
            { q: 'No encuentro a mi proveedor en la lista, o dice «La lista está recortada…».', a: 'Revisa en **Proveedores** que esté dado de alta y activo. Si hay demasiados proveedores, avisa a soporte.' },
            { q: '«El folio … ya está registrado en la compra #… de …»', a: 'Esa factura ya se capturó. Abre la compra indicada en lugar de registrarla otra vez. Si de verdad es otra, revisa el folio o usa el sugerido.' },
            { q: 'Escaneo un producto y no aparece.', a: 'Ese código no está en ningún producto. Si es un producto nuevo, pulsa **Dar de alta este producto**. Si ya existe, edítalo en **Catálogo** y agrégale su código de barras para que el lector lo encuentre la próxima vez.' },
            { q: '«No se encontraron órdenes de compra.»', a: 'Revisa los filtros de **Proveedor** y **Estado de Pago**: elige «Todos».' },
          ],
        },
      ],
    },
  ],
}
