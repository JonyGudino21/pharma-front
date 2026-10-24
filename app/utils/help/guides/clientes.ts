import type { HelpGuide } from '../types'

export const clientes: HelpGuide = {
  id: 'clientes',
  title: 'Clientes, crédito y cobranza',
  summary: 'Da de alta clientes, autoriza crédito con días para pagar, cobra abonos y ve qué cobrar primero.',
  icon: 'ph:users-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'En **Clientes** guardas los datos de tus clientes frecuentes y controlas a quién le fías (le vendes a crédito), hasta cuánto, en cuántos días te paga y cuánto te debe.' },
        {
          type: 'list',
          items: [
            '**Directorio**: alta, edición, crédito y estado de cuenta.',
            '**Cobranza** (menú Clientes › Cobranza, o el botón **Cobranza** del directorio): quién te debe, desde cuándo y qué cobrar primero.',
          ],
        },
        { type: 'tip', icon: 'ph:lock-key-bold', text: 'Cada acción tiene su propio permiso (crear, editar, ver cobranza, cobrar, configurar crédito, ver estado de cuenta). Si no ves un botón, pide a gerencia el permiso.' },
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
      title: 'Autorizar crédito, límite y días para pagar',
      icon: 'ph:identification-card-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'En el renglón del cliente pulsa el icono de credencial (**Configurar crédito**). También está en **Cobranza**.',
            'Marca **Autorizar compras a crédito**.',
            'En **Límite de Crédito Permitido** escribe lo máximo que te puede deber (por ejemplo, `2000`).',
            '**Días para pagar** es **opcional**: escribe los días que le das (o toca 7, 15, 30…). Déjalo vacío si no tiene un plazo fijo.',
            'Pulsa **Guardar Cambios**.',
          ],
        },
        { type: 'p', text: 'Los días **sólo proponen** la fecha de pago al vender: en cada venta se puede cambiar o dejar sin fecha. Si el cliente no tiene días propios, se usan los de **Configuración › Crédito** (si gerencia puso alguno).' },
        { type: 'p', text: 'Para quitarle el crédito, desmarca la casilla y guarda: el cliente vuelve a «Contado». Revisa la casilla antes de guardar.' },
        { type: 'warn', text: 'Si su deuda llega al límite, el punto de venta ya no le deja cargar más a crédito.' },
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
            'En **Punto de Venta**, pulsa `F4` (o toca «Toca para asignar cliente») y elige al cliente. Si debe algo vencido, aparece un aviso debajo de su nombre.',
            'Al cobrar, pulsa **Cargar a crédito**. Ahí ves cuánto crédito tiene **Disponible**.',
            'Si deja algo, escríbelo en **Abono inicial (opcional)**.',
            'Revisa la **Fecha de pago (opcional)**: viene propuesta con sus días. Cámbiala, toca 7 / 15 / 30 días o pulsa **Sin fecha**.',
            'Termina el cobro. La venta se suma a la deuda del cliente con esa fecha.',
          ],
        },
        { type: 'tip', icon: 'ph:printer-bold', text: 'En ventas a crédito conviene imprimir la nota de remisión: muestra el saldo pendiente y tiene líneas de firma.' },
      ],
    },
    {
      id: 'deudores',
      title: 'Cobranza: qué cobrar primero',
      icon: 'ph:hand-coins-bold',
      blocks: [
        { type: 'p', text: 'Abre **Clientes › Cobranza**. Arriba ves **Por cobrar** (todo lo que te deben) y tres recuadros: **Vencido**, **Vence en 7 días** y **Sin fecha**.' },
        { type: 'p', text: 'La barra de colores es la **antigüedad** de lo que te deben: verde al corriente, amarillo vencido 1 a 30 días, naranja 31 a 60, rojo 61 a 90, rojo oscuro más de 90 y gris sin fecha de pago. Toca una columna para ver sólo esas ventas.' },
        {
          type: 'list',
          items: [
            '**Por cliente**: ordenados por urgencia (primero quien tiene la deuda más vencida). Cada uno con cuánto **Debe**, cuánto está **Vencido**, su **Deuda más vieja** y su **Situación**. **Ver ventas** muestra sus ventas pendientes; **Cobrar** registra un abono.',
            '**Ventas por cobrar**: todas las ventas con saldo en orden de cobro. Filtra por **Vencidas**, **Por vencer**, **Al corriente** o **Sin fecha**, y por cliente.',
            'La situación se lee así: «Vencida hace 12 días», «Vence hoy», «Vence en 3 días» o «Sin fecha de pago».',
          ],
        },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'Una venta «vence hoy» todavía no está vencida: se vence al día siguiente. Las ventas sin fecha nunca cuentan como vencidas; se ordenan por lo viejo de la venta.' },
      ],
    },
    {
      id: 'fecha-de-pago',
      title: 'Cambiar la fecha de pago de una venta',
      icon: 'ph:calendar-dots-bold',
      blocks: [
        { type: 'p', text: '¿El cliente pidió unos días más? En **Cobranza › Ventas por cobrar** toca la fecha (con el lápiz) de la venta.' },
        {
          type: 'steps',
          items: [
            'Elige la **Nueva fecha**, o toca **En 7 / 15 / 30 días**.',
            'Para quitarla, toca **Sin fecha**.',
            'Pulsa **Guardar fecha** (o **Dejar sin fecha**).',
          ],
        },
        { type: 'warn', text: 'No se aceptan fechas pasadas. Cambiar la fecha no cambia lo que debe.' },
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
            'En **Cobranza**, en el renglón del cliente, pulsa **Cobrar**.',
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
        { type: 'p', text: 'Pulsa el icono de recibo (**Estado de Cuenta y Perfil**) en el renglón del cliente, en **Clientes** o en **Cobranza**.' },
        {
          type: 'list',
          items: [
            'Arriba: **Deuda actual** y **Crédito disponible**.',
            'Tabla: cada venta con **Folio**, **Fecha**, **Total**, **Pagado**, **Saldo**, **Fecha de pago** (con su situación si aún debe) y sus **Abonos**. Pulsa el folio para abrir la venta.',
            'Para ver un periodo, elige **Desde** y **Hasta** y pulsa **Filtrar**. **Quitar filtro** vuelve a mostrar todo.',
          ],
        },
        { type: 'tip', icon: 'ph:chat-circle-text-bold', text: 'Útil cuando el cliente pregunta «¿cuánto debo, de qué y para cuándo?»: muéstrale la tabla.' },
      ],
    },
    {
      id: 'precios-especiales',
      title: 'Precios especiales del cliente',
      icon: 'ph:tag-bold',
      blocks: [
        { type: 'p', text: 'Cada cliente puede tener su propio precio en algunos productos. Se aplican solos al elegirlo en caja; lo demás se le cobra a precio de lista.' },
        {
          type: 'list',
          items: [
            'En el **Estado de cuenta** del cliente, la sección **Precios especiales** muestra cada producto con su precio de lista tachado, su precio especial y la diferencia, además de quién lo cambió, cuándo y por qué.',
            '**Agregar precio**: busca el producto por nombre o SKU y escribe el precio. También nacen en caja al cambiar el precio con el cliente elegido.',
            'El lápiz lo cambia; la ✕ lo quita (el cliente vuelve a la lista); el reloj muestra su historial completo.',
          ],
        },
        { type: 'warn', text: 'Capturar, cambiar y quitar precios especiales es de gerencia. Un precio debajo del costo no se acepta, salvo que se permita en Configuración › Precios en caja.' },
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
            { q: '«El cliente no tiene deuda pendiente»', a: 'Ya no debe nada. Pulsa **Actualizar** en **Cobranza**.' },
            { q: '«No hay ventas pendientes para aplicar este abono…»', a: 'La deuda del cliente no coincide con sus ventas. No cobres y llama a soporte.' },
            { q: 'En caja no aparece **Cargar a crédito**.', a: 'El cliente no tiene crédito autorizado o no está asignado a la venta (`F4`). Pide a gerencia que le configure el crédito.' },
            { q: 'En caja dice «… tiene saldo vencido … la configuración no permite crédito nuevo».', a: 'Gerencia activó **No permitir crédito nuevo** en Configuración › Crédito. Cobra primero lo vencido (en **Cobranza › Cobrar**) o cobra esta venta completa.' },
            { q: '«La fecha de pago no puede ser anterior a hoy.»', a: 'Elige hoy o una fecha futura, o deja la venta **Sin fecha**.' },
            { q: 'En Cobranza todo aparece «Sin fecha de pago».', a: 'Son ventas a crédito anteriores a las fechas de pago, o se vendieron sin fecha. Ponles fecha con el lápiz en **Ventas por cobrar**.' },
            { q: '«No se encontraron clientes.»', a: 'Borra el texto del buscador y elige «Todos los estados».' },
            { q: '«Este cliente no tiene ventas en el periodo.»', a: 'Amplía las fechas o pulsa **Quitar filtro**.' },
            { q: 'Desactivé a un cliente por error.', a: 'Pide a soporte que lo vuelva a activar; su historial no se perdió.' },
          ],
        },
      ],
    },
  ],
}
