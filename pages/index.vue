<script setup lang="ts">
import { Loader2, Library, RefreshCw } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'
import BookGrid from '~/components/books/BookGrid.vue'
import AppState from '~/components/AppState.vue'
import type { BookDto, CursorPagedResult } from '~/types'

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

const resultsSummary = computed(() => {
  if (books.value.length > 0) {
    return `Загружено ${books.value.length} произведений`
  }
  if (pending.value) {
    return 'Загрузка...'
  }
  return 'Каталог пуст'
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <main class="container px-3 py-4 md:px-8 md:py-8">
      <section class="mb-6 md:mb-8" aria-labelledby="home-title">
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 id="home-title" class="text-3xl font-bold tracking-tight md:text-4xl">Новые книги</h1>
            <p class="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Новые поступления и последние обновления каталога.
            </p>
          </div>

          <div class="text-sm text-muted-foreground">
            {{ resultsSummary }}
          </div>
        </div>
      </section>

      <AppState
        v-if="pending && books.length === 0"
        variant="loading"
        class="py-16"
        loading-text="Загружаем каталог..."
      />

      <AppState
        v-else-if="error"
        variant="error"
        title="Ошибка загрузки"
        description="Не удалось получить данные с сервера. Проверьте, что backend запущен и доступен."
        @retry="loadFirstPage"
      />

      <template v-else-if="books.length > 0">
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
      </template>

      <AppState
        v-else
        variant="empty"
        badge="Каталог пуст"
        title="Каталог пока пуст"
        description="Когда книги появятся в системе, они отобразятся здесь автоматически."
        class="border-dashed py-16"
      >
        <template #icon>
          <Library class="h-16 w-16 text-muted-foreground/30" />
        </template>
      </AppState>
    </main>
  </div>
</template>
