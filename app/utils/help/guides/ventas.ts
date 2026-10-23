import type { HelpGuide } from '../types'

export const ventas: HelpGuide = {
  id: 'ventas',
  title: 'Ventas: historial, devoluciones y anulaciones',
  summary: 'Busca cualquier venta, reimprime su ticket o nota de remisión, registra devoluciones y anula ventas.',
  icon: 'ph:receipt-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'En el menú **Ventas** está el **Historial de Ventas**: todos los tickets cobrados, con su cliente, quién vendió, el importe y su estado.' },
        {
          type: 'list',
          items: [
            'Ver el detalle de una venta: productos, pagos, devoluciones y copias impresas.',
            'Reimprimir el ticket o sacar la **nota de remisión** (también en PDF).',
            'Registrar una **devolución** de uno o varios productos.',
            '**Anular** una venta completa.',
          ],
        },
        { type: 'tip', icon: 'ph:shield-check-bold', text: 'Si no ves **Ventas** en el menú, o no aparecen los botones **Devolver** o **Anular venta**, pide a gerencia el permiso.' },
      ],
    },
    {
      id: 'buscar',
      title: 'Buscar y filtrar ventas',
      icon: 'ph:magnifying-glass-bold',
      blocks: [
        {
          type: 'list',
          items: [
            '**Folio**: escribe el número del ticket y pulsa `Enter` o **Aplicar**.',
            '**Desde** y **Hasta**: elige las fechas; la lista se actualiza sola.',
            '**Estado de la venta**: Completada, Pago parcial, Pendiente, Devuelta por completo o Anulada.',
            '**Etapa**: por defecto se ven las **Cerradas (sin borradores)**. Elige **Borrador en mostrador** para ver ventas que se quedaron a medias en el Punto de Venta.',
            '**Cobro**: Pagada, Parcial o Sin pagar.',
          ],
        },
        { type: 'p', text: 'Pulsa **Limpiar** para quitar todos los filtros. Haz clic en cualquier fila para abrir el detalle.' },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'En la columna **Importes**, «Debe» en rojo indica que la venta tiene saldo pendiente; «Liquidada» indica que ya está pagada.' },
      ],
    },
    {
      id: 'estados',
      title: 'Qué significa cada estado',
      icon: 'ph:tag-bold',
      blocks: [
        {
          type: 'list',
          items: [
            '**Completada**: cobrada por completo.',
            '**Parcial**: se pagó una parte; queda saldo (ventas a crédito o con abono).',
            '**Pendiente**: no se ha pagado nada todavía.',
            '**Devuelta**: se devolvió toda la mercancía.',
            '**Anulada**: la venta se canceló completa.',
          ],
        },
        { type: 'p', text: 'Debajo del estado puede aparecer «1 devolución» (o más) si hubo devoluciones parciales, y «En mostrador» si es un borrador que no se cobró.' },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'Revisa cada día las ventas **Pendientes** y **Parciales**: son las que todavía deben dinero.' },
      ],
    },
    {
      id: 'reimprimir',
      title: 'Reimprimir ticket y copias',
      icon: 'ph:printer-bold',
      blocks: [
        { type: 'p', text: 'En el detalle de la venta pulsa **Imprimir ticket**. Sale por la impresora térmica de esta caja; si no hay, se abre el diálogo de imprimir del navegador.' },
        { type: 'p', text: 'La primera impresión dice **ORIGINAL**; las siguientes dicen **COPIA 2**, **COPIA 3**, etc. Así nadie puede presentar dos «originales» del mismo ticket.' },
        { type: 'p', text: 'En **Copias impresas** ves cada impresión: si fue ticket o nota de remisión, el número de copia, la fecha, quién la imprimió y si salió por **Térmica USB** o **Navegador**.' },
        { type: 'tip', icon: 'ph:info-bold', text: 'Si la impresión falla, esa copia ya quedó contada: la siguiente saldrá como copia. Es normal.' },
      ],
    },
    {
      id: 'remision',
      title: 'Nota de remisión y PDF',
      icon: 'ph:file-text-bold',
      blocks: [
        { type: 'p', text: 'La nota de remisión es una hoja tamaño carta (o A4) con los datos de la farmacia, del cliente y los productos. Sirve para clientes que piden un comprobante más formal que el ticket.' },
        {
          type: 'steps',
          items: [
            'En el detalle de la venta pulsa **Nota de remisión**. Aparece la vista previa: así saldrá la hoja.',
            'Arriba se indica si se imprimirá como **ORIGINAL** o como **COPIA**.',
            'Pulsa **Imprimir o guardar PDF**. Se abre el diálogo de imprimir del navegador.',
            'Para imprimir en papel, elige tu impresora. Para tener un archivo, en «Destino» o «Impresora» elige **Guardar como PDF** y pulsa **Guardar**.',
          ],
        },
        { type: 'tip', icon: 'ph:paper-plane-tilt-bold', text: '¿El cliente la quiere por WhatsApp o correo? Guárdala como PDF y envía ese archivo desde tu WhatsApp o correo, como cualquier otro adjunto. El sistema no la envía por ti.' },
        { type: 'p', text: 'Gerencia puede cambiar el papel y lo que aparece en la nota, o desactivarla, en **Configuración › Nota de remisión**. Si está desactivada, el botón no aparece.' },
      ],
    },
    {
      id: 'devolver',
      title: 'Registrar una devolución',
      icon: 'ph:arrow-u-up-left-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Abre la venta y pulsa **Devolver**.',
            'En cada producto que regresa, escribe en **Devolver** cuántas piezas. No te deja pasar de las **Disponibles** (lo vendido menos lo ya devuelto).',
            'Elige el **Estado de la mercancía**: **Buen estado** (vuelve al anaquel) o **Dañada o caducada** (se registra como merma). Es obligatorio.',
            'Si quieres, escribe el motivo (caducidad, empaque roto, error de cobro…).',
            'Deja marcado **Reintegrar el importe al cliente** si le vas a regresar dinero. Sin marcar, la mercancía regresa pero no se mueve dinero.',
            'Revisa el **Total a devolver** y pulsa **Confirmar devolución**.',
          ],
        },
        { type: 'warn', text: 'Al reintegrar, primero se descuenta lo que el cliente aún debía de esa venta; el resto **sale en efectivo de tu caja**. Para eso necesitas tu turno de caja abierto.' },
        { type: 'warn', text: 'Elige bien el estado de la mercancía: «Buen estado» la vuelve a poner a la venta. Un medicamento dañado o caducado nunca debe regresar al anaquel.' },
      ],
    },
    {
      id: 'anular',
      title: 'Anular una venta',
      icon: 'ph:prohibit-bold',
      blocks: [
        { type: 'p', text: 'Anular cancela la venta completa. Úsalo para errores (venta duplicada, se cobró a quien no era). Si el cliente sólo regresa algunos productos, usa **Devolver**.' },
        {
          type: 'steps',
          items: [
            'Abre la venta y pulsa **Anular venta**.',
            'Lee el aviso: dice cuánto dinero saldrá de tu caja.',
            'Pulsa **Sí, anular** para confirmar.',
          ],
        },
        { type: 'warn', text: 'Todo lo vendido regresa al inventario y, si hubo pagos, el dinero **sale de la caja de quien anula**. **No se puede deshacer.** Antes de anular, verifica que haya efectivo suficiente en la caja.' },
        { type: 'p', text: 'Una venta anulada ya no se puede imprimir ni devolver: así nadie puede usar su ticket para reclamar otra vez.' },
      ],
    },
    {
      id: 'volver-a-vender',
      title: 'Volver a vender una venta anulada',
      icon: 'ph:arrow-clockwise-bold',
      blocks: [
        { type: 'p', text: 'Si anulaste una venta por un error (cobro equivocado, método de pago incorrecto) y el cliente sí se lleva lo mismo, no hace falta capturarla otra vez.' },
        {
          type: 'steps',
          items: [
            'En la lista de ventas pulsa la flecha circular ↻ de la venta **Anulada**, o abre la venta y pulsa **Volver a vender**.',
            'Se abre el **Punto de venta** con el mismo cliente y los mismos productos.',
            'Lee el aviso de arriba: dice qué cambió. Revisa y cobra como siempre.',
          ],
        },
        {
          type: 'list',
          items: [
            '**Precios de hoy**: el precio especial vigente del cliente o el de lista. No se copian los precios cambiados a mano ni los descuentos de la venta original.',
            '**Existencias de hoy**: si ya no alcanzan, se agregan las que hay; sin existencia, el producto no se agrega.',
            'Los productos dados de baja no se agregan. Si el cliente fue dado de baja, la venta queda a **Público General**.',
          ],
        },
        { type: 'tip', icon: 'ph:repeat-bold', text: 'En una venta **cobrada** el mismo botón dice **Repetir venta**: sirve para el cliente que compra lo mismo cada semana.' },
        { type: 'warn', text: 'Si ya tienes una venta en curso en el punto de venta, primero cóbrala o descártala: no se mezclan dos ventas en un carrito.' },
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
            { q: 'La lista dice «Esto no significa que no haya ventas: no pudimos consultarlas».', a: 'El servidor no respondió. Pulsa **Reintentar**. Si sigue igual, revisa la conexión. Si llamas a soporte, dale el código que aparece debajo.' },
            { q: 'Dice «Ninguna venta coincide con los filtros».', a: 'Hay filtros activos que no encuentran nada. Pulsa **Limpiar** y vuelve a buscar.' },
            { q: 'No me aparece el botón «Devolver».', a: 'Sólo aparece en ventas cerradas, no anuladas y con piezas por devolver, y si tienes el permiso. Si ya se devolvió todo, el botón desaparece.' },
            { q: 'Al confirmar la devolución sale «Se requiere caja abierta para reembolsar…».', a: 'Vas a regresar efectivo y no tienes turno abierto. Ve a **Caja**, abre tu turno y repite la devolución.' },
            { q: 'Sale «Indica si … vuelve al anaquel o se da de baja».', a: 'Falta elegir **Buen estado** o **Dañada o caducada** en ese producto.' },
            { q: 'Al anular sale «Anular una venta cerrada requiere permiso de gerencia».', a: 'Pide a un gerente que haga la anulación desde su usuario.' },
            { q: 'Al imprimir sale «Esta venta está anulada: no se puede imprimir su ticket».', a: 'Es a propósito: las ventas anuladas no se imprimen.' },
            { q: 'Sale «No se pudo abrir la impresión del navegador…».', a: 'Revisa la impresora predeterminada de la computadora y vuelve a imprimir. Saldrá como copia.' },
            { q: 'En la nota de remisión dice «No se pudo preparar la nota».', a: 'Revisa la conexión y pulsa **Reintentar**.' },
            { q: 'Sale «Falta configurar la ficha de la farmacia…».', a: 'Gerencia debe llenar los datos de la farmacia en **Configuración › Ticket**.' },
          ],
        },
      ],
    },
  ],
}
