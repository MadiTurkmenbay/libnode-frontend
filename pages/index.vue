<script setup lang="ts">
import { Library, RefreshCw, Loader2 } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'
import type { BookDto, CursorPagedResult } from '~/types'

useHead({
  title: 'LibNode — Каталог ранобэ',
  meta: [
    { name: 'description', content: 'Читайте лучшие ранобэ онлайн. Огромный каталог лёгких новелл с удобной навигацией.' },
  ],
})

const books = ref<BookDto[]>([])
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)
const isLoadingMore = ref(false)
const loadTrigger = ref<HTMLElement | null>(null)

// Начальная загрузка (SSR-совместимая)
const { pending, error, refresh } = await useApiFetch<CursorPagedResult<BookDto>>(
  '/api/books?limit=20',
  {
    onResponse({ response }) {
      if (response._data) {
        books.value = response._data.items
        nextCursor.value = response._data.nextCursor
        hasMore.value = response._data.hasMore
      }
    },
  },
)

// Подгрузка следующей страницы
async function loadMore() {
  if (!hasMore.value || isLoadingMore.value || !nextCursor.value) return

  isLoadingMore.value = true

  try {
    const data = await executeApiRequest<CursorPagedResult<BookDto>>(
      `/api/books?cursor=${nextCursor.value}&limit=20`,
      {
        key: `catalog:${nextCursor.value}`,
      },
    )

    if (!data) {
      return
    }

    books.value.push(...data.items)
    nextCursor.value = data.nextCursor
    hasMore.value = data.hasMore
  }
  catch (err) {
    console.error('Ошибка загрузки книг:', err)
  }
  finally {
    isLoadingMore.value = false
  }
}

// Авто-подгрузка при скролле вниз (Intersection Observer)
useIntersectionObserver(
  loadTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      loadMore()
    }
  },
  { rootMargin: '200px' },
)
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Main -->
    <main class="container py-4 px-3 md:py-8 md:px-8">
      <!-- Заголовок каталога -->
      <div class="mb-6 md:mb-8">
        <h2 class="text-2xl md:text-3xl font-bold tracking-tight">Каталог</h2>
        <p class="mt-1 text-sm md:text-base text-muted-foreground">
          <template v-if="books.length > 0">
            Показано {{ books.length }} {{ books.length === 1 ? 'произведение' : 'произведений' }}
          </template>
          <template v-else-if="!pending">
            Каталог пуст
          </template>
        </p>
      </div>

      <!-- Загрузка (начальная) -->
      <div v-if="pending" class="flex items-center justify-center py-32">
        <RefreshCw class="h-8 w-8 animate-spin text-primary" />
      </div>

      <!-- Ошибка -->
      <div
        v-else-if="error"
        class="mx-auto max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
      >
        <p class="text-lg font-semibold text-destructive">Ошибка загрузки</p>
        <p class="mt-2 text-sm text-muted-foreground">
          Не удалось подключиться к серверу. Проверьте, что бэкенд запущен.
        </p>
        <button
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          @click="refresh()"
        >
          <RefreshCw class="h-4 w-4" />
          Попробовать снова
        </button>
      </div>

      <!-- Сетка карточек -->
      <div
        v-else-if="books.length > 0"
      >
        <div
          class="grid grid-cols-2 gap-2 sm:gap-4 md:gap-4 lg:gap-4 xl:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          <div
            v-for="(book, index) in books"
            :key="book.id"
            class="animate-fade-in"
            :style="{ animationDelay: `${Math.min(index, 19) * 50}ms` }"
          >
            <BookCard :book="book" :show-description="false" />
          </div>
        </div>

        <!-- Триггер бесконечного скролла -->
        <div
          ref="loadTrigger"
          class="mt-8 flex items-center justify-center py-4"
        >
          <div v-if="isLoadingMore" class="flex items-center gap-2 text-muted-foreground">
            <Loader2 class="h-5 w-5 animate-spin" />
            <span class="text-sm">Загрузка...</span>
          </div>
          <p v-else-if="!hasMore && books.length > 0" class="text-sm text-muted-foreground/60">
            Вы просмотрели все произведения
          </p>
        </div>
      </div>

      <!-- Пустое состояние -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-32 text-center"
      >
        <Library class="h-16 w-16 text-muted-foreground/30" />
        <p class="mt-4 text-lg font-medium text-muted-foreground">
          Пока ничего нет
        </p>
        <p class="mt-1 text-sm text-muted-foreground/70">
          Добавьте первую книгу через API
        </p>
      </div>
    </main>
  </div>
</template>
