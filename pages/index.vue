<script setup lang="ts">
import { Loader2, Library, RefreshCw } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'
import BookGrid from '~/components/books/BookGrid.vue'
import type {
  BookDto,
  CursorPagedResult,
} from '~/types'

useHead({
  title: 'LibNode — Главная',
  meta: [
    { name: 'description', content: 'LibNode — читайте лучшие ранобэ и лёгкие новеллы онлайн.' },
  ],
})

const PAGE_SIZE = 20

const books = ref<BookDto[]>([])
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)
const isLoadingMore = ref(false)
const loadTrigger = ref<HTMLElement | null>(null)

const catalogUrl = computed(() => `/api/books?limit=${PAGE_SIZE}`)

const { data: pageData, pending, error, execute: fetchCatalog } = await useApiFetch<CursorPagedResult<BookDto>>(
  () => catalogUrl.value,
  {
    immediate: false,
    key: 'home:catalog',
    watch: false,
  },
)

let latestRequest = 0

function applyPageData(page: CursorPagedResult<BookDto> | null) {
  books.value = page?.items ?? []
  nextCursor.value = page?.nextCursor ?? null
  hasMore.value = page?.hasMore ?? false
}

async function loadFirstPage() {
  const requestId = ++latestRequest

  if (pageData.value && books.value.length === 0 && !nextCursor.value && !hasMore.value) {
    applyPageData(pageData.value)
    return
  }

  books.value = []
  nextCursor.value = null
  hasMore.value = false
  isLoadingMore.value = false

  await fetchCatalog()

  if (requestId !== latestRequest || error.value) {
    return
  }

  applyPageData(pageData.value)
}

await loadFirstPage()

async function loadMore() {
  if (!hasMore.value || isLoadingMore.value || !nextCursor.value || pending.value) {
    return
  }

  isLoadingMore.value = true

  try {
    const data = await executeApiRequest<CursorPagedResult<BookDto>>(
      `/api/books?limit=${PAGE_SIZE}&cursor=${nextCursor.value}`,
      {
        key: `home:${nextCursor.value}`,
      },
    )

    if (!data) {
      return
    }

    books.value.push(...data.items)
    nextCursor.value = data.nextCursor
    hasMore.value = data.hasMore
  }
  catch (loadMoreError) {
    console.error('Ошибка загрузки книг:', loadMoreError)
  }
  finally {
    isLoadingMore.value = false
  }
}

useIntersectionObserver(
  loadTrigger,
  ([entry]) => {
    if (entry?.isIntersecting) {
      loadMore()
    }
  },
  { rootMargin: '200px' },
)
</script>

<template>
  <div class="min-h-screen bg-background">
    <main class="container px-3 py-4 md:px-8 md:py-8">
      <section class="mb-6 md:mb-8">
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight md:text-4xl">Новые книги</h1>
            <p class="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Новые поступления и последние обновления каталога.
            </p>
          </div>

          <div class="text-sm text-muted-foreground">
            <template v-if="books.length > 0">
              Загружено {{ books.length }} произведений
            </template>
            <template v-else-if="pending">
              Загрузка...
            </template>
            <template v-else>
              Каталог пуст
            </template>
          </div>
        </div>
      </section>

      <div v-if="pending && books.length === 0" class="flex items-center justify-center py-32">
        <RefreshCw class="h-8 w-8 animate-spin text-primary" />
      </div>

      <div
        v-else-if="error"
        class="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
      >
        <p class="text-lg font-semibold text-destructive">Ошибка загрузки</p>
        <p class="mt-2 text-sm text-muted-foreground">
          Не удалось получить данные с сервера. Проверьте, что backend запущен и доступен.
        </p>
        <Button class="mt-4" @click="loadFirstPage">
          <RefreshCw class="mr-2 h-4 w-4" />
          Повторить
        </Button>
      </div>

      <div v-else-if="books.length > 0">
        <BookGrid :books="books" compact />

        <div
          ref="loadTrigger"
          class="mt-8 flex items-center justify-center py-4"
        >
          <div v-if="isLoadingMore" class="flex items-center gap-2 text-muted-foreground">
            <Loader2 class="h-5 w-5 animate-spin" />
            <span class="text-sm">Загрузка...</span>
          </div>
          <p v-else-if="!hasMore" class="text-sm text-muted-foreground/60">
            Вы просмотрели все доступные произведения
          </p>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center rounded-3xl border border-dashed py-24 text-center"
      >
        <Library class="h-16 w-16 text-muted-foreground/30" />
        <p class="mt-4 text-lg font-medium text-foreground">
          Каталог пока пуст
        </p>
        <p class="mt-2 max-w-md text-sm text-muted-foreground/70">
          Когда книги появятся в системе, они отобразятся здесь автоматически.
        </p>
      </div>
    </main>
  </div>
</template>
