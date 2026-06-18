<script setup lang="ts">
import { BookOpen, Star } from 'lucide-vue-next'
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
  <NuxtLink :to="`/books/${book.id}`" class="block h-full focus-visible:outline-none">
    <Card
      class="group hover-lift relative flex h-full flex-col overflow-hidden hover:border-primary/50 hover:shadow-glow focus-within:ring-2 focus-within:ring-ring"
    >
      <div class="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
        <img
          v-if="book.coverUrl || book.coverThumbUrl"
          :src="book.coverThumbUrl || book.coverUrl || undefined"
          :alt="book.title"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 via-accent/10 to-transparent"
        >
          <BookOpen class="h-16 w-16 text-muted-foreground/40 transition-transform duration-500 group-hover:scale-110" />
        </div>

        <!-- Bottom gradient for legibility / depth -->
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        ></div>

        <Badge class="absolute left-2 top-2 shadow-sm" variant="secondary">
          {{ bookTypeLabels[book.type] }}
        </Badge>

        <div
          v-if="book.averageRating"
          class="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-xs font-medium text-amber-300 shadow-sm backdrop-blur-sm"
          :title="`${book.ratingCount} оценок`"
        >
          <Star class="h-3 w-3 fill-amber-300" />{{ book.averageRating.toFixed(1) }}
        </div>

        <div
          v-if="book.chapterCount > 0"
          class="absolute bottom-2 right-2 rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-medium text-primary-foreground shadow-sm backdrop-blur-sm"
        >
          {{ book.chapterCount }} гл.
        </div>
      </div>

      <CardHeader class="px-2.5 pb-1 pt-2.5 sm:px-3 sm:pt-3">
        <CardTitle
          class="line-clamp-2 text-xs font-semibold leading-snug transition-colors group-hover:text-primary sm:text-sm"
        >
          {{ book.title }}
        </CardTitle>
      </CardHeader>

      <CardContent v-if="showDescription && book.description" class="px-2.5 pb-2.5 pt-0 sm:px-3 sm:pb-3">
        <p class="line-clamp-3 text-xs leading-4 text-muted-foreground sm:leading-5">
          {{ book.description }}
        </p>
      </CardContent>
    </Card>
  </NuxtLink>
</template>
