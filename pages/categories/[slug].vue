<script setup lang="ts">
import { FolderTree, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import BookGrid from '~/components/books/BookGrid.vue'
import { useTaxonomyBrowse } from '~/composables/useTaxonomyBrowse'

const route = useRoute()
const slug = route.params.slug as string

const { books, hasMore, pending, name, load, resolveName } = useTaxonomyBrowse('categories', slug)
await resolveName()
await load(true)
useHead({ title: () => `Категория: ${name.value} — LibNode` })
</script>

<template>
  <div class="app-container py-6 md:py-10">
    <div class="mb-6 flex items-center gap-3">
      <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FolderTree class="h-6 w-6" />
      </span>
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{{ name }}</h1>
        <p class="text-sm text-muted-foreground">Книги в категории</p>
      </div>
    </div>

    <div v-if="pending && !books.length" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
    <div v-else-if="!books.length" class="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
      Нет книг в этой категории.
    </div>
    <template v-else>
      <BookGrid :books="books" compact />
      <div v-if="hasMore" class="mt-6 flex justify-center">
        <Button variant="outline" :disabled="pending" @click="load(false)">Показать ещё</Button>
      </div>
    </template>
  </div>
</template>
