<script setup lang="ts">
import { ArrowRight, FolderHeart, Loader2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

definePageMeta({
  middleware: ['auth'],
})

useHead({
  title: 'Мои закладки — LibNode',
})

const collectionsStore = useCollectionsStore()
const { collections, isPending: pending } = storeToRefs(collectionsStore)

await collectionsStore.fetchCollections()

function formatDate(dateString: string): string {
  if (!dateString) {
    return ''
  }

  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="container max-w-5xl py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Мои закладки</h1>
        <p class="mt-2 text-muted-foreground">Управляйте вашими закладками и подборками книг</p>
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-20 text-muted-foreground">
      <Loader2 class="h-8 w-8 animate-spin" />
    </div>

    <div v-else-if="collections.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="collection in collections"
        :key="collection.id"
        :to="`/profile/collections/${collection.id}`"
        class="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
      >
        <div class="mb-4">
          <div class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <FolderHeart class="h-5 w-5" />
          </div>
          <h3 class="text-xl font-semibold tracking-tight">{{ collection.name }}</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            Создана: {{ formatDate(collection.createdAt) }}
          </p>
        </div>

        <div class="flex items-center justify-between border-t pt-4">
          <span class="text-sm font-medium">
            {{ collection.bookCount }} книг(и)
          </span>
          <ArrowRight class="h-4 w-4 translate-x-0 text-muted-foreground transition-colors duration-200 group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </NuxtLink>
    </div>

    <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
      <FolderHeart class="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h3 class="mt-4 text-lg font-semibold">Нет закладок</h3>
      <p class="mb-4 mt-2 max-w-sm text-sm text-muted-foreground">
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
