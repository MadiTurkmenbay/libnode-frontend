<script setup lang="ts">
import { ArrowLeft, BookOpen, Clock, CalendarIcon } from 'lucide-vue-next'
import type { BookDto, ChapterListDto, PagedResult } from '~/types'

const route = useRoute()
const bookId = route.params.id as string

// Загружаем данные о книге
const { data: book, pending: bookPending, error: bookError } = await useApiFetch<BookDto>(
  `/api/books/${bookId}`,
)

// Загружаем список глав
const page = ref(1)
const { data: chaptersResult, pending: chaptersPending } = await useApiFetch<PagedResult<ChapterListDto>>(
  () => `/api/books/${bookId}/chapters?pageNumber=${page.value}&pageSize=50`,
  { watch: [page] }
)

const chapters = computed(() => chaptersResult.value?.items ?? [])

function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Установка title страницы после загрузки
watchEffect(() => {
  if (book.value) {
    useHead({
      title: `${book.value.title} — LibNode`,
    })
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header/Навигация -->
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
      <!-- Загрузка / Ошибка для книги -->
      <div v-if="bookPending" class="py-20 text-center text-muted-foreground animate-pulse">
        Загрузка информации о книге...
      </div>
      <div v-else-if="bookError || !book" class="py-20 text-center text-destructive">
        Ошибка: Книга не найдена
      </div>

      <!-- Контент книги -->
      <div v-else class="grid gap-8 md:grid-cols-[300px_1fr] lg:gap-12">
        
        <!-- Левая колонка: Обложка -->
        <div class="space-y-4">
          <div class="overflow-hidden rounded-xl border bg-secondary relative aspect-[3/4] shadow-lg">
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

        <!-- Правая колонка: Инфо и Главы -->
        <div class="space-y-8">
          <div>
            <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{{ book.title }}</h1>
            
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
          </div>

          <div v-if="book.description" class="prose prose-invert max-w-none">
            <h3 class="text-xl font-semibold mb-2">Описание</h3>
            <p class="text-muted-foreground leading-relaxed">{{ book.description }}</p>
          </div>

          <!-- Раздел Главы -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b pb-2">
              <h3 class="text-2xl font-semibold tracking-tight">Главы</h3>
              <span class="text-sm rounded-full bg-secondary px-3 py-1 text-muted-foreground">
                Всего: {{ book.chapterCount }}
              </span>
            </div>

            <div v-if="chaptersPending" class="py-8 text-center text-sm text-muted-foreground animate-pulse">
              Загрузка списка глав...
            </div>
            
            <div v-else-if="chapters.length > 0" class="grid gap-2">
              <NuxtLink
                v-for="chapter in chapters"
                :key="chapter.id"
                :to="`/chapters/${chapter.id}`"
                class="group flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary text-sm font-medium text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {{ chapter.chapterNumber }}
                  </div>
                  <span class="font-medium group-hover:text-primary transition-colors">
                    {{ chapter.title }}
                  </span>
                </div>
                <span class="hidden text-xs text-muted-foreground sm:block">
                  {{ formatDate(chapter.createdAt) }}
                </span>
              </NuxtLink>
            </div>
            
            <div v-else class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <BookOpen class="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>В этой книге пока нет ни одной главы.</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>
