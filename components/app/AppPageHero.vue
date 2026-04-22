<script setup lang="ts">
defineProps<{
  icon?: string
  eyebrow: string
  title: string
  description: string
  meta?: string
}>()
</script>

<template>
  <section class="page-hero">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-4">
        <div class="eyebrow">
          <UIcon v-if="icon" :name="icon" class="h-4 w-4" />
          <span>{{ eyebrow }}</span>
        </div>
        <div class="space-y-3">
          <h1 class="section-title">
            {{ title }}
          </h1>
          <p class="section-copy">
            {{ description }}
          </p>
        </div>
      </div>

      <p v-if="meta" class="text-sm text-slate-400 lg:text-right">
        {{ meta }}
      </p>
    </div>
  </section>
</template>
