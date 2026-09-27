<script setup lang="ts">
import { computed } from 'vue'
import type { ThermalReceipt } from '~/utils/encode-receipt'

/**
 * Vista previa FIEL de la impresora térmica.
 *
 * Dibuja exactamente las líneas que `encodeReceipt` convierte en bytes, en una
 * rejilla monoespaciada del ancho real del rollo (32 o 48 columnas). Si aquí un
 * nombre se corta, en el papel también; si aquí falta la tilde, en el papel
 * también. Los renglones recortados se marcan en el margen.
 */
const props = defineProps<{ receipt: ThermalReceipt }>()

/** Marcas de la regla superior, cada 8 columnas. */
const ticks = computed(() => {
  const out: number[] = []
  for (let c = 8; c < props.receipt.columns; c += 8) out.push(c)
  return out
})
</script>

<template>
  <div
    class="thermal"
    :style="{ '--cols': receipt.columns }"
    role="img"
    :aria-label="`Vista previa del ticket térmico, ${receipt.columns} columnas`"
  >
    <div class="thermal__ruler" aria-hidden="true">
      <span v-for="t in ticks" :key="t" class="thermal__tick" :style="{ left: `calc(${t} * 1ch)` }">{{ t }}</span>
      <span class="thermal__tick thermal__tick--end" :style="{ left: `calc(${receipt.columns} * 1ch)` }">{{ receipt.columns }}</span>
    </div>

    <div class="thermal__paper">
      <div
        v-for="(line, i) in receipt.lines"
        :key="i"
        class="thermal__line"
        :class="[
          `thermal__line--${line.align}`,
          { 'is-bold': line.bold, 'is-double': line.size === 2, 'is-rule': line.rule, 'is-cut': line.truncated },
        ]"
      >
        <span class="thermal__text">{{ line.text || ' ' }}</span>
        <span v-if="line.truncated" class="thermal__flag" title="Este renglón no cabe y se recorta">✂</span>
      </div>
      <div class="thermal__tear" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
/*
 * La unidad de todo es `ch`: el ancho de un carácter de la fuente
 * monoespaciada. `--cols` caracteres = el ancho imprimible del rollo.
 */
.thermal {
  --paper: #fcfcfa;
  --ink: #111418;
  --ink-soft: #5b6470;
  font-family: var(--font-ticket);
  font-size: 12.5px;
  line-height: 1.5;
  width: calc(var(--cols) * 1ch + 2.5rem);
  max-width: 100%;
}

.thermal__ruler {
  position: relative;
  height: 1.25rem;
  margin: 0 1.25rem;
  width: calc(var(--cols) * 1ch);
  border-bottom: 1px solid rgb(255 255 255 / 0.18);
  font-size: 9px;
  color: rgb(255 255 255 / 0.45);
}

.thermal__tick {
  position: absolute;
  bottom: 2px;
  transform: translateX(-50%);
}

.thermal__tick::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -3px;
  width: 1px;
  height: 4px;
  background: currentColor;
}

.thermal__tick--end {
  color: rgb(147 197 253 / 0.85);
}

.thermal__paper {
  position: relative;
  background: var(--paper);
  color: var(--ink);
  padding: 1rem 1.25rem 1.75rem;
  box-shadow:
    0 1px 0 rgb(0 0 0 / 0.04),
    0 24px 48px -28px rgb(0 0 0 / 0.55);
  /* Ligero degradado: el papel térmico sale un poco más oscuro del cabezal. */
  background-image: linear-gradient(to bottom, rgb(0 0 0 / 0.035), transparent 3rem);
}

.thermal__line {
  position: relative;
  white-space: pre;
  width: calc(var(--cols) * 1ch);
  min-height: 1.5em;
}

.thermal__line--center { text-align: center; }
.thermal__line--right { text-align: right; }
.is-bold { font-weight: 700; }

/* Doble ancho y alto, como `GS ! 0x11` en la impresora. */
.is-double .thermal__text {
  display: inline-block;
  font-size: 2em;
  line-height: 1.2;
}

.is-rule {
  color: var(--ink-soft);
  letter-spacing: 0;
}

.is-cut {
  background: repeating-linear-gradient(
    -45deg,
    rgb(239 68 68 / 0.07) 0 6px,
    transparent 6px 12px
  );
}

.thermal__flag {
  position: absolute;
  right: -1.1rem;
  top: 0;
  color: #dc2626;
  font-size: 11px;
}

.thermal__tear {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -8px;
  height: 8px;
  background:
    linear-gradient(135deg, var(--paper) 50%, transparent 50%) 0 0 / 8px 8px repeat-x,
    linear-gradient(225deg, var(--paper) 50%, transparent 50%) 0 0 / 8px 8px repeat-x;
}

@media (prefers-reduced-motion: no-preference) {
  .thermal__paper {
    animation: feed 420ms cubic-bezier(0.2, 0.7, 0.2, 1);
  }
}

/* El papel "sale" del cabezal al cambiar de plantilla o de ancho. */
@keyframes feed {
  from { transform: translateY(-12px); opacity: 0.4; }
  to { transform: none; opacity: 1; }
}
</style>
