<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
import type { BookDto } from '~/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'

withDefaults(defineProps<{
  book: BookDto
  showDescription?: boolean
}>(), {
  showDescription: true,
})

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <NuxtLink :to="`/books/${book.id}`">
    <Card
      class="group flex flex-col h-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
    >
      <!-- Обложка -->
      <div class="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          :alt="book.title"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10"
        >
          <BookOpen class="h-16 w-16 text-muted-foreground/40" />
        </div>

        <!-- Бейдж с кол-вом глав -->
        <div
          v-if="book.chapterCount > 0"
          class="absolute bottom-2 right-2 rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-medium text-primary-foreground backdrop-blur-sm"
        >
          {{ book.chapterCount }} гл.
        </div>
      </div>

      <CardHeader class="px-3 pt-2.5 pb-1 md:px-3.5 md:pt-3 md:pb-1">
        <CardTitle class="line-clamp-2 text-sm md:text-base leading-snug">
          {{ book.title }}
        </CardTitle>
      </CardHeader>

      <CardContent v-if="showDescription && book.description" class="p-3 pt-0 md:px-3.5 md:pt-0 md:pb-3">
        <p class="line-clamp-3 text-xs md:text-sm text-muted-foreground">
          {{ book.description }}
        </p>
      </CardContent>

      <CardFooter class="mt-auto px-3 pb-2.5 pt-2 md:px-3.5 md:pb-3 md:pt-2 text-[10px] md:text-xs text-muted-foreground/70">
        {{ formatDate(book.createdAt) }}
      </CardFooter>
    </Card>
  </NuxtLink>
</template>
