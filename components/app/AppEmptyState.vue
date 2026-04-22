<script setup lang="ts">
defineProps<{
  icon: string
  badge?: string
  title: string
  description: string
}>()
</script>

<template>
  <div class="surface-panel flex flex-col items-center justify-center px-6 py-20 text-center md:px-10 md:py-24">
    <UBadge v-if="badge" color="primary" variant="subtle" class="mb-5 rounded-full px-3 py-1">
      {{ badge }}
    </UBadge>
    <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-inset ring-white/10">
      <UIcon :name="icon" class="h-8 w-8 text-slate-400" />
    </div>
    <h2 class="text-xl font-semibold text-white">
      {{ title }}
    </h2>
    <p class="mt-3 max-w-md text-sm leading-6 text-slate-400">
      {{ description }}
    </p>
    <div v-if="$slots.actions" class="mt-6">
      <slot name="actions" />
    </div>
  </div>
</template>
