<script setup lang="ts">
import type { BookDto } from '~/types'
import BookCard from '~/components/BookCard.vue'

defineProps<{
  books: BookDto[]
  compact?: boolean
}>()
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(145px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-4">
    <div
      v-for="(book, index) in books"
      :key="book.id"
      class="animate-fade-in"
      :style="{ animationDelay: `${Math.min(index, 15) * 45}ms` }"
    >
      <BookCard :book="book" :show-description="!compact" />
    </div>
  </div>
</template>
