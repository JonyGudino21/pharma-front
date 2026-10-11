import type { HelpGuide } from '../types'

export const cuenta: HelpGuide = {
  id: 'cuenta',
  title: 'Mi cuenta y contraseña',
  summary: 'Cambia tu propia contraseña sin pedírselo a nadie. Hazlo el primer día y cada vez que sospeches que alguien la vio.',
  icon: 'ph:key-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'Cada persona puede cambiar **su propia** contraseña. No necesitas ningún permiso especial.' },
        { type: 'p', text: 'Pulsa tu nombre de usuario (arriba a la derecha). Ahí está **Cambiar contraseña** y también **Cerrar Sesión**, para salir de esta computadora.' },
        { type: 'tip', icon: 'ph:user-gear-bold', text: '¿Olvidaste tu contraseña? Desde aquí no se puede recuperar: pide al administrador que te ponga una nueva en **Usuarios** y luego cámbiala tú.' },
      ],
    },
    {
      id: 'cambiar',
      title: 'Cambiar tu contraseña',
      icon: 'ph:password-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Pulsa tu nombre (arriba a la derecha) › **Cambiar contraseña**.',
            'Escribe tu **Contraseña actual**.',
            'Escribe la **Contraseña nueva**: mínimo 8 caracteres y distinta de la actual.',
            'Escríbela otra vez en **Repite la contraseña nueva**.',
            'Pulsa **Cambiar contraseña**.',
          ],
        },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'Una frase de varias palabras es más fácil de recordar y más difícil de adivinar. No la anotes junto a la caja ni la compartas.' },
      ],
    },
    {
      id: 'despues',
      title: 'Qué pasa después',
      icon: 'ph:sign-out-bold',
      blocks: [
        { type: 'p', text: 'Al guardar se cierran **todas** tus sesiones abiertas, incluida ésta y las de otras cajas o computadoras. Verás «Contraseña actualizada. Inicia sesión con la nueva.» y la pantalla de inicio de sesión.' },
        { type: 'p', text: 'Entra de nuevo con tu usuario y la contraseña nueva.' },
        { type: 'warn', text: 'No la cambies a media venta: termina el cobro primero, porque el sistema te sacará de todas las cajas donde tengas sesión.' },
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
            { q: 'El botón **Cambiar contraseña** está gris.', a: 'Falta algo: escribe la contraseña actual, una nueva de al menos 8 caracteres que sea **distinta** de la actual, y repítela igual.' },
            { q: 'Aparece «Las contraseñas no coinciden.»', a: 'Lo que escribiste en «Repite la contraseña nueva» no es igual a la nueva. Vuelve a escribir las dos con calma.' },
            { q: 'Aparece «La contraseña actual no es correcta.»', a: 'Te equivocaste en la actual; el campo se borra para que la escribas de nuevo. Revisa que no esté activado Bloq Mayús.' },
            { q: 'Aparece «La nueva contraseña debe ser distinta de la actual.»', a: 'Elige una contraseña que no hayas usado ahora.' },
            { q: 'Aparece «Demasiados intentos. Espera un momento e inténtalo de nuevo.»', a: 'Por seguridad hay un límite de intentos. Espera un minuto y vuelve a probar.' },
          ],
        },
      ],
    },
  ],
}
