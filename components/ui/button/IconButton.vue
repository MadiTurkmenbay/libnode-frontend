<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <button
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
      'h-9 w-9',
      props.class,
    )"
  >
    <slot />
  </button>
</template>
