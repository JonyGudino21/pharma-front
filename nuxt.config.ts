import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // APLICACIÓN DE UNA SOLA PÁGINA (SPA) — ADR-0020.
  //
  // Con SSR, el primer render de un F5 ocurría en el servidor de Nuxt, que llamaba
  // a /auth/me SIN las cookies httpOnly del navegador: 401, "no hay sesión que
  // renovar" y se borraba la sesión. Toda recarga sacaba al cajero al login. Un
  // POS detrás de login no gana nada con SSR (sin SEO; los datos se cargan en el
  // navegador), y como SPA se publica como archivos estáticos: más barato y simple
  // de instalar en la farmacia o en un CDN.
  ssr: false,

  // Apuntar al CSS global
  css: ['~/assets/css/main.css'],

  // Configuramos el plugin de Vite para Tailwind v4
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  // Ya no incluimos '@nuxtjs/tailwindcss' aquí
  modules: [
    '@pinia/nuxt',
    '@nuxt/icon',
    '@nuxtjs/color-mode'
  ],

  // ICONOS SIN INTERNET (ADR-0017). Por defecto @nuxt/icon pide cada icono a la
  // API de Iconify: sin conexión, la interfaz se quedaba sin iconos. Con la
  // colección local (@iconify-json/ph) y `scan`, los iconos usados en el código
  // viajan dentro del build.
  icon: {
    serverBundle: 'local',
    clientBundle: { scan: true },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  // ACTUALIZACIÓN DE VERSIÓN (ADR-0018).
  // Por defecto Nuxt recarga la página SOLO al detectar un build nuevo (en la
  // siguiente navegación) o un archivo faltante: a media venta, eso reinicia la
  // pantalla del cajero. En 'manual' Nuxt sólo AVISA (hooks app:manifest:update
  // y app:chunkError) y es el usuario quien decide desde AppUpdateBanner.
  experimental: {
    emitRouteChunkError: 'manual',
    // Cada cuánto consulta si hay un build nuevo. Por omisión es 1 hora: en una
    // farmacia que se actualiza de noche, 5 min deja el aviso listo al abrir.
    checkOutdatedBuildInterval: 5 * 60 * 1000,
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3005/api',
      // Sonda de conexión (ConnectivityBanner). Vacío = <origen del API>/health/ready.
      healthUrl: process.env.NUXT_PUBLIC_HEALTH_URL || '',
    }
  },

  imports: {
    dirs: ['stores'],
  },
})