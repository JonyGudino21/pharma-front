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

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    }
  },

  imports: {
    dirs: ['stores'],
  },
})