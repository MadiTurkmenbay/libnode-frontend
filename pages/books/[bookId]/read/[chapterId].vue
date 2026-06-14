<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Heart } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { ChapterDetailDto, SetProgressDto } from '~/types'
import { useReaderSettings } from '~/composables/useReaderSettings'

const route = useRoute()
const currentBookId = computed(() => route.params.bookId as string)
const currentChapterId = computed(() => route.params.chapterId as string)

const { toast } = useToast()
const { isAuthenticated } = useAuth()

const { settings, isReady } = useReaderSettings()

const activeTheme = computed(() => isReady.value ? settings.value.theme : 'dark')
const activeFontSize = computed(() => isReady.value ? settings.value.fontSize : 18)
const activeLineHeight = computed(() => isReady.value ? settings.value.lineHeight : 1.6)
const activeFontFamily = computed(() => isReady.value ? settings.value.fontFamily : 'sans')
const activeContainerWidth = computed(() => isReady.value ? settings.value.containerWidth : 'medium')

const { data: chapter, pending: chapterPending, error: chapterError } = await useApiFetch<ChapterDetailDto>(
  () => `/api/chapters/${currentChapterId.value}`,
)

const prevChapterId = computed(() => chapter.value?.previousChapterId ?? null)
const nextChapterId = computed(() => chapter.value?.nextChapterId ?? null)

const readerStyle = computed(() => ({
  fontSize: `${activeFontSize.value}px`,
  lineHeight: `${activeLineHeight.value}`,
}))

const readerClasses = computed(() => {
  const classes: string[] = []
  classes.push(activeFontFamily.value === 'serif' ? 'font-serif' : 'font-sans')
  return classes.join(' ')
})

const containerWidthClass = computed(() => {
  switch (activeContainerWidth.value) {
    case 'narrow':
      return 'max-w-2xl'
    case 'wide':
      return 'max-w-5xl'
    case 'medium':
    default:
      return 'max-w-3xl'
  }
})

const themeClasses = computed(() => {
  switch (activeTheme.value) {
    case 'light':
      return 'bg-reader-light text-reader-light'
    case 'sepia':
      return 'bg-reader-sepia text-reader-sepia'
    case 'dark':
    default:
      return 'bg-reader-dark text-reader-dark'
  }
})

const headerFooterTheme = computed(() => {
  switch (activeTheme.value) {
    case 'light':
      return 'bg-reader-light/95 text-reader-light border-reader-light'
    case 'sepia':
      return 'bg-reader-sepia/95 text-reader-sepia border-reader-sepia'
    case 'dark':
    default:
      return 'bg-background/95 text-foreground'
  }
})

watchEffect(() => {
  if (chapter.value) {
    useHead({
      title: `${chapter.value.title} — LibNode`,
    })
  }
})

async function saveReadingProgress() {
  if (!import.meta.client || !isAuthenticated.value) {
    return
  }

  const payload: SetProgressDto = {
    chapterId: currentChapterId.value,
  }

  try {
    await executeApiRequest(`/api/books/${currentBookId.value}/progress`, {
      method: 'POST',
      body: payload,
      key: `reading-progress:${currentBookId.value}:${currentChapterId.value}`,
    })
  }
  catch {
    // Прогресс не должен блокировать UI.
  }
}

onMounted(() => {
  void saveReadingProgress()
})

watch(
  () => [currentBookId.value, currentChapterId.value, isAuthenticated.value],
  ([, , authenticated]) => {
    if (!authenticated) {
      return
    }

    void saveReadingProgress()
  },
)

const isLiking = ref(false)

async function likeChapter() {
  if (!chapter.value || !isAuthenticated.value || chapter.value.isLikedByCurrentUser) {
    return
  }

  isLiking.value = true
  chapter.value.isLikedByCurrentUser = true
  chapter.value.likesCount += 1

  try {
    await executeApiRequest(`/api/chapters/${currentChapterId.value}/like`, {
      method: 'POST',
    })
    toast('Глава понравилась!')
  }
  catch {
    chapter.value.isLikedByCurrentUser = false
    chapter.value.likesCount -= 1
    toast({ variant: 'destructive', title: 'Не удалось поставить лайк' })
  }
  finally {
    isLiking.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col transition-colors duration-300" :class="themeClasses">
    <header
      class="sticky top-0 z-50 border-b backdrop-blur transition-colors duration-300"
      :class="headerFooterTheme"
    >
      <div class="container flex h-14 max-w-4xl items-center justify-between px-3 md:px-4">
        <NuxtLink
          :to="`/books/${currentBookId}`"
          class="inline-flex items-center gap-2 text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
          title="К содержанию"
        >
          <ArrowLeft class="h-4 w-4" />
          <span class="hidden sm:inline">К оглавлению</span>
        </NuxtLink>
        <div class="truncate px-4 text-sm font-medium opacity-60">
          {{ chapter?.title || 'Загрузка...' }}
        </div>
        <ReaderSettings />
      </div>
    </header>

    <main class="flex-1 container px-3 md:px-8 py-6 md:py-12" :class="containerWidthClass">
      <div v-if="chapterPending" class="flex flex-col space-y-4 animate-pulse">
        <div class="h-8 w-2/3 rounded-lg bg-muted"></div>
        <div class="h-4 w-full rounded bg-muted mt-8"></div>
        <div class="h-4 w-11/12 rounded bg-muted"></div>
        <div class="h-4 w-full rounded bg-muted"></div>
        <div class="h-4 w-5/6 rounded bg-muted"></div>
        <div class="h-4 w-4/5 rounded bg-muted"></div>
        <div class="h-4 w-full rounded bg-muted"></div>
      </div>

      <div v-else-if="chapterError || !chapter" class="py-20 text-center">
        <h1 class="text-2xl font-bold mb-2">Глава не найдена</h1>
        <p class="opacity-60 mb-6">Возможно, она была удалена или ссылка устарела.</p>
        <Button as-child>
          <NuxtLink :to="`/books/${currentBookId}`">
            Вернуться к книге
          </NuxtLink>
        </Button>
      </div>

      <article v-else class="mx-auto">
        <h1 class="mb-10 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
          {{ chapter.title }}
        </h1>

        <div
          class="reader-content"
          :class="readerClasses"
          :style="readerStyle"
        >
          <template v-for="(paragraph, index) in chapter.content.split('\n')" :key="index">
            <p v-if="paragraph.trim()" class="indent-6 mb-4 text-justify">
              {{ paragraph }}
            </p>
            <div v-else-if="paragraph === ''" class="h-4"></div>
          </template>
        </div>

        <div class="mt-16 flex flex-col items-center justify-center border-t border-border/50 pt-10 pb-12 transition-colors" :class="headerFooterTheme">
          <button
            @click="likeChapter"
            class="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full px-8 text-base font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-90 disabled:cursor-default"
            :class="chapter.isLikedByCurrentUser ? 'text-destructive bg-destructive/10 border border-destructive/20' : 'bg-primary/5 border border-primary/10 text-foreground hover:bg-primary/10 hover:scale-105 active:scale-95'"
            :disabled="!isAuthenticated || chapter.isLikedByCurrentUser || isLiking"
          >
            <div
              v-if="chapter.isLikedByCurrentUser"
              class="absolute inset-0 bg-destructive/5 pointer-events-none"
            ></div>
            <Heart
              class="relative z-10 h-6 w-6 transition-transform"
              :class="{ 'fill-current text-destructive': chapter.isLikedByCurrentUser, 'group-hover:scale-110': !chapter.isLikedByCurrentUser }"
            />
            <span class="relative z-10 font-bold text-lg">{{ chapter.likesCount }}</span>
          </button>
          <p v-if="!isAuthenticated" class="mt-4 text-xs text-muted-foreground opacity-70">
            Войдите, чтобы оценивать главы
          </p>
          <p v-else-if="chapter.isLikedByCurrentUser" class="mt-4 text-xs font-medium text-destructive/70">
            Вам понравилась эта глава
          </p>
        </div>
      </article>
    </main>

    <footer
      v-if="!chapterPending && chapter"
      class="sticky bottom-0 z-50 border-t backdrop-blur py-3 transition-colors duration-300"
      :class="headerFooterTheme"
    >
      <div class="container flex max-w-4xl justify-between items-center px-2 md:px-4">
        <NuxtLink
          v-if="prevChapterId"
          :to="`/books/${currentBookId}/read/${prevChapterId}`"
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

        <NuxtLink
          :to="`/books/${currentBookId}`"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border opacity-70 hover:opacity-100 sm:hidden"
        >
          <Menu class="h-4 w-4" />
        </NuxtLink>

        <NuxtLink
          v-if="nextChapterId"
          :to="`/books/${currentBookId}/read/${nextChapterId}`"
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
