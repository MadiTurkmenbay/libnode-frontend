<script setup lang="ts">
import { Loader2, Library, Sparkles, Play, BookOpen } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'
import BookGrid from '~/components/books/BookGrid.vue'
import BookGridSkeleton from '~/components/books/BookGridSkeleton.vue'
import AppState from '~/components/AppState.vue'
import type { BookDto, ContinueReadingDto, CursorPagedResult } from '~/types'

const { isAuthenticated } = useAuth()
const { mine: fetchRecs } = useRecommendations()
const recommended = ref<BookDto[]>([])
async function fetchRecommendations() {
  if (!isAuthenticated.value) return
  recommended.value = (await fetchRecs(12).catch(() => [])) ?? []
}
const continueReading = ref<ContinueReadingDto[]>([])
async function fetchContinueReading() {
  if (!isAuthenticated.value) return
  try {
    continueReading.value = (await executeApiRequest<ContinueReadingDto[]>('/api/me/continue-reading', {
      key: 'continue-reading',
    })) ?? []
  }
  catch {
    continueReading.value = []
  }
}
onMounted(() => {
  fetchContinueReading()
  fetchRecommendations()
})

useSeo({
  title: 'LibNode — ранобэ и новеллы онлайн',
  description: 'Читайте лучшие ранобэ и лёгкие новеллы онлайн. Каталог, закладки, прогресс чтения, команды переводчиков.',
  type: 'website',
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
    <!-- Hero band -->
    <section class="ambient-glow border-b border-border/60" aria-labelledby="home-title">
      <div class="app-container py-10 md:py-14">
        <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span class="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles class="h-3.5 w-3.5" />
              Свежие обновления
            </span>
            <h1 id="home-title" class="text-3xl font-bold tracking-tight md:text-5xl">
              Читайте <span class="text-gradient">лучшие новеллы</span>
            </h1>
            <p class="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Новые поступления и последние обновления каталога — с удобной читалкой,
              закладками и цитатами.
            </p>
          </div>

          <div class="shrink-0 text-sm text-muted-foreground">
            {{ resultsSummary }}
          </div>
        </div>
      </div>
    </section>

    <ClientOnly>
      <section v-if="isAuthenticated && continueReading.length" class="app-container pt-6">
        <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Play class="h-5 w-5 text-primary" /> Продолжить чтение
        </h2>
        <div class="flex gap-3 overflow-x-auto pb-2">
          <NuxtLink
            v-for="item in continueReading"
            :key="item.bookId"
            :to="`/books/${item.bookId}/read/${item.lastChapterId}`"
            class="group flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/50"
          >
            <div class="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
              <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.bookTitle" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
                <BookOpen class="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <span class="inline-flex items-center gap-1 text-[11px] font-medium text-white">
                  <Play class="h-3 w-3" /> Глава {{ item.lastChapterNumber }}
                </span>
              </div>
            </div>
            <div class="p-2">
              <p class="line-clamp-2 text-xs font-semibold leading-snug transition-colors group-hover:text-primary">{{ item.bookTitle }}</p>
            </div>
          </NuxtLink>
        </div>
      </section>
    </ClientOnly>

    <ClientOnly>
      <section v-if="isAuthenticated && recommended.length" class="app-container pt-6">
        <BookRow title="Рекомендуем вам" :books="recommended" />
      </section>
    </ClientOnly>

    <main class="app-container py-6 md:py-8">

      <BookGridSkeleton v-if="pending && books.length === 0" compact />

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
