import type { HelpGuide } from '../types'

export const usuarios: HelpGuide = {
  id: 'usuarios',
  title: 'Usuarios y permisos',
  summary: 'Quién puede entrar al sistema, con qué rol, y cómo sacar a alguien de una caja a distancia.',
  icon: 'ph:users-three-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'Aquí das de alta a cada persona que trabaja en la farmacia, le asignas un **rol** y controlas sus sesiones (en qué computadoras tiene el sistema abierto).' },
        { type: 'p', text: 'Entra por **Usuarios** en el menú de la izquierda, o por **Configuración › Usuarios**. La tabla de qué puede hacer cada rol está en **Configuración › Permisos**.' },
        { type: 'tip', icon: 'ph:lock-key-bold', text: 'Sólo lo ve quien tiene el permiso «Usuarios y permisos» (normalmente el **Administrador**). Si no lo ves en el menú, pide a gerencia o al dueño que lo haga por ti.' },
        { type: 'tip', icon: 'ph:user-bold', text: 'Una cuenta por persona: nunca compartan usuario. Así cada venta, descuento y apertura de cajón tiene un responsable.' },
      ],
    },
    {
      id: 'roles',
      title: 'Los cuatro roles',
      icon: 'ph:identification-badge-bold',
      blocks: [
        {
          type: 'list',
          items: [
            '**Administrador**: todo, incluidos usuarios y permisos. Normalmente el dueño.',
            '**Gerente**: cancela ventas, autoriza descuentos y retiros, ajusta inventario, ve reportes y configura la operación (caja, inventario, impuestos, ticket y nota de remisión).',
            '**Farmacéutico**: vende, gestiona productos y compras, y consulta Kardex, caducidades y libro de controlados.',
            '**Cajero**: vende, abre y cierra su propio turno y atiende clientes.',
          ],
        },
        { type: 'p', text: 'Los permisos van **por rol, no por persona**. Para que alguien pueda hacer más (o menos), cámbiale el rol.' },
      ],
    },
    {
      id: 'crear',
      title: 'Dar de alta a una persona',
      icon: 'ph:user-plus-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Pulsa **Nuevo usuario** (arriba a la derecha).',
            'Escribe **Nombre(s)**, **Apellidos** y **Correo electrónico**.',
            'En **Usuario para iniciar sesión** escribe un nombre corto, por ejemplo «jperez»: de 3 a 30 caracteres, sólo letras, números, punto, guion y guion bajo, **sin espacios**.',
            'Elige el **Rol**.',
            'Escribe una **Contraseña** de 8 a 72 caracteres.',
            'Pulsa **Crear usuario**. Verás «Usuario creado. Ya puede iniciar sesión.».',
          ],
        },
        { type: 'tip', icon: 'ph:chat-circle-slash-bold', text: 'Entrega la contraseña en persona, nunca por mensaje. Pide a la persona que la cambie el primer día desde su nombre (arriba a la derecha) › **Cambiar contraseña**.' },
      ],
    },
    {
      id: 'editar',
      title: 'Editar, dar de baja y reactivar',
      icon: 'ph:user-gear-bold',
      blocks: [
        { type: 'p', text: 'Busca a la persona con «Buscar por nombre, usuario o correo…»: sirve su nombre, su apellido, su usuario de inicio de sesión o su correo. El filtro de la derecha muestra **Activos**, **Dados de baja** o **Todos**.' },
        {
          type: 'list',
          items: [
            '**Editar** (lápiz): cambia datos, rol o contraseña. Deja **Nueva contraseña** vacía para conservar la actual.',
            '**Dar de baja** (persona con signo menos): pierde el acceso al momento y se cierran sus sesiones. Sus ventas y turnos se conservan.',
            '**Reactivar** (persona con palomita): aparece en los dados de baja. Puede volver a entrar con su contraseña.',
          ],
        },
        { type: 'warn', text: 'Si cambias el **rol** o la **contraseña** de alguien, o lo desmarcas como activo, al guardar **se cierran sus sesiones**: si está cobrando, tendrá que volver a entrar. Hazlo fuera de un cobro.' },
        { type: 'tip', icon: 'ph:shield-check-bold', text: 'No puedes cambiar tu propio rol ni darte de baja a ti mismo, y siempre debe quedar al menos un administrador activo. Para eso, pide ayuda a otro administrador.' },
      ],
    },
    {
      id: 'cerrar-sesiones',
      title: 'Cerrar sesiones a distancia',
      icon: 'ph:sign-out-bold',
      blocks: [
        { type: 'p', text: 'La columna **Sesiones** dice cuántas sesiones tiene abiertas cada persona (por ejemplo «2 abiertas») y cuándo fue su última actividad.' },
        {
          type: 'steps',
          items: [
            'En la fila de la persona, pulsa **Cerrar sesiones** (flecha saliendo de una puerta). Sólo aparece si tiene sesiones abiertas.',
            'Confirma con **Cerrar sesiones**.',
            'Verás cuántas se cerraron. La persona puede volver a entrar con su misma contraseña.',
          ],
        },
        { type: 'tip', icon: 'ph:desktop-bold', text: 'Útil cuando alguien dejó su sesión abierta en otra caja o en una computadora que no es suya.' },
      ],
    },
    {
      id: 'permisos',
      title: 'Matriz de permisos',
      icon: 'ph:shield-check-bold',
      blocks: [
        { type: 'p', text: 'En **Configuración › Permisos** ves una tabla: cada renglón es una acción (por ejemplo «Cancelar ventas» o «Ajustar inventario») y cada columna un rol. La palomita verde significa que ese rol sí puede.' },
        { type: 'p', text: 'La tabla es **sólo de consulta**: la define el sistema y no se edita desde aquí. Para cambiar lo que puede hacer una persona, cambia su rol en **Usuarios**.' },
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
            { q: 'No me deja guardar: aparece «Sólo letras, números, punto, guion y guion bajo (sin espacios).»', a: 'El usuario de inicio de sesión no admite espacios ni acentos. Usa algo como «jperez» o «ana.martinez».' },
            { q: 'Dice «Mínimo 8 caracteres.» en la contraseña.', a: 'La contraseña debe tener de 8 a 72 caracteres. Una frase de varias palabras es fácil de recordar.' },
            { q: 'Aparece «Debe quedar al menos un administrador activo…».', a: 'Intentaste quitarle el rol o dar de baja al único administrador. Primero nombra a otra persona como Administrador y luego haz el cambio.' },
            { q: 'Al editarme, los roles están grises y dice «No puedes cambiar tu propio rol: pídeselo a otro administrador.»', a: 'Por seguridad nadie puede cambiarse el rol ni darse de baja a sí mismo. Pide a otro administrador que lo haga.' },
            { q: 'Al crear el usuario sale un error y la ventana sigue abierta.', a: 'Lee el mensaje: lo más común es que el usuario o el correo ya los tenga otra persona. Cámbialos y vuelve a pulsar **Crear usuario**.' },
            { q: 'La búsqueda no encuentra a la persona.', a: 'Prueba con su apellido, su usuario o su correo. Revisa también el filtro: puede estar en **Activos** y la persona estar dada de baja.' },
            { q: 'La lista no carga y aparece «No se pudo conectar con el servidor.»', a: 'Revisa el internet y pulsa **Reintentar**.' },
          ],
        },
      ],
    },
  ],
}
