<template>
  <div class="relative flex min-h-screen flex-col bg-background">
    <NuxtLoadingIndicator color="hsl(var(--primary))" />
    <SiteHeader />
    <div class="flex-1">
      <NuxtPage />
    </div>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue'
import Toaster from '@/components/ui/toast/Toaster.vue'
</script>
