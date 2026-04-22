<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="page-shell flex min-h-[calc(100vh-5rem)] items-center justify-center py-12">
    <div class="w-full max-w-xl">
      <UCard class="mx-auto w-full">
        <template #header>
          <div class="space-y-3 text-center">
            <div class="eyebrow mx-auto">
              <UIcon name="i-heroicons-sparkles" class="h-4 w-4" />
              <span>Account</span>
            </div>
            <div>
              <h2 class="text-3xl font-semibold text-white">
                {{ title }}
              </h2>
              <p class="mt-3 text-sm leading-6 text-slate-400">
                {{ description }}
              </p>
            </div>
          </div>
        </template>

        <slot />

        <template #footer>
          <slot name="footer" />
        </template>
      </UCard>
    </div>
  </div>
</template>
