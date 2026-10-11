import type { HelpGuide } from '../types'

export const clientes: HelpGuide = {
  id: 'clientes',
  title: 'Clientes y crédito',
  summary: 'Da de alta clientes, autoriza crédito, cobra abonos y consulta cuánto debe cada uno.',
  icon: 'ph:users-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'En **Clientes** guardas los datos de tus clientes frecuentes y controlas a quién le fías (le vendes a crédito), hasta cuánto y cuánto te debe.' },
        {
          type: 'list',
          items: [
            '**Directorio de Clientes**: alta, edición, crédito y estado de cuenta.',
            '**Ver Deudores**: quién te debe, cuánto, y el botón para cobrar.',
          ],
        },
        { type: 'tip', icon: 'ph:lock-key-bold', text: 'Cada acción tiene su propio permiso (crear, editar, ver deudores, cobrar, configurar crédito, ver estado de cuenta). Si no ves un botón, pide a gerencia el permiso.' },
      ],
    },
    {
      id: 'nuevo-cliente',
      title: 'Dar de alta un cliente',
      icon: 'ph:user-plus-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Pulsa **Nuevo Cliente**.',
            'Escribe el **Nombre Completo o Razón Social** (obligatorio).',
            'Si los tienes, llena **Teléfono**, **Correo Electrónico**, **RFC**, **CURP** y **Dirección Completa**.',
            'Pulsa **Guardar**.',
          ],
        },
        { type: 'tip', icon: 'ph:file-text-bold', text: 'El RFC y la dirección aparecen en la nota de remisión. Captúralos en clientes que son empresas o que te piden comprobante.' },
        { type: 'p', text: 'Para corregir datos pulsa el lápiz (**Editar**). El bote de basura (**Desactivar**) lo saca de los activos, conserva su historial y ya no podrá comprar a crédito.' },
      ],
    },
    {
      id: 'credito',
      title: 'Autorizar crédito y su límite',
      icon: 'ph:identification-card-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'En el renglón del cliente pulsa el icono de credencial (**Configurar crédito**). También está en **Ver Deudores**.',
            'Marca **Autorizar compras a crédito**.',
            'En **Límite de Crédito Permitido** escribe lo máximo que te puede deber (por ejemplo, `2000`).',
            'Pulsa **Guardar Cambios**. En la columna **Crédito** verás «Límite: …».',
          ],
        },
        { type: 'p', text: 'Para quitarle el crédito, desmarca la casilla y guarda: el cliente vuelve a «Contado». Revisa la casilla antes de guardar.' },
        { type: 'warn', text: 'Si su deuda llega al límite, el punto de venta ya no le deja cargar más a crédito. En **Ver Deudores** verás «¡Límite Excedido!» si ya lo rebasó.' },
      ],
    },
    {
      id: 'vender-a-credito',
      title: 'Vender a crédito en caja',
      icon: 'ph:shopping-cart-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'En **Punto de Venta**, pulsa `F4` (o toca «Toca para asignar cliente») y elige al cliente.',
            'Al cobrar, pulsa **Cargar a crédito**. Ahí ves cuánto crédito tiene **Disponible**.',
            'Termina el cobro. La venta se suma a la deuda del cliente.',
          ],
        },
        { type: 'tip', icon: 'ph:printer-bold', text: 'En ventas a crédito conviene imprimir la nota de remisión: muestra el saldo pendiente y tiene líneas de firma.' },
      ],
    },
    {
      id: 'deudores',
      title: 'Ver quién te debe',
      icon: 'ph:warning-circle-bold',
      blocks: [
        { type: 'p', text: 'En **Clientes** pulsa **Ver Deudores**. Se abre **Cuentas por Cobrar**:' },
        {
          type: 'list',
          items: [
            '**Deuda Global en Calle**: todo lo que te deben entre todos los clientes.',
            'La lista va del que más debe al que menos, con su **Límite Otorgado**, su **Última Venta** y su **Deuda Actual**.',
            'Si sale «¡Cartera limpia!», nadie te debe nada.',
          ],
        },
      ],
    },
    {
      id: 'cobrar-abono',
      title: 'Cobrar un abono',
      icon: 'ph:money-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'En **Ver Deudores**, en el renglón del cliente, pulsa **Cobrar**.',
            'Revisa la **Deuda Total Actual**.',
            'Elige el **Método de Pago**: efectivo, transferencia o tarjeta.',
            'Escribe el **Monto a Abonar** y, si hay, la **Referencia / Folio**.',
            'Pulsa **Registrar Pago**.',
          ],
        },
        { type: 'p', text: 'El abono se aplica primero a la venta más antigua que debe, luego a la siguiente, y así.' },
        { type: 'warn', text: 'En **efectivo** el dinero entra a tu caja: necesitas un turno abierto. Si cobras de más, el excedente **no** queda como saldo a favor: cobra sólo lo que debe.' },
      ],
    },
    {
      id: 'estado-de-cuenta',
      title: 'Estado de cuenta del cliente',
      icon: 'ph:receipt-bold',
      blocks: [
        { type: 'p', text: 'Pulsa el icono de recibo (**Estado de Cuenta y Perfil**) en el renglón del cliente, en **Clientes** o en **Ver Deudores**.' },
        {
          type: 'list',
          items: [
            'Arriba: **Deuda actual** y **Crédito disponible**.',
            'Tabla: cada venta con **Folio**, **Fecha**, **Total**, **Pagado**, **Saldo** y sus **Abonos** (fecha, método y monto). Pulsa el folio para abrir la venta.',
            'Para ver un periodo, elige **Desde** y **Hasta** y pulsa **Filtrar**. **Quitar filtro** vuelve a mostrar todo.',
          ],
        },
        { type: 'tip', icon: 'ph:chat-circle-text-bold', text: 'Útil cuando el cliente pregunta «¿cuánto debo y de qué?»: muéstrale la tabla con sus ventas y abonos.' },
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
            { q: '«El email ya esta registrado» o «El RFC ya esta registrado».', a: 'Ese correo o RFC ya lo tiene otro cliente. Búscalo en el directorio: probablemente ya estaba dado de alta.' },
            { q: '«Se requiere caja abierta para recibir efectivo.»', a: 'Abre tu turno en **Caja** y vuelve a registrar el abono, o elige transferencia o tarjeta si así te pagó.' },
            { q: '«El cliente no tiene deuda pendiente»', a: 'Ya no debe nada. Actualiza la pantalla de **Ver Deudores**.' },
            { q: '«No hay ventas pendientes para aplicar este abono…»', a: 'La deuda del cliente no coincide con sus ventas. No cobres y llama a soporte.' },
            { q: 'En caja no aparece **Cargar a crédito**.', a: 'El cliente no tiene crédito autorizado o no está asignado a la venta (`F4`). Pide a gerencia que le configure el crédito.' },
            { q: '«No se encontraron clientes.»', a: 'Borra el texto del buscador y elige «Todos los estados».' },
            { q: '«Este cliente no tiene ventas en el periodo.»', a: 'Amplía las fechas o pulsa **Quitar filtro**.' },
            { q: 'Desactivé a un cliente por error.', a: 'Pide a soporte que lo vuelva a activar; su historial no se perdió.' },
          ],
        },
      ],
    },
  ],
}
