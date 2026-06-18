<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '~/composables/useTheme'

const { theme, isReady, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/60 text-muted-foreground transition-all hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    :title="theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
    aria-label="Переключить тему"
    @click="toggle"
  >
    <ClientOnly>
      <Transition name="theme-icon" mode="out-in">
        <Moon v-if="theme === 'dark'" key="moon" class="h-4 w-4" />
        <Sun v-else key="sun" class="h-4 w-4" />
      </Transition>
      <template #fallback>
        <Moon class="h-4 w-4" />
      </template>
    </ClientOnly>
    <span v-if="!isReady" class="sr-only">тема</span>
  </button>
</template>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}
.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
</style>
