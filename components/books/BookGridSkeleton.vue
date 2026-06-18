<script setup lang="ts">
withDefaults(defineProps<{ count?: number; compact?: boolean }>(), {
  count: 12,
  compact: false,
})
</script>

<template>
  <div
    class="grid gap-3 sm:gap-4"
    :class="compact
      ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'"
  >
    <div v-for="i in count" :key="i" class="flex flex-col gap-2">
      <div class="skeleton aspect-[3/4] w-full rounded-xl"></div>
      <div class="skeleton h-3 w-11/12 rounded"></div>
      <div class="skeleton h-3 w-2/3 rounded"></div>
    </div>
  </div>
</template>
