<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { RemissionPaper } from '~/types/settings'

/**
 * Muestra el documento de la nota de remisión como una hoja, a escala.
 *
 * La hoja se maqueta a su tamaño real (Carta 8.5 in = 816 px a 96 dpi) y se
 * reduce con `transform` al ancho disponible: así la proporción de papel se
 * conserva en cualquier pantalla. `sandbox="allow-same-origin"` SIN
 * `allow-scripts`: el documento jamás ejecuta nada, pero conserva el origen de
 * la app para cargar sus tipografías locales (con origen opaco, el navegador
 * bloquearía las fuentes y la vista previa no se parecería al papel).
 */
const props = defineProps<{
  html: string
  paper: RemissionPaper
}>()

const PAGE_W = 816
const pageH = computed(() => (props.paper === 'A4' ? 1123 : 1056))

const host = ref<HTMLElement | null>(null)
const scale = ref(0.6)
let observer: ResizeObserver | null = null

function update() {
  const w = host.value?.clientWidth ?? PAGE_W
  scale.value = Math.min(1, w / PAGE_W)
}

onMounted(() => {
  update()
  if (host.value && 'ResizeObserver' in window) {
    observer = new ResizeObserver(update)
    observer.observe(host.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="host" class="w-full">
    <div class="mx-auto bg-white shadow-lg" :style="{ width: `${PAGE_W * scale}px`, height: `${pageH * scale}px` }">
      <iframe
        :srcdoc="html"
        sandbox="allow-same-origin"
        title="Vista de la nota de remisión"
        class="block origin-top-left border-0 bg-white"
        :style="{ width: `${PAGE_W}px`, height: `${pageH}px`, transform: `scale(${scale})` }"
      />
    </div>
  </div>
</template>
