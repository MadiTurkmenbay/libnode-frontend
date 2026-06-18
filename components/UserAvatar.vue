<script setup lang="ts">
/**
 * Переиспользуемый аватар пользователя: img если есть URL, иначе initials-плейсхолдер.
 * Размеры: xs(6), sm(7), md(9), lg(12), xl(16) — Tailwind h/w classes.
 */
const props = withDefaults(defineProps<{
  username: string
  avatarUrl?: string | null
  avatarThumbUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md',
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs': return 'h-6 w-6 text-[10px]'
    case 'sm': return 'h-7 w-7 text-xs'
    case 'lg': return 'h-12 w-12 text-base'
    case 'xl': return 'h-16 w-16 text-xl'
    case 'md':
    default: return 'h-9 w-9 text-sm'
  }
})

const initial = computed(() => props.username?.charAt(0).toUpperCase() || '?')
const imgSrc = computed(() => props.avatarThumbUrl || props.avatarUrl || null)
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary ring-1 ring-inset ring-primary/20"
    :class="sizeClass"
  >
    <img v-if="imgSrc" :src="imgSrc" :alt="username" loading="lazy" class="h-full w-full object-cover" />
    <template v-else>{{ initial }}</template>
  </div>
</template>
