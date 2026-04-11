<template>
  <div class="relative flex min-h-screen flex-col bg-background">
    <SiteHeader />
    <main class="flex-1">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue'
</script>
