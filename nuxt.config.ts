// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  css: ['~/assets/css/globals.css'],

  app: {
    // Subtle global page/layout transitions (disabled under prefers-reduced-motion via CSS).
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'page', mode: 'out-in' },
    head: {
      // SSR defaults to dark; the inline script corrects to the saved
      // preference before first paint to avoid a flash of the wrong theme.
      htmlAttrs: { class: 'dark', lang: 'ru' },
      script: [
        {
          key: 'theme-no-flash',
          tagPosition: 'head',
          innerHTML:
            "(function(){try{var t=localStorage.getItem('libnode-theme');var d=document.documentElement;if(t==='light'){d.classList.remove('dark');}else{d.classList.add('dark');}}catch(e){}})();",
        },
      ],
    },
  },

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
      // SSR/прокси → backend. Браузер ходит на same-origin Nuxt (/api/*),
      // поэтому отдельный клиентский базовый URL больше не нужен.
      apiBase: 'http://localhost:5000',
    },
  },

  typescript: {
    strict: true,
  },
})
