import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

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

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Literata:opsz,wght@7..72,500;7..72,700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3005/api',
    }
  },

  imports: {
    dirs: ['stores'],
  },
})