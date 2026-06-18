<script setup lang="ts">
import { ArrowLeft, ArrowUpDown, BookOpen, BookmarkCheck, BookmarkPlus, CalendarIcon, Check, Clock, Heart, Loader2, List, MessageSquare, Share2, Star, UsersRound } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'
import type { BookCollectionStatusDto, BookDetailDto, BookDto, BookTeamDto, ChapterListDto, CursorPagedResult } from '~/types'
import { bookTypeLabels, originalStatusLabels, translationStatusLabels } from '~/lib/enums'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import AppState from '~/components/AppState.vue'
import CommentSection from '~/components/comments/CommentSection.vue'

const route = useRoute()
const bookId = route.params.id as string

// Похожие книги (рекомендации) — подгружаем на клиенте.
const { similar: fetchSimilar } = useRecommendations()
const similarBooks = ref<BookDto[]>([])
onMounted(async () => {
  similarBooks.value = (await fetchSimilar(bookId, 10).catch(() => [])) ?? []
})

const { toast } = useToast()
const { isAuthenticated } = useAuth()

async function shareBook() {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({ title: book.value?.title ?? 'LibNode', url })
    } else {
      await navigator.clipboard.writeText(url)
      toast('Ссылка скопирована')
    }
  } catch {
    // user cancelled or clipboard unavailable
  }
}

const { data: book, pending: bookPending, error: bookError } = await useApiFetch<BookDetailDto>(
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
    const b = book.value
    useSeo({
      title: b.title,
      description: b.description ?? `Читать ${b.title} онлайн на LibNode. ${b.chapterCount} глав.`,
      image: b.coverUrl ?? b.coverThumbUrl ?? undefined,
      url: `/books/${b.id}`,
      type: 'book',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: b.title,
        description: b.description ?? '',
        numberOfPages: b.chapterCount,
        ...(b.coverUrl ? { image: b.coverUrl } : {}),
        ...(b.averageRating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: b.averageRating, ratingCount: b.ratingCount } } : {}),
      },
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
const firstChapter = computed(() => {
  if (!chapters.value.length) {
    return null
  }

  return chapters.value.reduce((first, chapter) => {
    if (!first || chapter.chapterNumber < first.chapterNumber) {
      return chapter
    }

    return first
  }, null as ChapterListDto | null)
})

const readingButtonLabel = computed(() => {
  if (book.value?.userProgress) {
    return `Продолжить чтение (Глава ${book.value.userProgress.chapterNumber})`
  }

  return 'Начать чтение'
})

const readingButtonTarget = computed(() => {
  if (!book.value) {
    return null
  }

  if (book.value.userProgress) {
    return `/books/${book.value.id}/read/${book.value.userProgress.chapterId}`
  }

  return firstChapter.value
    ? `/books/${book.value.id}/read/${firstChapter.value.id}`
    : null
})

const activeTab = ref<'chapters' | 'comments' | 'ratings'>('chapters')

// Точный набор прочитанных глав (поддерживает пропуски и непоследовательное чтение).
const readChapterIds = ref<Set<string>>(new Set())
function isChapterRead(chapterId: string) {
  return readChapterIds.value.has(chapterId)
}

async function fetchReadChapters() {
  if (!isAuthenticated.value) return
  try {
    const ids = await executeApiRequest<string[]>(`/api/books/${bookId}/read-chapters`, {
      key: `book:${bookId}:read-chapters`,
    })
    readChapterIds.value = new Set(ids ?? [])
  }
  catch {
    // Индикатор «прочитано» не критичен — тихо игнорируем.
  }
}

const bookTeam = ref<BookTeamDto | null>(null)
async function fetchBookTeam() {
  try {
    bookTeam.value = (await executeApiRequest<BookTeamDto>(`/api/books/${bookId}/team`, {
      key: `book-team:${bookId}`,
    })) ?? null
  }
  catch {
    bookTeam.value = null
  }
}

onMounted(() => {
  fetchReadChapters()
  fetchBookTeam()
})

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
      <div class="app-container flex h-14 items-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft class="h-4 w-4" />
          Назад в каталог
        </NuxtLink>
      </div>
    </header>

    <main class="app-container py-6 md:py-8">
      <AppState
        v-if="bookPending"
        variant="loading"
        class="py-16"
        loading-text="Загрузка информации о книге..."
      />

      <AppState
        v-else-if="bookError || !book"
        variant="error"
        title="Книга не найдена"
        description="Возможно, она была удалена или ссылка устарела."
        class="py-16"
      >
        <template #actions>
          <Button as-child variant="outline">
            <NuxtLink to="/catalog">
              Вернуться в каталог
            </NuxtLink>
          </Button>
        </template>
      </AppState>

      <div v-else class="relative flex flex-col gap-6 md:flex-row md:gap-8 lg:gap-12">
        <!-- Blurred cover backdrop (premium hero depth) -->
        <div
          v-if="book.coverUrl"
          class="pointer-events-none absolute inset-x-0 -top-6 -z-10 h-72 overflow-hidden md:-top-8"
          aria-hidden="true"
        >
          <img :src="book.coverUrl" alt="" class="h-full w-full scale-125 object-cover opacity-20 blur-2xl saturate-150" />
          <div class="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background"></div>
        </div>

        <div class="mx-auto w-full max-w-72 shrink-0 space-y-4 md:w-72 md:max-w-none">
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

            <Badge
              class="absolute top-2 left-2 shadow-sm"
              variant="secondary"
            >
              {{ bookTypeLabels[book.type] }}
            </Badge>
          </div>

          <!-- Мета под обложкой: статусы, даты, теги, категории -->
          <div class="space-y-3 text-left">
            <NuxtLink
              v-if="bookTeam"
              :to="`/teams/${bookTeam.teamId}`"
              class="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <UsersRound class="h-3.5 w-3.5" />
              Переводит: {{ bookTeam.teamName }}
            </NuxtLink>

            <div class="flex flex-wrap gap-2">
              <Badge variant="outline">Тип: {{ bookTypeLabels[book.type] }}</Badge>
              <Badge variant="outline">Оригинал: {{ originalStatusLabels[book.originalStatus] }}</Badge>
              <Badge variant="outline">Перевод: {{ translationStatusLabels[book.translationStatus] }}</Badge>
            </div>

            <div class="space-y-1 text-xs text-muted-foreground">
              <p class="inline-flex items-center gap-1.5">
                <CalendarIcon class="h-3.5 w-3.5" /> Создана: {{ formatDate(book.createdAt) }}
              </p>
              <p class="inline-flex items-center gap-1.5">
                <Clock class="h-3.5 w-3.5" /> Обновлена: {{ formatDate(book.updatedAt) }}
              </p>
            </div>

            <div v-if="book.tags.length" class="flex flex-wrap gap-1.5">
              <NuxtLink v-for="tag in book.tags" :key="tag.id" :to="`/tags/${tag.slug}`">
                <Badge
                  variant="secondary"
                  class="cursor-pointer text-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {{ tag.name }}
                </Badge>
              </NuxtLink>
            </div>

            <div v-if="book.categories.length" class="flex flex-wrap gap-1.5">
              <NuxtLink v-for="category in book.categories" :key="category.id" :to="`/categories/${category.slug}`">
                <Badge
                  variant="secondary"
                  class="cursor-pointer text-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {{ category.name }}
                </Badge>
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <div>
            <h1 class="text-2xl font-bold tracking-tight sm:text-4xl md:text-3xl">{{ book.title }}</h1>

            <div class="mt-6 flex flex-wrap gap-3">
              <NuxtLink
                v-if="readingButtonTarget"
                :to="readingButtonTarget"
                class="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 sm:w-auto"
              >
                {{ readingButtonLabel }}
              </NuxtLink>

              <button
                v-if="isAuthenticated"
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

              <ClientOnly>
                <ShelfControl :book-id="bookId" />
              </ClientOnly>

              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                title="Поделиться"
                aria-label="Поделиться"
                @click="shareBook"
              >
                <Share2 class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div v-if="book.description" class="prose prose-invert max-w-none">
            <h2 class="mb-2 text-xl font-semibold">Описание</h2>
            <p class="leading-relaxed text-muted-foreground">{{ book.description }}</p>
          </div>

          <!-- Tabs: главы / комментарии -->
          <div class="flex items-center gap-1 border-b border-border">
            <button
              type="button"
              class="-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
              :class="activeTab === 'chapters' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
              @click="activeTab = 'chapters'"
            >
              <List class="h-4 w-4" /> Главы
              <span class="text-xs text-muted-foreground">{{ book.chapterCount }}</span>
            </button>
            <button
              type="button"
              class="-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
              :class="activeTab === 'comments' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
              @click="activeTab = 'comments'"
            >
              <MessageSquare class="h-4 w-4" /> Комментарии
            </button>
            <button
              type="button"
              class="-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
              :class="activeTab === 'ratings' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
              @click="activeTab = 'ratings'"
            >
              <Star class="h-4 w-4" /> Оценки
            </button>
          </div>

          <section v-show="activeTab === 'chapters'" class="space-y-4" aria-labelledby="book-chapters-title">
            <div class="flex items-center justify-between">
              <span class="rounded-full bg-secondary px-3 py-1 text-sm text-muted-foreground">
                Всего: {{ book.chapterCount }}
              </span>
              <button
                class="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                :disabled="chaptersPending"
                @click="toggleSort"
              >
                <ArrowUpDown class="h-3.5 w-3.5" />
                {{ sortDesc ? 'Сначала новые' : 'Сначала старые' }}
              </button>
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
                    <div
                      class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded text-sm font-medium transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                      :class="isChapterRead(chapter.id)
                        ? 'bg-success/15 text-success'
                        : 'bg-secondary text-secondary-foreground'"
                    >
                      {{ chapter.chapterNumber }}
                      <span
                        v-if="isChapterRead(chapter.id)"
                        class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-card"
                        title="Прочитано"
                      >
                        <Check class="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <span
                      class="line-clamp-1 font-medium transition-colors group-hover:text-primary"
                      :class="isChapterRead(chapter.id) ? 'text-muted-foreground' : ''"
                    >
                      {{ chapter.title }}
                    </span>
                    <span
                      v-if="!chapter.isPublished"
                      class="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-500"
                    >Черновик</span>
                  </div>

                  <div class="mt-2 flex shrink-0 items-center gap-4 sm:mt-0">
                    <span class="hidden text-xs text-muted-foreground sm:block">
                      {{ formatDate(chapter.createdAt) }}
                    </span>
                    <button
                      class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary"
                      :class="chapter.isLikedByCurrentUser ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'"
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

            <AppState
              v-else
              variant="empty"
              badge="Нет глав"
              title="В этой книге пока нет глав"
              description="Когда главы появятся, они отобразятся здесь."
              class="border-dashed py-8"
            >
              <template #icon>
                <BookOpen class="h-8 w-8 text-muted-foreground/50" />
              </template>
            </AppState>
          </section>

          <section v-show="activeTab === 'comments'">
            <ClientOnly>
              <CommentSection :book-id="book.id" title="Комментарии к тайтлу" />
            </ClientOnly>
          </section>

          <section v-show="activeTab === 'ratings'">
            <ClientOnly>
              <BookRatings :book-id="bookId" />
            </ClientOnly>
          </section>
        </div>
      </div>

      <div v-if="similarBooks.length" class="mt-10">
        <BookRow title="Похожее" :books="similarBooks" />
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
