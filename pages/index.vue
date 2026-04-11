<script setup lang="ts">
import { Library, RefreshCw } from 'lucide-vue-next'
import type { BookDto, PagedResult } from '~/types'

useHead({
  title: 'LibNode — Каталог ранобэ',
  meta: [
    { name: 'description', content: 'Читайте лучшие ранобэ онлайн. Огромный каталог лёгких новелл с удобной навигацией.' },
  ],
})

const page = ref(1)
const pageSize = 20

const { data, pending, error, refresh } = await useApiFetch<PagedResult<BookDto>>(
  () => `/api/books?pageNumber=${page.value}&pageSize=${pageSize}`,
  {
    watch: [page],
  },
)

const books = computed(() => data.value?.items ?? [])
const totalCount = computed(() => data.value?.totalCount ?? 0)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))

function prevPage() {
  if (page.value > 1) page.value--
}

function nextPage() {
  if (page.value < totalPages.value) page.value++
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Main -->
    <main class="container py-4 px-3 md:py-8 md:px-8">
      <!-- Заголовок каталога -->
      <div class="mb-6 md:mb-8">
        <h2 class="text-2xl md:text-3xl font-bold tracking-tight">Каталог</h2>
        <p class="mt-1 text-sm md:text-base text-muted-foreground">
          <template v-if="totalCount > 0">
            Найдено {{ totalCount }} {{ totalCount === 1 ? 'произведение' : 'произведений' }}
          </template>
          <template v-else-if="!pending">
            Каталог пуст
          </template>
        </p>
      </div>

      <!-- Загрузка -->
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
        class="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        <div
          v-for="(book, index) in books"
          :key="book.id"
          class="animate-fade-in"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <BookCard :book="book" />
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

      <!-- Пагинация -->
      <div
        v-if="totalPages > 1"
        class="mt-10 flex items-center justify-center gap-4"
      >
        <button
          :disabled="page <= 1"
          class="rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          @click="prevPage"
        >
          ← Назад
        </button>

        <span class="text-sm text-muted-foreground">
          {{ page }} / {{ totalPages }}
        </span>

        <button
          :disabled="page >= totalPages"
          class="rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          @click="nextPage"
        >
          Вперёд →
        </button>
      </div>
    </main>
  </div>
</template>
