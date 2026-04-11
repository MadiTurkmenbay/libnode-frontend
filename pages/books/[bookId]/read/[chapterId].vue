<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, Menu } from 'lucide-vue-next'
import type { ChapterDetailDto, ChapterListDto, PagedResult } from '~/types'
import { useReaderSettings } from '~/composables/useReaderSettings'

const route = useRoute()
const bookId = route.params.bookId as string
const chapterId = route.params.chapterId as string

// ── Настройки читалки ────────────────────────────────────
const { settings } = useReaderSettings()

// ── Данные ───────────────────────────────────────────────
const { data: chapter, pending: chapterPending, error: chapterError } = await useApiFetch<ChapterDetailDto>(
  `/api/chapters/${chapterId}`
)

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

// ── Динамические стили на основе настроек ─────────────────
const readerStyle = computed(() => ({
  fontSize: `${settings.value.fontSize}px`,
  lineHeight: `${settings.value.lineHeight}`,
}))

const readerClasses = computed(() => {
  const classes: string[] = []

  // Шрифт
  classes.push(settings.value.fontFamily === 'serif' ? 'font-serif' : 'font-sans')

  return classes.join(' ')
})

const themeClasses = computed(() => {
  switch (settings.value.theme) {
    case 'light':
      return 'bg-white text-gray-900'
    case 'sepia':
      return 'bg-[#f4ecd8] text-[#5b4636]'
    case 'dark':
    default:
      return 'bg-background text-foreground'
  }
})

const headerFooterTheme = computed(() => {
  switch (settings.value.theme) {
    case 'light':
      return 'bg-white/95 text-gray-900 border-gray-200'
    case 'sepia':
      return 'bg-[#f4ecd8]/95 text-[#5b4636] border-[#d4c9a8]'
    case 'dark':
    default:
      return 'bg-background/95 text-foreground'
  }
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
  <div class="min-h-screen flex flex-col transition-colors duration-300" :class="themeClasses">
    <!-- Навигационный хедер -->
    <header
      class="sticky top-0 z-50 border-b backdrop-blur transition-colors duration-300"
      :class="headerFooterTheme"
    >
      <div class="container flex h-14 max-w-4xl items-center justify-between px-3 md:px-4">
        <NuxtLink
          :to="`/books/${bookId}`"
          class="inline-flex items-center gap-2 text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
          title="К содержанию"
        >
          <ArrowLeft class="h-4 w-4" />
          <span class="hidden sm:inline">К оглавлению</span>
        </NuxtLink>
        <div class="truncate px-4 text-sm font-medium opacity-60">
          {{ chapter?.title || 'Загрузка...' }}
        </div>
        <!-- Кнопка настроек -->
        <ReaderSettings />
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
      <div v-else-if="chapterError || !chapter" class="py-20 text-center">
        <h2 class="text-2xl font-bold mb-2">Глава не найдена</h2>
        <p class="opacity-60 mb-6">Возможно, она была удалена или ссылка устарела.</p>
        <NuxtLink :to="`/books/${bookId}`" class="rounded-lg bg-secondary px-4 py-2 font-medium">
          Вернуться к книге
        </NuxtLink>
      </div>

      <!-- Текст главы -->
      <article v-else class="mx-auto">
        <h1 class="mb-10 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
          {{ chapter.title }}
        </h1>

        <!-- Читалка с динамическими стилями -->
        <div
          class="reader-content [&>p]:mb-6 [&>p]:indent-4 sm:[&>p]:indent-8 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4"
          :class="readerClasses"
          :style="readerStyle"
          v-html="chapter.content"
        ></div>
      </article>
    </main>

    <!-- Нижняя навигация (Липкая) -->
    <footer
      v-if="!chapterPending && chapter"
      class="sticky bottom-0 z-50 border-t backdrop-blur py-3 transition-colors duration-300"
      :class="headerFooterTheme"
    >
      <div class="container flex max-w-4xl justify-between items-center px-2 md:px-4">
        <!-- Предыдущая глава -->
        <NuxtLink
          v-if="prevChapter"
          :to="`/books/${bookId}/read/${prevChapter.id}`"
          class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors border opacity-80 hover:opacity-100 sm:px-6"
        >
          <ChevronLeft class="h-4 w-4" />
          <span class="hidden sm:inline">Предыдущая</span>
        </NuxtLink>
        <button
          v-else
          disabled
          class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium opacity-30 cursor-not-allowed sm:px-6"
        >
          <ChevronLeft class="h-4 w-4" />
          <span class="hidden sm:inline">Предыдущая</span>
        </button>

        <!-- Меню (Список глав) -->
        <NuxtLink
          :to="`/books/${bookId}`"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border opacity-70 hover:opacity-100 sm:hidden"
        >
          <Menu class="h-4 w-4" />
        </NuxtLink>

        <!-- Следующая глава -->
        <NuxtLink
          v-if="nextChapter"
          :to="`/books/${bookId}/read/${nextChapter.id}`"
          class="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 sm:px-6"
        >
          <span class="hidden sm:inline">Следующая</span>
          <ChevronRight class="h-4 w-4" />
        </NuxtLink>
        <button
          v-else
          disabled
          class="inline-flex items-center justify-center gap-2 rounded-md bg-primary/20 px-3 py-2 text-sm font-medium text-primary-foreground opacity-50 cursor-not-allowed sm:px-6"
        >
          <span class="hidden sm:inline">Следующая</span>
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
article ::selection {
  background-color: hsl(var(--primary) / 0.3);
}

.reader-content {
  transition: font-size 0.2s ease, line-height 0.2s ease;
}
</style>
