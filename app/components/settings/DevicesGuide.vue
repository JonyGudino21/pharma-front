<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * GUÍA DE CONEXIÓN DE DISPOSITIVOS — para quien conecta una impresora, un
 * cajón o un lector por primera vez. Lenguaje sin tecnicismos: qué hacer, en
 * qué orden y cómo saber que quedó bien. Los términos técnicos (WinUSB, RJ-11,
 * ESC/POS) sólo aparecen donde ayudan a pedir ayuda a soporte.
 */
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

type Seccion = 'antes' | 'impresora' | 'cajon' | 'lector' | 'problemas'
const abierta = ref<Seccion>('antes')

/** Recuadro de consejo; claro y oscuro con las mismas clases que el resto de la app. */
const TIP = 'mt-3 flex gap-2.5 rounded-xl bg-primary-50 px-3.5 py-3 text-primary-900 dark:bg-primary-500/10 dark:text-primary-100'

const SECCIONES: { id: Seccion; titulo: string; icono: string }[] = [
  { id: 'antes', titulo: 'Antes de empezar', icono: 'ph:list-checks-bold' },
  { id: 'impresora', titulo: 'Impresora de tickets', icono: 'ph:printer-bold' },
  { id: 'cajon', titulo: 'Cajón de dinero', icono: 'ph:vault-bold' },
  { id: 'lector', titulo: 'Lector de código de barras', icono: 'ph:barcode-bold' },
  { id: 'problemas', titulo: 'Si algo no funciona', icono: 'ph:lifebuoy-bold' },
]

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="fixed inset-0 z-60 flex justify-end bg-gray-900/50 backdrop-blur-sm" @click.self="emit('close')">
      <aside
        class="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="devices-guide-title"
        data-testid="devices-guide"
      >
        <header class="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-700">
          <div>
            <h2 id="devices-guide-title" class="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Icon name="ph:question-bold" class="h-5 w-5 text-primary-600" />
              Guía para conectar tus dispositivos
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Paso a paso, sin instalar programas raros. Hazlo una vez en cada computadora de caja.</p>
          </div>
          <button type="button" class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Cerrar guía" @click="emit('close')">
            <Icon name="ph:x-bold" class="h-5 w-5" />
          </button>
        </header>

        <nav class="flex gap-1 overflow-x-auto border-b border-gray-100 px-4 py-2 dark:border-gray-700" aria-label="Temas de la guía">
          <button
            v-for="s in SECCIONES"
            :key="s.id"
            type="button"
            class="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            :class="abierta === s.id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
            :aria-pressed="abierta === s.id"
            @click="abierta = s.id"
          >
            <Icon :name="s.icono" class="h-4 w-4" />
            {{ s.titulo }}
          </button>
        </nav>

        <div class="guide min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <!-- ANTES DE EMPEZAR -->
          <section v-if="abierta === 'antes'">
            <h3>Qué necesitas</h3>
            <ul>
              <li><strong>Google Chrome o Microsoft Edge</strong> actualizados. Otros navegadores no pueden hablar directo con la impresora.</li>
              <li><strong>Impresora térmica de tickets</strong> de 58 u 80 mm con cable USB (las comunes en tiendas: Epson, Star y marcas genéricas).</li>
              <li><strong>Cajón de dinero</strong> (opcional) con su cable tipo teléfono. Se conecta a la impresora, no a la computadora.</li>
              <li><strong>Lector de código de barras</strong> USB (opcional). No necesita nada más.</li>
            </ul>
            <div :class="TIP">
              <Icon name="ph:lightbulb-bold" class="h-5 w-5 shrink-0" />
              <p>Lo que configures aquí se guarda <strong>en esta computadora</strong>. Si tienes dos cajas, repite la guía en cada una.</p>
            </div>
            <div :class="TIP">
              <Icon name="ph:printer-bold" class="h-5 w-5 shrink-0" />
              <p>¿No tienes impresora térmica? Elige <strong>Navegador</strong> en «Impresora»: los tickets saldrán por cualquier impresora normal con el diálogo de imprimir de siempre.</p>
            </div>
          </section>

          <!-- IMPRESORA -->
          <section v-else-if="abierta === 'impresora'">
            <h3>Conectar la impresora de tickets</h3>
            <ol>
              <li>Conecta la impresora a la corriente y a la computadora con su cable USB. Enciéndela y verifica que tenga papel (la cara brillante del rollo hacia el cabezal).</li>
              <li>En esta pantalla, en <strong>Impresora</strong>, elige <strong>Térmica USB</strong>.</li>
              <li>Pulsa <strong>Emparejar</strong>. Aparece una ventanita del navegador con los aparatos conectados: elige tu impresora (suele decir la marca o «Printer») y pulsa <strong>Conectar</strong>.</li>
              <li>Escribe un nombre para esta caja (por ejemplo, «Caja 1») y pulsa <strong>Guardar</strong> en la barra de abajo.</li>
              <li>Pulsa <strong>Imprimir prueba</strong>. Debe salir un ticket que dice «IMPRESIÓN DE PRUEBA».</li>
              <li>Si quieres que el ticket salga solo al cobrar, activa <strong>Imprimir el ticket automáticamente</strong> en «Al cobrar» y guarda.</li>
            </ol>
            <div :class="TIP">
              <Icon name="ph:text-aa-bold" class="h-5 w-5 shrink-0" />
              <p>¿Los acentos o la «ñ» salen como símbolos raros? Ve a <strong>Configuración › Ticket</strong>, cambia el <strong>juego de caracteres</strong> y vuelve a imprimir la prueba.</p>
            </div>
          </section>

          <!-- CAJÓN -->
          <section v-else-if="abierta === 'cajon'">
            <h3>Conectar el cajón de dinero</h3>
            <ol>
              <li>Conecta el cable del cajón (parece de teléfono) en la entrada de la <strong>impresora</strong> que dice «DK», «Drawer» o tiene el dibujo de un cajón. <strong>No</strong> va a la computadora.</li>
              <li>Primero deja funcionando la impresora (sección anterior): el cajón abre a través de ella.</li>
              <li>En <strong>Cajón de dinero</strong> deja <strong>Pin 2</strong> (funciona en la mayoría) y pulsa <strong>Probar cajón</strong>.</li>
              <li>¿No abrió? Cambia a <strong>Pin 5</strong>, guarda y vuelve a probar.</li>
              <li>Para que abra solo al cobrar en efectivo, activa <strong>Abrir el cajón en cobros con efectivo</strong> y guarda.</li>
            </ol>
            <div :class="TIP">
              <Icon name="ph:shield-check-bold" class="h-5 w-5 shrink-0" />
              <p>Cada vez que el cajón se abre sin una venta queda registrado quién lo abrió, cuándo y desde qué caja. Gerencia lo ve en el detalle del turno.</p>
            </div>
          </section>

          <!-- LECTOR -->
          <section v-else-if="abierta === 'lector'">
            <h3>Conectar el lector de código de barras</h3>
            <ol>
              <li>Conéctalo a un puerto USB. No se instala nada: la computadora lo trata como un teclado.</li>
              <li>Para comprobarlo, abre el <strong>Bloc de notas</strong> y escanea cualquier producto: deben aparecer los números del código y el cursor debe <strong>bajar de línea</strong> solo.</li>
              <li>En el <strong>Punto de venta</strong>, deja el cursor en el campo «Escanea un código…» (ya está ahí al entrar) y escanea: el producto se agrega al carrito.</li>
            </ol>
            <div :class="TIP">
              <Icon name="ph:keyboard-bold" class="h-5 w-5 shrink-0" />
              <p>Si los números aparecen pero el cursor <strong>no baja de línea</strong>, el lector no está enviando «Enter» al final. Busca en su manual la hoja de códigos de configuración y escanea el que dice <strong>«Add Enter / CR suffix»</strong>.</p>
            </div>
            <div :class="TIP">
              <Icon name="ph:hash-bold" class="h-5 w-5 shrink-0" />
              <p>Para cobrar varias piezas iguales: escribe la cantidad, un asterisco y escanea. Por ejemplo <strong>3*</strong> y luego el código.</p>
            </div>
          </section>

          <!-- PROBLEMAS -->
          <section v-else>
            <h3>Si algo no funciona</h3>
            <dl class="faq">
              <dt>La impresora no aparece en la lista al pulsar «Emparejar».</dt>
              <dd>Revisa que esté encendida y con el cable USB bien conectado; prueba otro puerto. Usa Chrome o Edge. Si aun así no aparece, Windows la tiene ocupada con su propio programa: pide a soporte que le cambie el controlador a «WinUSB» (es un cambio de 2 minutos). Mientras tanto, puedes trabajar con impresión por <strong>Navegador</strong>.</dd>
              <dt>Aparece, pero «Imprimir prueba» no saca nada.</dt>
              <dd>Apaga y enciende la impresora, revisa el papel y la tapa cerrada. Pulsa «Olvidar», vuelve a «Emparejar» y guarda.</dd>
              <dt>Sale papel en blanco.</dt>
              <dd>El rollo está al revés: la cara brillante (la que se raya con la uña) debe ir hacia el cabezal.</dd>
              <dt>El ticket sale cortado o muy angosto.</dt>
              <dd>En <strong>Configuración › Ticket</strong> elige el ancho de tu papel: 58 mm o 80 mm.</dd>
              <dt>El cajón no abre.</dt>
              <dd>El cable debe ir a la impresora, no a la computadora. Prueba con el otro pin (Pin 2 / Pin 5). Sin impresora térmica, el cajón no puede abrirse desde el sistema.</dd>
              <dt>Cambié de computadora o de navegador y ya no imprime.</dt>
              <dd>La configuración vive en cada computadora: repite «Emparejar» y «Guardar» en la nueva.</dd>
            </dl>
            <div :class="TIP">
              <Icon name="ph:lifebuoy-bold" class="h-5 w-5 shrink-0" />
              <p>Si llamas a soporte, ten a la mano la marca y el modelo de la impresora (vienen en una etiqueta debajo) y qué mensaje aparece en pantalla.</p>
            </div>
          </section>
        </div>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.guide h3 { font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem; }
.guide ul, .guide ol { margin: 0 0 1rem; padding-left: 1.25rem; display: grid; gap: 0.55rem; }
.guide ul { list-style: disc; }
.guide ol { list-style: decimal; }
.guide ol li::marker { font-weight: 700; color: var(--color-primary-600); }
.guide .faq dt { font-weight: 600; margin-top: 0.9rem; color: inherit; }
.guide .faq dt:first-child { margin-top: 0; }
.guide .faq dd { margin: 0.25rem 0 0; }
</style>
