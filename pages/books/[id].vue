<script setup lang="ts">
import type { UseFetchOptions } from 'nuxt/app'
import { ArrowLeft, ArrowUpDown, BookOpen, BookmarkCheck, BookmarkPlus, CalendarIcon, Clock, Heart, Loader2 } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'
import type { BookCollectionStatusDto, BookDto, ChapterListDto, CursorPagedResult } from '~/types'

const route = useRoute()
const bookId = route.params.id as string
const nuxtApp = useNuxtApp()

let requestKeySeed = 0

function nextRequestKey(prefix: string) {
  requestKeySeed += 1
  return `${prefix}:${requestKeySeed}`
}

const { toast } = useToast()
const { isAuthenticated } = useAuth()

async function executeApiRequest<T>(url: string, options: UseFetchOptions<T> = {}) {
  const { data, error, execute } = await nuxtApp.runWithContext(() => useApiFetch<T>(url, {
    immediate: false,
    watch: false,
    key: options.key ?? nextRequestKey(String(options.method ?? 'GET')),
    ...options,
  }))

  await execute()

  if (error.value) {
    throw error.value
  }

  return data.value ?? null
}

const { data: book, pending: bookPending, error: bookError } = await useApiFetch<BookDto>(
  `/api/books/${bookId}`,
)

const chapters = ref<ChapterListDto[]>([])
const nextCursor = ref<number | null>(null)
const hasMore = ref(false)
const sortDesc = ref(true)
const chaptersPending = ref(true)
const isLoadingMore = ref(false)
const chaptersTrigger = ref<HTMLElement | null>(null)

const { execute: fetchInitialChapters } = await useApiFetch<CursorPagedResult<ChapterListDto, number>>(
  () => `/api/books/${bookId}/chapters?limit=50&sortDesc=${sortDesc.value}`,
  {
    immediate: false,
    onResponse({ response }) {
      if (response._data) {
        chapters.value = response._data.items
        nextCursor.value = response._data.nextCursor
        hasMore.value = response._data.hasMore
      }

      chaptersPending.value = false
    },
  },
)

await fetchInitialChapters()

async function loadMoreChapters() {
  if (!hasMore.value || isLoadingMore.value || nextCursor.value === null) {
    return
  }

  isLoadingMore.value = true

  try {
    const data = await executeApiRequest<CursorPagedResult<ChapterListDto, number>>(
      `/api/books/${bookId}/chapters?cursor=${nextCursor.value}&limit=50&sortDesc=${sortDesc.value}`,
      {
        key: `book:${bookId}:chapters:${nextCursor.value}:${sortDesc.value}`,
      },
    )

    if (!data) {
      return
    }

    chapters.value.push(...data.items)
    nextCursor.value = data.nextCursor
    hasMore.value = data.hasMore
  }
  catch (error) {
    console.error('Ошибка загрузки глав:', error)
  }
  finally {
    isLoadingMore.value = false
  }
}

useIntersectionObserver(
  chaptersTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      loadMoreChapters()
    }
  },
  { rootMargin: '200px' },
)

async function toggleSort() {
  sortDesc.value = !sortDesc.value
  chapters.value = []
  nextCursor.value = null
  hasMore.value = false
  chaptersPending.value = true
  await fetchInitialChapters()
}

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

watchEffect(() => {
  if (book.value) {
    useHead({
      title: `${book.value.title} — LibNode`,
    })
  }
})

const isModalOpen = ref(false)
const currentCollectionStatus = ref<BookCollectionStatusDto | null>(null)

const { data: fetchedCollectionStatus, execute: fetchCollectionStatus } = await useApiFetch<BookCollectionStatusDto>(
  `/api/books/${bookId}/collection-status`,
  {
    immediate: false,
    watch: false,
  },
)

watch(
  fetchedCollectionStatus,
  (status) => {
    currentCollectionStatus.value = status ?? null
  },
  { immediate: true },
)

if (isAuthenticated.value) {
  await fetchCollectionStatus()
}

watch(
  () => isAuthenticated.value,
  async (authenticated) => {
    if (!authenticated) {
      currentCollectionStatus.value = null
      return
    }

    await fetchCollectionStatus()
  },
)

const currentCollectionId = computed(() => currentCollectionStatus.value?.collectionId ?? null)
const currentCollectionName = computed(() => currentCollectionStatus.value?.collectionName ?? null)

function openCollectionsModal() {
  if (!isAuthenticated.value) {
    return
  }

  isModalOpen.value = true
}

function handleCollectionChanged(status: BookCollectionStatusDto | null) {
  currentCollectionStatus.value = status
}

async function likeChapter(event: Event, chapter: ChapterListDto) {
  event.preventDefault()

  if (!isAuthenticated.value || chapter.isLikedByCurrentUser) {
    return
  }

  chapter.isLikedByCurrentUser = true
  chapter.likesCount += 1

  try {
    await executeApiRequest(`/api/chapters/${chapter.id}/like`, {
      method: 'POST',
    })
    toast('Глава понравилась!')
  }
  catch {
    chapter.isLikedByCurrentUser = false
    chapter.likesCount -= 1
    toast({ variant: 'destructive', title: 'Не удалось поставить лайк' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div class="container flex h-14 items-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft class="h-4 w-4" />
          Назад в каталог
        </NuxtLink>
      </div>
    </header>

    <main class="container py-8">
      <div v-if="bookPending" class="animate-pulse py-20 text-center text-muted-foreground">
        Загрузка информации о книге...
      </div>
      <div v-else-if="bookError || !book" class="py-20 text-center text-destructive">
        Ошибка: книга не найдена
      </div>

      <div v-else class="flex flex-col gap-6 md:flex-row md:gap-8 lg:gap-12">
        <div class="mx-auto w-full max-w-[300px] shrink-0 space-y-4 md:w-[300px] md:max-w-none">
          <div class="relative aspect-[3/4] overflow-hidden rounded-xl border bg-secondary shadow-lg">
            <img
              v-if="book.coverUrl"
              :src="book.coverUrl"
              :alt="book.title"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10"
            >
              <BookOpen class="h-20 w-20 text-muted-foreground/40" />
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <div>
            <h1 class="text-2xl font-bold tracking-tight sm:text-4xl md:text-3xl">{{ book.title }}</h1>

            <div class="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span class="inline-flex items-center gap-1.5">
                <CalendarIcon class="h-4 w-4" />
                Создана: {{ formatDate(book.createdAt) }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <Clock class="h-4 w-4" />
                Обновлена: {{ formatDate(book.updatedAt) }}
              </span>
            </div>

            <div v-if="isAuthenticated" class="mt-6">
              <button
                class="inline-flex h-10 w-full items-center justify-center rounded-lg px-8 text-sm font-medium shadow transition-colors sm:w-auto"
                :class="currentCollectionId
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'"
                @click="openCollectionsModal"
              >
                <BookmarkCheck v-if="currentCollectionId" class="mr-2 h-5 w-5" />
                <BookmarkPlus v-else class="mr-2 h-5 w-5" />
                {{ currentCollectionName ?? 'В закладки' }}
              </button>
            </div>
          </div>

          <div v-if="book.description" class="prose prose-invert max-w-none">
            <h3 class="mb-2 text-xl font-semibold">Описание</h3>
            <p class="leading-relaxed text-muted-foreground">{{ book.description }}</p>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between border-b pb-2">
              <h3 class="text-xl font-semibold tracking-tight md:text-2xl">Главы</h3>
              <div class="flex items-center gap-3">
                <button
                  class="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  :disabled="chaptersPending"
                  @click="toggleSort"
                >
                  <ArrowUpDown class="h-3.5 w-3.5" />
                  {{ sortDesc ? 'Сначала новые' : 'Сначала старые' }}
                </button>
                <span class="rounded-full bg-secondary px-3 py-1 text-sm text-muted-foreground">
                  Всего: {{ book.chapterCount }}
                </span>
              </div>
            </div>

            <div v-if="chaptersPending" class="animate-pulse py-8 text-center text-sm text-muted-foreground">
              Загрузка списка глав...
            </div>

            <div v-else-if="chapters.length > 0">
              <div class="grid gap-2">
                <NuxtLink
                  v-for="chapter in chapters"
                  :key="chapter.id"
                  :to="`/books/${bookId}/read/${chapter.id}`"
                  class="group flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-md md:p-4"
                >
                  <div class="flex flex-1 items-center gap-4">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary text-sm font-medium text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {{ chapter.chapterNumber }}
                    </div>
                    <span class="line-clamp-1 font-medium transition-colors group-hover:text-primary">
                      {{ chapter.title }}
                    </span>
                  </div>

                  <div class="mt-2 flex shrink-0 items-center gap-4 sm:mt-0">
                    <span class="hidden text-xs text-muted-foreground sm:block">
                      {{ formatDate(chapter.createdAt) }}
                    </span>
                    <button
                      class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary"
                      :class="chapter.isLikedByCurrentUser ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'"
                      :disabled="!isAuthenticated || chapter.isLikedByCurrentUser"
                      :title="!isAuthenticated ? 'Войдите, чтобы поставить лайк' : chapter.isLikedByCurrentUser ? 'Вам уже понравилось' : 'Лайкнуть'"
                      @click="(event) => likeChapter(event, chapter)"
                    >
                      <Heart
                        class="h-4 w-4 transition-transform group-hover/btn:scale-110"
                        :class="{ 'fill-current': chapter.isLikedByCurrentUser }"
                      />
                      <span class="text-sm font-medium">{{ chapter.likesCount }}</span>
                    </button>
                  </div>
                </NuxtLink>
              </div>

              <div
                ref="chaptersTrigger"
                class="mt-6 flex items-center justify-center py-4"
              >
                <div v-if="isLoadingMore" class="flex items-center gap-2 text-muted-foreground">
                  <Loader2 class="h-5 w-5 animate-spin" />
                  <span class="text-sm">Загрузка глав...</span>
                </div>
                <p v-else-if="!hasMore && chapters.length > 0" class="text-sm text-muted-foreground/60">
                  Все главы загружены
                </p>
              </div>
            </div>

            <div v-else class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <BookOpen class="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>В этой книге пока нет ни одной главы.</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <CollectionModal
      v-if="book"
      :book-id="book.id"
      :collection-status="currentCollectionStatus"
      v-model:open="isModalOpen"
      @collection-changed="handleCollectionChanged"
    />
  </div>
</template>
