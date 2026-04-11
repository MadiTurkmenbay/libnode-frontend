<template>
  <div class="relative flex min-h-screen flex-col bg-background">
    <SiteHeader />
    <main class="flex-1">
      <NuxtPage />
    </main>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue'
import Toaster from '@/components/ui/toast/Toaster.vue'
</script>
