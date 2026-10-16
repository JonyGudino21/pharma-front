import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Pruebas de lógica pura (utils/ y composables sin Nuxt). No arrancan Nuxt: lo que dependa del
// navegador o de Nitro se prueba a mano o con e2e, no aquí.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '#app': fileURLToPath(new URL('./test/nuxt-app-shim.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.spec.ts'],
  },
})
