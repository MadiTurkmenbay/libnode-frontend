<script setup lang="ts">
import { FolderHeart, Plus, ArrowRight, Loader2 } from 'lucide-vue-next'
import type { CollectionDto } from '~/types'

definePageMeta({
  middleware: ['auth']
})

useHead({
  title: 'Мои закладки — LibNode',
})

const { data: collections, pending } = useApiFetch<CollectionDto[]>('/api/collections')

function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="container py-8 max-w-5xl">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Мои закладки</h1>
        <p class="text-muted-foreground mt-2">Управляйте вашими закладками и подборками книг</p>
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-20 text-muted-foreground">
      <Loader2 class="h-8 w-8 animate-spin" />
    </div>

    <div v-else-if="collections && collections.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="collection in collections"
        :key="collection.id"
        :to="`/profile/collections/${collection.id}`"
        class="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
      >
        <div class="mb-4">
          <div class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <FolderHeart class="h-5 w-5" />
          </div>
          <h3 class="text-xl font-semibold tracking-tight">{{ collection.name }}</h3>
          <p class="text-sm text-muted-foreground mt-1">
            Создан: {{ formatDate(collection.createdAt) }}
          </p>
        </div>
        
        <div class="flex items-center justify-between border-t pt-4">
          <span class="text-sm font-medium">
            {{ collection.bookCount }} книг(и)
          </span>
          <ArrowRight class="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1 duration-200" />
        </div>
      </NuxtLink>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
      <FolderHeart class="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h3 class="mt-4 text-lg font-semibold">Нет закладок</h3>
      <p class="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
        У вас пока нет сохранённых закладок. Перейдите на страницу любой книги и сохраните её.
      </p>
      <NuxtLink to="/">
        <button class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Перейти в каталог
        </button>
      </NuxtLink>
    </div>
  </div>
</template>
