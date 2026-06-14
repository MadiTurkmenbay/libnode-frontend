<script setup lang="ts">
import type { BookDto } from '~/types'
import BookCard from '~/components/BookCard.vue'

defineProps<{
  books: BookDto[]
  compact?: boolean
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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
