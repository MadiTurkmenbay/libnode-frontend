<script setup lang="ts">
import { AuthModal } from '@/components/auth'

const isOpen = ref(true)

watch(isOpen, (open) => {
  if (!open) {
    navigateTo('/')
  }
})
</script>

<template>
  <div />
  <AuthModal v-model:open="isOpen" initial-tab="login" />
</template>
