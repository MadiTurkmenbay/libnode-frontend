<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="mx-auto max-w-xl rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-8 text-center shadow-[0_20px_80px_-50px_rgba(244,63,94,0.5)] backdrop-blur-xl">
    <p class="text-lg font-semibold text-rose-200">
      {{ title }}
    </p>
    <p class="mt-3 text-sm leading-6 text-rose-100/75">
      {{ description }}
    </p>
    <div v-if="$slots.actions" class="mt-5">
      <slot name="actions" />
    </div>
  </div>
</template>
