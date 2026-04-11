<script setup lang="ts">
import { ArrowLeft, Loader2, BookOpen } from 'lucide-vue-next'
import type { CollectionDetailDto } from '~/types'
// Assuming BookCard.vue is at ~/components/BookCard.vue
import BookCard from '~/components/BookCard.vue'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const collectionId = route.params.id as string

const { data: collection, pending, error } = useApiFetch<CollectionDetailDto>(`/api/collections/${collectionId}`)

useHead({
  title: computed(() => collection.value ? `${collection.value.name} — Мои закладки` : 'Закладки — LibNode'),
})

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
  <div class="container py-8 max-w-7xl">
    <div class="mb-8">
      <NuxtLink
        to="/profile/collections"
        class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mb-4"
      >
        <ArrowLeft class="h-4 w-4" />
        Назад к закладкам
      </NuxtLink>
      
      <div v-if="pending" class="h-8 w-64 bg-muted animate-pulse rounded-md mb-2"></div>
      <h1 v-else-if="collection" class="text-3xl font-bold tracking-tight">{{ collection.name }}</h1>
      
      <div v-if="pending" class="h-6 w-32 bg-muted animate-pulse rounded-md mt-2"></div>
      <p v-else-if="collection" class="text-sm text-muted-foreground mt-2">
        Создано: {{ formatDate(collection.createdAt) }} • Книг: {{ collection.bookCount }}
      </p>
    </div>

    <!-- Загрузка / Ошибка -->
    <div v-if="pending" class="py-20 text-center text-muted-foreground">
      <Loader2 class="h-8 w-8 animate-spin mx-auto" />
    </div>
    <div v-else-if="error || !collection" class="py-20 text-center text-destructive">
      Папка с закладками не найдена или у вас нет к ней доступа.
    </div>

    <!-- Контент: Сетка книг -->
    <div v-else>
      <div v-if="collection.books && collection.books.length > 0" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-8">
        <BookCard 
          v-for="book in collection.books" 
          :key="book.id" 
          :book="book" 
        />
      </div>
      
      <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center mt-8">
        <BookOpen class="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 class="mt-4 text-lg font-semibold">В папке пусто</h3>
        <p class="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
          Вы еще не добавили ни одной книги в эту закладку.
        </p>
        <NuxtLink to="/">
          <button class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Перейти в каталог
          </button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
