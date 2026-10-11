import type { HelpGuide } from '../types'

export const proveedores: HelpGuide = {
  id: 'proveedores',
  title: 'Proveedores',
  summary: 'Directorio de proveedores: sus datos, sus días de crédito y cuánto les debes.',
  icon: 'ph:handshake-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'En **Proveedores** guardas a quién le compras: nombre, contacto, teléfono, correo y cuántos días te da para pagar. También ves cuánto le debes a cada uno.' },
        {
          type: 'list',
          items: [
            '**Deuda Actual** se calcula sola con las compras recibidas y los pagos; no se escribe a mano.',
            'Los pagos al proveedor se registran desde cada compra, en **Compras**, no aquí.',
          ],
        },
        { type: 'tip', icon: 'ph:lock-key-bold', text: 'Si no ves el menú **Proveedores**, pide a gerencia el permiso para gestionar proveedores.' },
      ],
    },
    {
      id: 'nuevo-proveedor',
      title: 'Dar de alta un proveedor',
      icon: 'ph:plus-circle-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Pulsa **Nuevo Proveedor**.',
            'Escribe la **Razón Social o Nombre** (obligatorio).',
            'Si los tienes, llena **Nombre del Contacto**, **Teléfono** y **Correo Electrónico**. El correo no puede repetirse entre proveedores.',
            'En **Días de Crédito** escribe cuántos días te da para pagar. Pon `0` si le pagas de contado.',
            'Pulsa **Guardar**. Ya puedes elegirlo al capturar una compra.',
          ],
        },
      ],
    },
    {
      id: 'buscar-editar',
      title: 'Buscar, editar y desactivar',
      icon: 'ph:pencil-simple-bold',
      blocks: [
        {
          type: 'list',
          items: [
            'Busca por nombre, correo o teléfono en el buscador de arriba. Junto a él puedes ver «Activos», «Inactivos» o «Todos los estados».',
            'Lápiz (**Editar**): cambia sus datos y pulsa **Guardar**.',
            'Bote de basura (**Desactivar**): ya no aparece para nuevas compras, pero su historial se conserva.',
            'Para volver a activarlo, filtra «Inactivos», pulsa el lápiz, marca **Proveedor Activo** y guarda.',
          ],
        },
        { type: 'tip', icon: 'ph:warning-bold', text: 'No puedes desactivar a un proveedor al que le debes dinero o que tiene compras pendientes. Primero liquida o cancela esas compras.' },
      ],
    },
    {
      id: 'estado-de-cuenta',
      title: 'Estado de cuenta: cuánto le debo',
      icon: 'ph:receipt-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'En el renglón del proveedor pulsa el icono de recibo (**Estado de Cuenta**).',
            'Arriba ves la **Deuda Pendiente** total y sus **Días de Crédito**.',
            'Abajo, en **Facturas Pendientes de Pago**, cada factura con su **Total**, lo **Pagado** y el **Saldo**, marcada como «PENDIENTE» o «PAGO PARCIAL».',
          ],
        },
        { type: 'p', text: 'Para pagar una factura, ve a **Compras**, abre esa compra (busca su folio) y usa **+ Abonar**.' },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'Si la deuda aparece en **negativo**, el proveedor te debe a ti: suele pasar cuando cancelas una compra que ya habías pagado.' },
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
            { q: '«El proveedor con email … ya existe.» o «El email … ya está usado por otro proveedor.»', a: 'Ese correo ya lo tiene otro proveedor. Busca si ya estaba dado de alta, o deja el correo vacío.' },
            { q: '«No se puede eliminar al proveedor … porque tiene un saldo pendiente de pago…»', a: 'Le debes dinero. Paga sus facturas desde **Compras** y vuelve a intentarlo.' },
            { q: '«No se puede eliminar al proveedor … porque tiene compras pendientes.»', a: 'Tiene compras sin recibir o sin terminar. Recíbelas o cancélalas en **Compras**.' },
            { q: '«No se encontraron proveedores.»', a: 'Borra el texto del buscador y elige «Todos los estados».' },
            { q: 'El estado de cuenta dice «¡Al día!».', a: 'No hay compras pendientes de pago con ese proveedor. Todo está pagado.' },
          ],
        },
      ],
    },
  ],
}
