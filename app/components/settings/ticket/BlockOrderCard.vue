<script setup lang="ts">
import { ref } from 'vue'
import type { ReceiptBlock } from '~/types/receipt'
import type { TemplateForm } from '~/composables/useTicketStudio'
import SettingsCard from '~/components/settings/SettingsCard.vue'

/**
 * Contenido y ORDEN del ticket.
 *
 * Antes el orden era fijo y sólo se podían prender o apagar bloques. Ahora se
 * reordenan arrastrando o con los botones subir/bajar (la versión de teclado:
 * arrastrar no es accesible para todos). Productos y Totales tienen candado:
 * un ticket sin ellos no es un comprobante, y el servidor también lo exige.
 */
const form = defineModel<TemplateForm>({ required: true })

defineProps<{
  ordered: ReceiptBlock[]
  isRequired: (b: ReceiptBlock) => boolean
  dirty: boolean
}>()

const emit = defineEmits<{
  toggle: [block: ReceiptBlock]
  move: [block: ReceiptBlock, delta: -1 | 1]
  drop: [from: ReceiptBlock, to: ReceiptBlock]
}>()

const META: Record<ReceiptBlock, { title: string; detail: string; icon: string }> = {
  header: { title: 'Encabezado', detail: 'Logo, nombre, datos fiscales y contacto', icon: 'ph:storefront' },
  meta: { title: 'Datos de la venta', detail: 'Folio, fecha, quién atendió y cliente', icon: 'ph:identification-card' },
  items: { title: 'Productos', detail: 'Cantidad, descripción, precio e importe', icon: 'ph:pill' },
  totals: { title: 'Totales', detail: 'Subtotal, total, pagado y saldo', icon: 'ph:calculator' },
  payments: { title: 'Formas de pago', detail: 'Efectivo, tarjeta o transferencia', icon: 'ph:credit-card' },
  footer: { title: 'Pie', detail: 'Leyenda fiscal y tu mensaje', icon: 'ph:text-align-center' },
}

const HEADER_OPTIONS: { key: 'showLogo' | 'showTaxId' | 'showAddress' | 'showPhone'; label: string }[] = [
  { key: 'showLogo', label: 'Logo o cruz' },
  { key: 'showTaxId', label: 'RFC y régimen' },
  { key: 'showAddress', label: 'Domicilio' },
  { key: 'showPhone', label: 'Teléfono y correo' },
]

const on = (b: ReceiptBlock) => form.value.blocks.includes(b)
const position = (b: ReceiptBlock) => form.value.blocks.indexOf(b)

// ── Arrastrar y soltar ─────────────────────────────────────────────────────
const dragging = ref<ReceiptBlock | null>(null)
const over = ref<ReceiptBlock | null>(null)

function onDragStart(e: DragEvent, b: ReceiptBlock) {
  if (!on(b)) return
  dragging.value = b
  e.dataTransfer?.setData('text/plain', b)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragOver(e: DragEvent, b: ReceiptBlock) {
  if (!dragging.value || !on(b)) return
  e.preventDefault()
  over.value = b
}

function onDrop(b: ReceiptBlock) {
  if (dragging.value && on(b)) emit('drop', dragging.value, b)
  dragging.value = null
  over.value = null
}

function onDragEnd() {
  dragging.value = null
  over.value = null
}

</script>

<template>
  <SettingsCard
    title="Contenido del ticket"
    description="Arrastra para cambiar el orden. Apaga lo que no necesites imprimir."
    icon="ph:list-dashes-bold"
    :dirty="dirty"
  >
    <ol class="space-y-2" aria-label="Secciones del ticket en orden de impresión">
      <li
        v-for="b in ordered"
        :key="b"
        :draggable="on(b)"
        class="group rounded-xl border transition-colors"
        :class="[
          on(b)
            ? 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800'
            : 'border-dashed border-gray-200 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-900/30',
          over === b && dragging !== b ? 'border-primary-400 ring-2 ring-primary-500/20' : '',
          dragging === b ? 'opacity-50' : '',
        ]"
        @dragstart="onDragStart($event, b)"
        @dragover="onDragOver($event, b)"
        @drop.prevent="onDrop(b)"
        @dragend="onDragEnd"
      >
        <div class="flex items-center gap-3 px-3 py-2.5">
          <span
            class="flex w-5 shrink-0 justify-center"
            :class="on(b) ? 'cursor-grab text-gray-400 active:cursor-grabbing' : 'text-gray-300 dark:text-gray-600'"
            aria-hidden="true"
          >
            <Icon name="ph:dots-six-vertical-bold" class="h-4 w-4" />
          </span>

          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm tabular-nums"
            :class="on(b) ? 'bg-gray-100 font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600'"
            :aria-label="on(b) ? `Posición ${position(b) + 1}` : 'No se imprime'"
          >
            <template v-if="on(b)">{{ position(b) + 1 }}</template>
            <Icon v-else :name="META[b].icon" class="h-4 w-4" />
          </span>

          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-1.5 text-sm font-medium" :class="on(b) ? 'text-gray-900 dark:text-white' : 'text-gray-400'">
              {{ META[b].title }}
              <Icon v-if="isRequired(b)" name="ph:lock-simple-fill" class="h-3.5 w-3.5 text-gray-400" aria-label="Obligatorio" />
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ META[b].detail }}</p>
          </div>

          <div v-if="on(b)" class="flex shrink-0 items-center opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              :disabled="position(b) === 0"
              :aria-label="`Subir ${META[b].title}`"
              @click="emit('move', b, -1)"
            >
              <Icon name="ph:caret-up-bold" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              :disabled="position(b) === form.blocks.length - 1"
              :aria-label="`Bajar ${META[b].title}`"
              @click="emit('move', b, 1)"
            >
              <Icon name="ph:caret-down-bold" class="h-4 w-4" />
            </button>
          </div>

          <!-- Interruptor. Los obligatorios se muestran encendidos y bloqueados. -->
          <button
            type="button"
            role="switch"
            :aria-checked="on(b)"
            :aria-label="`Imprimir ${META[b].title}`"
            :disabled="isRequired(b)"
            class="relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed dark:focus-visible:ring-offset-gray-800"
            :class="on(b) ? (isRequired(b) ? 'bg-primary-300 dark:bg-primary-800' : 'bg-primary-600') : 'bg-gray-300 dark:bg-gray-600'"
            @click="emit('toggle', b)"
          >
            <span
              class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              :class="on(b) ? 'translate-x-5' : ''"
            />
          </button>
        </div>

        <!-- Opciones del encabezado, justo donde se entiende a qué afectan. -->
        <div
          v-if="b === 'header' && on(b)"
          class="flex flex-wrap gap-2 border-t border-gray-100 px-3 py-2.5 pl-[4.25rem] dark:border-gray-700"
        >
          <label
            v-for="opt in HEADER_OPTIONS"
            :key="opt.key"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-within:ring-2 focus-within:ring-primary-500"
            :class="
              form[opt.key]
                ? 'border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-100'
                : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
            "
          >
            <input v-model="form[opt.key]" type="checkbox" class="sr-only" />
            <Icon :name="form[opt.key] ? 'ph:check-bold' : 'ph:plus-bold'" class="h-3 w-3" />
            {{ opt.label }}
          </label>
        </div>
      </li>
    </ol>
  </SettingsCard>
</template>
