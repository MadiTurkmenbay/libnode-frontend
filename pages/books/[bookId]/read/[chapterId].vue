<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Heart } from 'lucide-vue-next'
import type { ChapterDetailDto, ChapterListDto, PagedResult } from '~/types'
import { useReaderSettings } from '~/composables/useReaderSettings'

const route = useRoute()
const bookId = route.params.bookId as string
const chapterId = route.params.chapterId as string

const { toast } = useToast()
const { isAuthenticated } = useAuth()

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

// Логика лайков
const isLiking = ref(false)

async function likeChapter() {
  if (!chapter.value) return
  if (!isAuthenticated.value) return
  if (chapter.value.isLikedByCurrentUser) return
  
  isLiking.value = true
  
  // Optimistic UI updates
  chapter.value.isLikedByCurrentUser = true
  chapter.value.likesCount++
  
  try {
    const config = useRuntimeConfig()
    const baseURL = import.meta.client && config.public.apiBaseClient ? config.public.apiBaseClient : config.public.apiBase
    const token = useCookie('auth_token')
    
    await $fetch(`/api/chapters/${chapterId}/like`, {
      baseURL: baseURL as string,
      method: 'POST',
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
    })
    toast('Глава понравилась!')
  } catch (e) {
    chapter.value.isLikedByCurrentUser = false
    chapter.value.likesCount--
    toast({ variant: 'destructive', title: 'Не удалось поставить лайк' })
  } finally {
    isLiking.value = false
  }
}
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
          class="reader-content"
          :class="readerClasses"
          :style="readerStyle"
        >
          <template v-for="(paragraph, index) in chapter.content.split('\n')" :key="index">
            <p v-if="paragraph.trim()" class="indent-6 mb-4 text-justify leading-relaxed">
              {{ paragraph }}
            </p>
            <div v-else-if="paragraph === ''" class="h-4"></div>
          </template>
        </div>

        <!-- Кнопка Лайка -->
        <div class="mt-16 flex flex-col items-center justify-center border-t border-border/50 pt-10 pb-12 transition-colors" :class="headerFooterTheme">
          <button
            @click="likeChapter"
            class="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full px-8 text-base font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-90 disabled:cursor-default"
            :class="chapter.isLikedByCurrentUser ? 'text-rose-500 bg-rose-500/10 border border-rose-500/20' : 'bg-primary/5 border border-primary/10 text-foreground hover:bg-primary/10 hover:scale-105 active:scale-95'"
            :disabled="!isAuthenticated || chapter.isLikedByCurrentUser || isLiking"
          >
            <div 
              v-if="chapter.isLikedByCurrentUser"
              class="absolute inset-0 bg-rose-500/5 pointer-events-none"
            ></div>
            <Heart 
              class="relative z-10 h-6 w-6 transition-transform"
              :class="{ 'fill-current text-rose-500': chapter.isLikedByCurrentUser, 'group-hover:scale-110': !chapter.isLikedByCurrentUser }"
            />
            <span class="relative z-10 font-bold text-lg">{{ chapter.likesCount }}</span>
          </button>
          <p v-if="!isAuthenticated" class="mt-4 text-xs text-muted-foreground opacity-70">
            Войдите, чтобы оценивать главы
          </p>
          <p v-else-if="chapter.isLikedByCurrentUser" class="mt-4 text-xs font-medium text-rose-500/70">
            Вам понравилась эта глава
          </p>
        </div>
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
