import type { HelpGuide } from '../types'

export const dispositivos: HelpGuide = {
  id: 'dispositivos',
  title: 'Conectar impresora, cajón y lector',
  summary: 'Paso a paso, sin instalar programas raros. Hazlo una vez en cada computadora de caja.',
  icon: 'ph:printer-bold',
  sections: [
    {
      id: 'antes',
      title: 'Antes de empezar',
      icon: 'ph:list-checks-bold',
      blocks: [
        { type: 'p', text: 'Qué necesitas:' },
        {
          type: 'list',
          items: [
            '**Google Chrome o Microsoft Edge** actualizados. Otros navegadores no pueden hablar directo con la impresora.',
            '**Impresora térmica de tickets** de 58 u 80 mm con cable USB (las comunes en tiendas: Epson, Star y marcas genéricas).',
            '**Cajón de dinero** (opcional) con su cable tipo teléfono. Se conecta a la impresora, no a la computadora.',
            '**Lector de código de barras** USB (opcional). No necesita nada más.',
          ],
        },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'Lo que configures en Dispositivos se guarda **en esta computadora**. Si tienes dos cajas, repite la guía en cada una.' },
        { type: 'tip', icon: 'ph:printer-bold', text: '¿No tienes impresora térmica? Elige **Navegador** en «Impresora»: los tickets saldrán por cualquier impresora normal con el diálogo de imprimir de siempre.' },
      ],
    },
    {
      id: 'impresora',
      title: 'Impresora de tickets',
      icon: 'ph:printer-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Conecta la impresora a la corriente y a la computadora con su cable USB. Enciéndela y verifica que tenga papel (la cara brillante del rollo hacia el cabezal).',
            'En **Configuración › Dispositivos**, en **Impresora**, elige **Térmica USB**.',
            'Pulsa **Emparejar**. Aparece una ventanita del navegador con los aparatos conectados: elige tu impresora (suele decir la marca o «Printer») y pulsa **Conectar**.',
            'Escribe un nombre para esta caja (por ejemplo, «Caja 1») y pulsa **Guardar** en la barra de abajo.',
            'Pulsa **Imprimir prueba**. Debe salir un ticket que dice «IMPRESIÓN DE PRUEBA».',
            'Si quieres que el ticket salga solo al cobrar, activa **Imprimir el ticket automáticamente** en «Al cobrar» y guarda.',
          ],
        },
        { type: 'tip', icon: 'ph:text-aa-bold', text: '¿Los acentos o la «ñ» salen como símbolos raros? Ve a **Configuración › Ticket**, en **Acentos y ñ en la impresora térmica** elige **Con acentos y ñ** (o **Sin acentos** si salen raros) y vuelve a imprimir la prueba.' },
      ],
    },
    {
      id: 'cajon',
      title: 'Cajón de dinero',
      icon: 'ph:vault-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Conecta el cable del cajón (parece de teléfono) en la entrada de la **impresora** que dice «DK», «Drawer» o tiene el dibujo de un cajón. **No** va a la computadora.',
            'Primero deja funcionando la impresora: el cajón abre a través de ella.',
            'En **Cajón de dinero** deja **Pin 2** (funciona en la mayoría) y pulsa **Probar cajón**.',
            '¿No abrió? Cambia a **Pin 5**, guarda y vuelve a probar.',
            'Para que abra solo al cobrar en efectivo, activa **Abrir el cajón en cobros con efectivo** y guarda.',
          ],
        },
        { type: 'tip', icon: 'ph:shield-check-bold', text: 'Cada vez que el cajón se abre sin una venta queda registrado quién lo abrió, cuándo y desde qué caja. Gerencia lo ve en el detalle del turno.' },
      ],
    },
    {
      id: 'lector',
      title: 'Lector de código de barras',
      icon: 'ph:barcode-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Conéctalo a un puerto USB. No se instala nada: la computadora lo trata como un teclado.',
            'Para comprobarlo, abre el **Bloc de notas** y escanea cualquier producto: deben aparecer los números del código y el cursor debe **bajar de línea** solo.',
            'En el **Punto de venta**, deja el cursor en el campo «Escanea un código…» (ya está ahí al entrar) y escanea: el producto se agrega al carrito.',
          ],
        },
        { type: 'tip', icon: 'ph:keyboard-bold', text: 'Si los números aparecen pero el cursor **no baja de línea**, el lector no está enviando `Enter` al final. Busca en su manual la hoja de códigos de configuración y escanea el que dice **«Add Enter / CR suffix»**.' },
        { type: 'tip', icon: 'ph:hash-bold', text: 'Para cobrar varias piezas iguales: escribe la cantidad, un asterisco y escanea. Por ejemplo `3*` y luego el código.' },
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
            { q: 'La impresora no aparece en la lista al pulsar «Emparejar».', a: 'Revisa que esté encendida y con el cable USB bien conectado; prueba otro puerto. Usa Chrome o Edge. Si aun así no aparece, Windows la tiene ocupada con su propio programa: pide a soporte que le cambie el controlador a «WinUSB» (es un cambio de 2 minutos). Mientras tanto, puedes trabajar con impresión por **Navegador**.' },
            { q: 'Aparece, pero «Imprimir prueba» no saca nada.', a: 'Apaga y enciende la impresora, revisa el papel y la tapa cerrada. Pulsa «Olvidar», vuelve a «Emparejar» y guarda.' },
            { q: 'Sale papel en blanco.', a: 'El rollo está al revés: la cara brillante (la que se raya con la uña) debe ir hacia el cabezal.' },
            { q: 'El ticket sale cortado o muy angosto.', a: 'En **Configuración › Ticket** elige el ancho de tu papel: 58 mm o 80 mm.' },
            { q: 'El cajón no abre.', a: 'El cable debe ir a la impresora, no a la computadora. Prueba con el otro pin (Pin 2 / Pin 5). Sin impresora térmica, el cajón no puede abrirse desde el sistema.' },
            { q: 'Cambié de computadora o de navegador y ya no imprime.', a: 'La configuración vive en cada computadora: repite «Emparejar» y «Guardar» en la nueva.' },
          ],
        },
        { type: 'tip', icon: 'ph:lifebuoy-bold', text: 'Si llamas a soporte, ten a la mano la marca y el modelo de la impresora (vienen en una etiqueta debajo) y qué mensaje aparece en pantalla.' },
      ],
    },
  ],
}
