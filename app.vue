<template>
  <div class="relative flex min-h-screen flex-col bg-background">
    <a href="#main-content" class="skip-link">Перейти к содержимому</a>
    <NuxtLoadingIndicator color="hsl(var(--primary))" />
    <!-- Reader and admin routes render their own chrome, so the global
         header is hidden there to avoid a stacked double-header. -->
    <SiteHeader v-if="!isChromelessRoute" />
    <div id="main-content" tabindex="-1" class="flex-1 outline-none">
      <NuxtPage />
    </div>
    <AppFooter v-if="!isChromelessRoute" />
    <ClientOnly>
      <CommandPalette />
    </ClientOnly>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import Toaster from '@/components/ui/toast/Toaster.vue'

const route = useRoute()
const isChromelessRoute = computed(() => /\/read\//.test(route.path) || route.path.startsWith('/admin'))
</script>
