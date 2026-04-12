// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  css: ['~/assets/css/globals.css'],

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@pinia/nuxt'
  ],

  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:5000',
      // В Docker: переопределяется через NUXT_PUBLIC_API_BASE_CLIENT
      apiBaseClient: '',
    },
  },

  typescript: {
    strict: true,
  },
})
