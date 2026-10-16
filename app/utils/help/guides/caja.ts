import type { HelpGuide } from '../types'

export const caja: HelpGuide = {
  id: 'caja',
  title: 'Caja: turno, retiros y corte',
  summary: 'Abre tu turno con el fondo, registra retiros y gastos, y haz el corte al final del día.',
  icon: 'ph:cash-register-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'En el menú **Caja** llevas el control del efectivo de tu turno: con cuánto empiezas, qué entra y sale fuera de las ventas, y cuánto contaste al cerrar.' },
        { type: 'p', text: 'Cada cajero tiene su propio turno. Mientras tu turno esté abierto, la pantalla dice **Turno Abierto · Caja Activa** y la hora en que lo abriste.' },
        { type: 'tip', icon: 'ph:shield-check-bold', text: 'Si no ves **Caja** en el menú, o no aparecen las operaciones manuales, pide a gerencia el permiso.' },
      ],
    },
    {
      id: 'abrir',
      title: 'Abrir turno y fondo inicial',
      icon: 'ph:lock-key-open-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Entra a **Caja**. Si no tienes turno, verás **Caja Cerrada**.',
            'Cuenta el dinero con el que empiezas (el fondo o «morralla» para dar cambio).',
            'Escríbelo en **Monto Inicial en Caja**. Si gerencia definió un fondo sugerido, ya aparece escrito: confírmalo contando o corrígelo.',
            'Si quieres, agrega una nota (por ejemplo, «cambio en monedas»).',
            'Pulsa **Abrir Caja**.',
          ],
        },
        { type: 'warn', text: 'Escribe lo que **realmente contaste**, no lo que «debería» haber. Ese monto es la base del corte del final del día.' },
      ],
    },
    {
      id: 'operaciones',
      title: 'Retiros, gastos e ingresos',
      icon: 'ph:hand-coins-bold',
      blocks: [
        { type: 'p', text: 'En **Operaciones Manuales (Manager)** se registra el efectivo que entra o sale sin ser una venta. Sólo lo ve quien tiene permiso (normalmente gerencia).' },
        {
          type: 'list',
          items: [
            '**Sangría (Retiro)**: sacar efectivo del cajón para guardarlo o depositarlo.',
            '**Gasto (Pago Servicios)**: pagar algo con dinero de la caja (agua, mensajería…).',
            '**Ingreso Manual**: meter efectivo al cajón (por ejemplo, más cambio).',
          ],
        },
        { type: 'p', text: 'Elige el **Tipo de Movimiento**, escribe el **Monto** y el **Motivo (Justificación)**, y pulsa **Registrar**.' },
        { type: 'warn', text: 'Registra el movimiento **en el momento** en que sacas o metes el dinero. Si no, el corte saldrá con faltante o sobrante.' },
        { type: 'tip', icon: 'ph:coins-bold', text: 'Si aparece «Hay más efectivo en caja del recomendado», haz una sangría para no tener tanto dinero expuesto. El límite se define en **Configuración › Caja**.' },
      ],
    },
    {
      id: 'cajon',
      title: 'Abrir el cajón sin venta',
      icon: 'ph:vault-bold',
      blocks: [
        { type: 'p', text: 'Debajo de las operaciones manuales está **Abrir cajón sin venta · motivo**. Escribe por qué lo abres (por ejemplo, «cambio para cliente») y pulsa **Abrir cajón**.' },
        { type: 'p', text: 'Queda registrado quién lo abrió, cuándo, por qué y desde qué caja. Si el registro no se puede guardar, el cajón **no** se abre.' },
        { type: 'tip', icon: 'ph:printer-bold', text: 'El cajón abre a través de la impresora térmica. Si no está conectada, revisa **Configuración › Dispositivos** (ver la guía «Conectar impresora, cajón y lector»).' },
      ],
    },
    {
      id: 'corte',
      title: 'Corte de caja',
      icon: 'ph:flag-checkered-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Al terminar tu turno, cuenta todos los billetes y monedas del cajón.',
            'Escribe el total en **Total Físico Contado**. Si quieres, agrega notas de cierre.',
            'Pulsa **Realizar Corte de Caja** y luego **Sí, Realizar Corte**. Si dudas, pulsa **Revisar de nuevo** y vuelve a contar.',
          ],
        },
        { type: 'p', text: 'Al terminar verás el resumen: monto inicial, ventas en efectivo, ingresos, salidas, lo que el **Sistema Esperaba**, lo que **Tú Declaraste** y la **Diferencia** («Faltante detectado» o «Sobrante detectado»).' },
        { type: 'tip', icon: 'ph:eye-slash-bold', text: '**Corte ciego**: si gerencia lo activó, cuentas sin saber cuánto debería haber. Al terminar sólo ves **Corte registrado**, tu monto inicial y lo que declaraste; gerencia revisa la diferencia. Así nadie ajusta la cifra para que «cuadre».' },
        { type: 'warn', text: 'El corte cierra tu turno y **no se puede repetir**. Cuenta con calma antes de confirmar.' },
      ],
    },
    {
      id: 'diferencias',
      title: 'Diferencias y tolerancia',
      icon: 'ph:scales-bold',
      blocks: [
        { type: 'p', text: 'La **tolerancia** es la diferencia que se acepta entre lo contado y lo esperado. Cuenta igual si falta o si sobra.' },
        {
          type: 'list',
          items: [
            'Diferencia dentro de la tolerancia: el turno cierra como **Caja Cuadrada** (en el historial, **Cerrado**).',
            'Diferencia mayor: dice **Diferencia fuera de tolerancia** y el turno queda como **Requiere auditoría** (en el historial, **Auditoría**).',
          ],
        },
        { type: 'p', text: 'Gerencia define la tolerancia, el **Cierre ciego**, el fondo sugerido y el límite de efectivo en **Configuración › Caja**. Los cambios aplican desde el siguiente cierre y en todas las cajas. Con cierre ciego, quien puede ver los turnos de todos sigue viendo el resumen completo.' },
      ],
    },
    {
      id: 'historial',
      title: 'Historial y detalle de turnos',
      icon: 'ph:list-dashes-bold',
      blocks: [
        { type: 'p', text: 'Gerencia pulsa **Ver Historial** en la pantalla de Caja. Ahí ve todos los turnos con su monto inicial, lo declarado, la diferencia y el estado: **Abierto**, **Cerrado** o **Auditoría**.' },
        { type: 'p', text: 'Filtra por **Estado**, **Fecha Inicio** y **Fecha Fin**. Pulsa la lupa de un turno para ver su detalle: quién lo atendió, lo esperado contra lo declarado, las notas, los movimientos de efectivo y las ventas del turno.' },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'Revisa cada semana los turnos en **Auditoría**: son los que tuvieron diferencias grandes.' },
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
            { q: 'Aparece «No pudimos consultar tu turno».', a: 'El servidor no respondió. **No abras otra caja**: pulsa **Reintentar** hasta que aparezca tu turno o «Caja Cerrada».' },
            { q: 'Al abrir sale «Ya tienes un turno abierto. Debes cerrarlo antes de abrir uno nuevo».', a: 'Ya hay un turno tuyo abierto. Recarga la pantalla de Caja para verlo y ciérralo con su corte.' },
            { q: 'Al registrar un retiro sale «No hay turno abierto para realizar operaciones».', a: 'Primero abre tu turno de caja.' },
            { q: 'Sale «No se encontró la impresora de esta caja (el cajón se abre a través de ella)…».', a: 'Conecta y empareja la impresora térmica en **Configuración › Dispositivos** y vuelve a intentar.' },
            { q: 'El botón «Abrir cajón» está gris.', a: 'Escribe un motivo de al menos 3 letras.' },
            { q: 'Al cerrar sale «No tienes un turno abierto para cerrar» o «Este turno ya fue cerrado por otra operación».', a: 'El turno ya estaba cerrado (quizá desde otra pestaña o computadora). Recarga la pantalla.' },
            { q: 'Me salió «Diferencia fuera de tolerancia».', a: 'El turno quedó como **Requiere auditoría**. Avisa a gerencia; revisarán los movimientos del turno.' },
            { q: 'Aparece «No pudimos cargar este turno».', a: 'Puede que no exista o que no haya conexión. Pulsa **Reintentar** o vuelve al historial.' },
          ],
        },
      ],
    },
  ],
}
