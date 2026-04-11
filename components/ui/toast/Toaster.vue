<script setup lang="ts">
import { Toaster as Sonner } from 'vue-sonner'
import 'vue-sonner/style.css' // Import styles
</script>

<template>
  <ClientOnly>
    <Sonner position="bottom-right" rich-colors />
  </ClientOnly>
</template>
