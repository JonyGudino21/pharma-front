<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHelp } from '~/composables/useHelp'
import { HELP_GUIDES, getGuide, guideForRoute, sectionForRoute, searchHelp, type HelpGuide } from '~/utils/help'
import HelpInline from '~/components/help/HelpInline.vue'

/**
 * PANEL DE AYUDA — uno para toda la app, abierto desde el botón "Ayuda" de la
 * barra superior (o desde cualquier pantalla con `openHelp(guía, sección)`).
 *
 * Abre la guía de la PANTALLA ACTUAL; si no hay una específica, muestra el
 * índice de guías. El buscador recorre todas las guías (sin acentos ni
 * mayúsculas). Lateral en laptop, pantalla completa en celular.
 */
const { open, guideId, sectionId, closeHelp } = useHelp()
const route = useRoute()

const guide = ref<HelpGuide | null>(null)
const section = ref<string | null>(null)
const query = ref('')
const closeBtn = ref<HTMLButtonElement | null>(null)
const body = ref<HTMLElement | null>(null)

watch(open, async (abierto) => {
  if (!abierto) return
  query.value = ''
  const explicita = getGuide(guideId.value)
  guide.value = explicita ?? guideForRoute(route.path)
  // Sección pedida explícitamente, o la de esta subpantalla, o la primera.
  const pedida = sectionId.value ?? (explicita ? null : sectionForRoute(route.path))
  section.value = pedida && guide.value?.sections.some((s) => s.id === pedida)
    ? pedida
    : (guide.value?.sections[0]?.id ?? null)
  await nextTick()
  closeBtn.value?.focus()
})

const current = computed(() => guide.value?.sections.find((s) => s.id === section.value) ?? null)
const hits = computed(() => (query.value.trim().length >= 2 ? searchHelp(query.value).slice(0, 12) : []))

function pick(g: HelpGuide, s?: string) {
  guide.value = g
  section.value = s ?? g.sections[0]?.id ?? null
  query.value = ''
  body.value?.scrollTo({ top: 0 })
}

function back() {
  guide.value = null
  section.value = null
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    closeHelp()
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="fixed inset-0 z-70 flex justify-end bg-gray-900/50 backdrop-blur-sm" @click.self="closeHelp" @keydown="onKey">
      <aside
        class="flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-xl dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        data-testid="help-panel"
      >
        <header class="border-b border-gray-100 px-4 pb-3 pt-4 sm:px-6 sm:pt-5 dark:border-gray-700">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <button v-if="guide" type="button" class="mb-1 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400" @click="back">
                <Icon name="ph:caret-left-bold" class="h-3.5 w-3.5" /> Todas las guías
              </button>
              <h2 id="help-title" class="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Icon :name="guide?.icon ?? 'ph:question-bold'" class="h-5 w-5 shrink-0 text-primary-600" />
                <span class="truncate">{{ guide?.title ?? 'Ayuda' }}</span>
              </h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ guide?.summary ?? 'Guías paso a paso de cada parte del sistema.' }}</p>
            </div>
            <button ref="closeBtn" type="button" class="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Cerrar ayuda" @click="closeHelp">
              <Icon name="ph:x-bold" class="h-5 w-5" />
            </button>
          </div>

          <div class="relative mt-3">
            <Icon name="ph:magnifying-glass-bold" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="query"
              type="search"
              class="input-base pl-9"
              placeholder="Busca tu duda: devolución, corte de caja, lote…"
              aria-label="Buscar en la ayuda"
              data-testid="help-search"
            />
          </div>
        </header>

        <!-- Resultados de búsqueda -->
        <div v-if="query.trim().length >= 2" class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <p v-if="!hits.length" class="py-10 text-center text-sm text-gray-500">
            No encontramos «{{ query }}». Prueba con otra palabra, por ejemplo «cobrar», «ticket» o «crédito».
          </p>
          <ul v-else class="space-y-2">
            <li v-for="h in hits" :key="`${h.guide.id}-${h.section.id}`">
              <button type="button" class="flex w-full items-start gap-3 rounded-xl border border-gray-100 p-3 text-left hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700 dark:hover:bg-primary-500/10" @click="pick(h.guide, h.section.id)">
                <Icon :name="h.section.icon" class="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                <span class="min-w-0">
                  <span class="block font-medium text-gray-900 dark:text-white">{{ h.section.title }}</span>
                  <span class="block text-xs text-gray-500">{{ h.guide.title }}</span>
                </span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Índice de guías -->
        <div v-else-if="!guide" class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <ul class="grid gap-2 sm:grid-cols-2">
            <li v-for="g in HELP_GUIDES" :key="g.id">
              <button type="button" class="flex h-full w-full items-start gap-3 rounded-xl border border-gray-100 p-3 text-left hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700 dark:hover:bg-primary-500/10" @click="pick(g)">
                <Icon :name="g.icon" class="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                <span class="min-w-0">
                  <span class="block font-medium text-gray-900 dark:text-white">{{ g.title }}</span>
                  <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{{ g.summary }}</span>
                </span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Guía -->
        <template v-else>
          <nav class="flex gap-1 overflow-x-auto border-b border-gray-100 px-3 py-2 sm:px-4 dark:border-gray-700" aria-label="Secciones de la guía">
            <button
              v-for="s in guide.sections"
              :key="s.id"
              type="button"
              class="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              :class="section === s.id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
              :aria-pressed="section === s.id"
              @click="section = s.id; body?.scrollTo({ top: 0 })"
            >
              <Icon :name="s.icon" class="h-4 w-4" />
              {{ s.title }}
            </button>
          </nav>

          <div ref="body" class="min-h-0 flex-1 overflow-y-auto px-4 py-5 text-sm leading-relaxed text-gray-700 sm:px-6 dark:text-gray-300">
            <section v-if="current">
              <h3 class="mb-3 text-base font-bold text-gray-900 dark:text-white">{{ current.title }}</h3>
              <template v-for="(b, i) in current.blocks" :key="i">
                <p v-if="b.type === 'p'" class="mb-3"><HelpInline :text="b.text" /></p>
                <ol v-else-if="b.type === 'steps'" class="mb-4 grid list-decimal gap-2 pl-5 marker:font-bold marker:text-primary-600">
                  <li v-for="(it, j) in b.items" :key="j"><HelpInline :text="it" /></li>
                </ol>
                <ul v-else-if="b.type === 'list'" class="mb-4 grid list-disc gap-2 pl-5">
                  <li v-for="(it, j) in b.items" :key="j"><HelpInline :text="it" /></li>
                </ul>
                <div v-else-if="b.type === 'tip'" class="mt-3 flex gap-2.5 rounded-xl bg-primary-50 px-3.5 py-3 text-primary-900 dark:bg-primary-500/10 dark:text-primary-100">
                  <Icon :name="b.icon ?? 'ph:lightbulb-bold'" class="mt-0.5 h-5 w-5 shrink-0" />
                  <p><HelpInline :text="b.text" /></p>
                </div>
                <div v-else-if="b.type === 'warn'" class="mt-3 flex gap-2.5 rounded-xl bg-warning-50 px-3.5 py-3 text-warning-900 dark:bg-warning-500/10 dark:text-warning-200" role="note">
                  <Icon name="ph:warning-bold" class="mt-0.5 h-5 w-5 shrink-0" />
                  <p><HelpInline :text="b.text" /></p>
                </div>
                <dl v-else-if="b.type === 'faq'" class="mb-2">
                  <template v-for="(it, j) in b.items" :key="j">
                    <dt class="mt-4 font-semibold text-gray-900 first:mt-0 dark:text-white"><HelpInline :text="it.q" /></dt>
                    <dd class="mt-1"><HelpInline :text="it.a" /></dd>
                  </template>
                </dl>
              </template>
            </section>
          </div>
        </template>
      </aside>
    </div>
  </Transition>
</template>
