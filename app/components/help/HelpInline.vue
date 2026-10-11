<script setup lang="ts">
import { computed } from 'vue'
import { parseInline } from '~/utils/help'

/**
 * Pinta una línea de ayuda con **negritas** y `teclas`, SIN v-html: el texto
 * nunca se interpreta como HTML.
 */
const props = defineProps<{ text: string }>()
const partes = computed(() => parseInline(props.text))
</script>

<template>
  <template v-for="(p, i) in partes" :key="i">
    <strong v-if="p.kind === 'bold'" class="font-semibold text-gray-900 dark:text-white">{{ p.text }}</strong>
    <kbd v-else-if="p.kind === 'kbd'" class="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-[0.8em] text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">{{ p.text }}</kbd>
    <template v-else>{{ p.text }}</template>
  </template>
</template>
