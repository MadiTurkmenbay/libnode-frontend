<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, Menu } from 'lucide-vue-next'
import type { ChapterDetailDto, ChapterListDto, PagedResult } from '~/types'

const route = useRoute()
const bookId = route.params.bookId as string
const chapterId = route.params.chapterId as string

// Получение самой главы
const { data: chapter, pending: chapterPending, error: chapterError } = await useApiFetch<ChapterDetailDto>(
  `/api/chapters/${chapterId}`
)

// Получение списка всех глав для навигации
// В идеале это делает бэкенд (вернув ссылки на соседние главы), 
// но для MVP запросим все главы книги и найдем нужные на клиенте.
const { data: chaptersResult } = await useApiFetch<PagedResult<ChapterListDto>>(
  `/api/books/${bookId}/chapters?pageNumber=1&pageSize=1000`
)

const chapters = computed(() => {
  return (chaptersResult.value?.items ?? []).sort((a, b) => a.chapterNumber - b.chapterNumber)
})

const currentIndex = computed(() => {
  if (!chapters.value.length || !chapter.value) return -1
  return chapters.value.findIndex(c => c.id === chapter.value!.id)
})

const prevChapter = computed(() => {
  if (currentIndex.value > 0) {
    return chapters.value[currentIndex.value - 1]
  }
  return null
})

const nextChapter = computed(() => {
  if (currentIndex.value >= 0 && currentIndex.value < chapters.value.length - 1) {
    return chapters.value[currentIndex.value + 1]
  }
  return null
})

// Настройка заголовка страницы
watchEffect(() => {
  if (chapter.value) {
    useHead({
      title: `${chapter.value.title} — LibNode`,
    })
  }
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col">
    <!-- Навигационный хедер -->
    <header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 max-w-4xl items-center justify-between">
        <NuxtLink
          :to="`/books/${bookId}`"
          class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          title="К содержанию"
        >
          <ArrowLeft class="h-4 w-4" />
          <span class="hidden sm:inline">К оглавлению</span>
        </NuxtLink>
        <div class="truncate px-4 text-sm font-medium opacity-70">
          {{ chapter?.title || 'Загрузка...' }}
        </div>
        <div class="w-20"></div> <!-- Placeholder for layout balance -->
      </div>
    </header>

    <!-- Основной контент -->
    <main class="flex-1 container px-3 md:px-8 max-w-3xl py-6 md:py-12">
      <!-- Состояние загрузки -->
      <div v-if="chapterPending" class="flex flex-col space-y-4 animate-pulse">
        <div class="h-8 w-2/3 rounded-lg bg-muted"></div>
        <div class="h-4 w-full rounded bg-muted mt-8"></div>
        <div class="h-4 w-11/12 rounded bg-muted"></div>
        <div class="h-4 w-full rounded bg-muted"></div>
        <div class="h-4 w-5/6 rounded bg-muted"></div>
      </div>

      <!-- Состояние ошибки -->
      <div v-else-if="chapterError || !chapter" class="py-20 text-center text-destructive">
        <h2 class="text-2xl font-bold mb-2">Глава не найдена</h2>
        <p class="text-muted-foreground mb-6">Возможно, она была удалена или ссылка устарела.</p>
        <NuxtLink :to="`/books/${bookId}`" class="rounded-lg bg-secondary px-4 py-2 font-medium text-secondary-foreground hover:bg-secondary/80">
          Вернуться к книге
        </NuxtLink>
      </div>

      <!-- Текст главы -->
      <article v-else class="mx-auto">
        <h1 class="mb-10 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          {{ chapter.title }}
        </h1>
        
        <!-- Читалка (без @tailwindcss/typography можно писать кастомные стили, 
             но используем базовые типографические утилиты для хорошего отображения) -->
        <div 
          class="text-lg leading-relaxed md:text-xl md:leading-loose text-foreground/90 
                 [&>p]:mb-6 [&>p]:indent-4 sm:[&>p]:indent-8 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4"
          v-html="chapter.content"
        ></div>
      </article>
    </main>

    <!-- Нижняя навигация (Липкая) -->
    <footer v-if="!chapterPending && chapter" class="sticky bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3">
      <div class="container flex max-w-4xl justify-between items-center px-2 md:px-4">
        
        <!-- Предыдущая глава -->
        <NuxtLink
          v-if="prevChapter"
          :to="`/books/${bookId}/read/${prevChapter.id}`"
          class="inline-flex items-center justify-center gap-2 rounded-md bg-secondary/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:px-6"
        >
          <ChevronLeft class="h-4 w-4" />
          <span class="hidden sm:inline">Предыдущая</span>
        </NuxtLink>
        <button
          v-else
          disabled
          class="inline-flex items-center justify-center gap-2 rounded-md bg-secondary/10 px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed sm:px-6"
        >
          <ChevronLeft class="h-4 w-4" />
          <span class="hidden sm:inline">Предыдущая</span>
        </button>

        <!-- Меню (Список глав) -->
        <NuxtLink
          :to="`/books/${bookId}`"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:hidden"
        >
          <Menu class="h-4 w-4" />
        </NuxtLink>

        <!-- Следующая глава -->
        <NuxtLink
          v-if="nextChapter"
          :to="`/books/${bookId}/read/${nextChapter.id}`"
          class="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:px-6"
        >
          <span class="hidden sm:inline">Следующая</span>
          <ChevronRight class="h-4 w-4" />
        </NuxtLink>
        <button
          v-else
          disabled
          class="inline-flex items-center justify-center gap-2 rounded-md bg-primary/20 px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 cursor-not-allowed sm:px-6"
        >
          <span class="hidden sm:inline">Следующая</span>
          <ChevronRight class="h-4 w-4" />
        </button>
        
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Дополнительные стили для скролбара или выделения текста, если нужны */
article ::selection {
  background-color: hsl(var(--primary) / 0.3);
}
</style>
