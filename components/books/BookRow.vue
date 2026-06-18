<script setup lang="ts">
import type { BookDto } from '~/types'

defineProps<{
  title: string
  books: BookDto[]
}>()
</script>

<template>
  <section v-if="books.length" class="space-y-3">
    <h2 class="text-lg font-semibold tracking-tight">{{ title }}</h2>
    <div class="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 sm:gap-4">
      <div v-for="b in books" :key="b.id" class="w-32 shrink-0 snap-start sm:w-36">
        <BookCard :book="b" :show-description="false" />
      </div>
    </div>
  </section>
</template>
