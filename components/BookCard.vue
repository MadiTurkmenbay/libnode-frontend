<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
import type { BookDto } from '~/types'
import { bookTypeLabels } from '~/lib/enums'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

withDefaults(defineProps<{
  book: BookDto
  showDescription?: boolean
}>(), {
  showDescription: true,
})
</script>

<template>
  <NuxtLink :to="`/books/${book.id}`" class="block h-full">
    <Card
      class="group flex h-full flex-col overflow-hidden transition-colors duration-200 hover:border-primary/50 hover:shadow-md"
    >
      <div class="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          :alt="book.title"
          class="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-95"
          loading="lazy"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10"
        >
          <BookOpen class="h-16 w-16 text-muted-foreground/40" />
        </div>

        <Badge
          class="absolute top-2 left-2 shadow-sm"
          variant="secondary"
        >
          {{ bookTypeLabels[book.type] }}
        </Badge>

        <div
          v-if="book.chapterCount > 0"
          class="absolute bottom-2 right-2 rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-medium text-primary-foreground backdrop-blur-sm"
        >
          {{ book.chapterCount }} гл.
        </div>
      </div>

      <CardHeader class="px-2.5 pb-1 pt-2.5 sm:px-3 sm:pt-3">
        <CardTitle class="line-clamp-2 text-xs font-semibold leading-snug sm:text-sm">
          {{ book.title }}
        </CardTitle>
      </CardHeader>

      <CardContent v-if="showDescription && book.description" class="px-2.5 pb-2.5 pt-0 sm:px-3 sm:pb-3">
        <p class="line-clamp-3 text-[11px] leading-4 text-muted-foreground sm:text-xs sm:leading-5">
          {{ book.description }}
        </p>
      </CardContent>
    </Card>
  </NuxtLink>
</template>
