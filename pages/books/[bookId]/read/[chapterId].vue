<script setup lang="ts">
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Heart,
  Quote,
  X,
  ArrowUp,
  Clock,
  Check,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ReaderSettings from '@/components/ReaderSettings.vue'
import ReaderChapterList from '@/components/reader/ReaderChapterList.vue'
import ReaderVersionSwitcher from '@/components/reader/ReaderVersionSwitcher.vue'
import CommentSection from '@/components/comments/CommentSection.vue'
import type { ChapterDetailDto, ChapterVersionDetailDto, CreateQuoteDto, SetProgressDto } from '~/types'
import { useReaderSettings } from '~/composables/useReaderSettings'
import { useQuotes } from '~/composables/useQuotes'
import { useOfflineCache } from '~/composables/useOfflineCache'

const route = useRoute()
const router = useRouter()
const currentBookId = computed(() => route.params.bookId as string)
const currentChapterId = computed(() => route.params.chapterId as string)

const { toast } = useToast()
const { isAuthenticated } = useAuth()

const { settings, isReady } = useReaderSettings(currentBookId)

const activeTheme = computed(() => (isReady.value ? settings.value.theme : 'dark'))
const activeFontSize = computed(() => (isReady.value ? settings.value.fontSize : 18))
const activeLineHeight = computed(() => (isReady.value ? settings.value.lineHeight : 1.6))
const activeFontFamily = computed(() => (isReady.value ? settings.value.fontFamily : 'sans'))
const activeContainerWidth = computed(() => (isReady.value ? settings.value.containerWidth : 'medium'))
const activeLetterSpacing = computed(() => (isReady.value ? settings.value.letterSpacing : 0))
const activeParagraphSpacing = computed(() => (isReady.value ? settings.value.paragraphSpacing : 1))
const activeTextAlign = computed(() => (isReady.value ? settings.value.textAlign : 'justify'))
const activeDropCap = computed(() => (isReady.value ? settings.value.dropCap : false))

const { data: chapter, pending: chapterPending, error: chapterError } = await useApiFetch<ChapterDetailDto>(
  () => `/api/chapters/${currentChapterId.value}`,
)

const { cacheChapter, getCachedChapter } = useOfflineCache()
const cachedChapter = ref<ChapterDetailDto | null>(null)
const isFromCache = ref(false)

const effectiveChapter = computed(() => chapter.value ?? cachedChapter.value)

watch(chapter, (ch) => {
  if (ch) {
    isFromCache.value = false
    cachedChapter.value = null
    cacheChapter(ch)
  }
}, { immediate: true })

watch(chapterError, async (err) => {
  if (err && import.meta.client) {
    const cached = await getCachedChapter(currentChapterId.value)
    if (cached) {
      cachedChapter.value = cached
      isFromCache.value = true
    }
  }
}, { immediate: true })

const prevChapterId = computed(() => effectiveChapter.value?.previousChapterId ?? null)
const nextChapterId = computed(() => effectiveChapter.value?.nextChapterId ?? null)

// Выбранная ветка перевода (null = каноническая Chapter.Content).
const activeVersion = ref<ChapterVersionDetailDto | null>(null)
watch(currentChapterId, () => { activeVersion.value = null })
const displayTitle = computed(() => activeVersion.value?.title ?? effectiveChapter.value?.title ?? '')
const displayContent = computed(() => activeVersion.value?.content ?? effectiveChapter.value?.content ?? '')

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

const readerStyle = computed(() => ({
  fontSize: `${activeFontSize.value}px`,
  lineHeight: `${activeLineHeight.value}`,
  letterSpacing: `${activeLetterSpacing.value}em`,
  textAlign: activeTextAlign.value === 'left' ? 'left' : 'justify',
  '--reader-para-gap': `${activeParagraphSpacing.value}em`,
}))

const readerClasses = computed(() => {
  const classes = [activeFontFamily.value === 'serif' ? 'font-serif' : 'font-sans']
  if (activeDropCap.value) classes.push('reader-dropcap')
  if (activeTextAlign.value === 'justify') classes.push('reader-hyphens')
  return classes.join(' ')
})

// Непустые абзацы по порядку — для озвучки (TTS) и подсветки.
const ttsParagraphs = computed(() =>
  displayContent.value.split('\n').map((p) => p.trim()).filter(Boolean),
)

const BARE_IMG_URL_RE = /^https?:\/\/\S+\.(?:png|jpe?g|webp|gif)(?:\?\S*)?$/i
const MARKDOWN_IMG_RE = /^!\[([^\]]*)\]\((https?:\/\/\S+)\)$/i
const NOTE_RE = /\[note\]([\s\S]*?)\[\/note\]/gi

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeText(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderNotes(escaped: string): string {
  const parts: string[] = []
  let last = 0
  let m: RegExpExecArray | null
  NOTE_RE.lastIndex = 0
  while ((m = NOTE_RE.exec(escaped)) !== null) {
    if (m.index > last) parts.push(escaped.slice(last, m.index))
    parts.push(
      `<sup class="reader-note" tabindex="0" role="button" aria-label="Примечание переводчика">※<span class="reader-note-tip">${m[1]}</span></sup>`,
    )
    last = m.index + m[0].length
  }
  if (last < escaped.length) parts.push(escaped.slice(last))
  return parts.join('')
}

const readerContentHtml = computed(() => {
  if (!effectiveChapter.value) return ''
  let pIndex = 0
  return displayContent.value
    .split('\n')
    .map((paragraph) => {
      const trimmed = paragraph.trim()
      if (!trimmed) {
        return '<div class="reader-spacer"></div>'
      }
      const mdMatch = trimmed.match(MARKDOWN_IMG_RE)
      if (mdMatch) {
        const alt = escapeText(mdMatch[1])
        const url = escapeAttr(mdMatch[2])
        return `<p class="reader-p reader-p-img" data-p="${pIndex++}"><img class="reader-img" loading="lazy" alt="${alt}" src="${url}"></p>`
      }
      if (BARE_IMG_URL_RE.test(trimmed)) {
        const url = escapeAttr(trimmed)
        return `<p class="reader-p reader-p-img" data-p="${pIndex++}"><img class="reader-img" loading="lazy" alt="" src="${url}"></p>`
      }
      const escaped = paragraph
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
      return `<p class="reader-p" data-p="${pIndex++}">${renderNotes(escaped)}</p>`
    })
    .join('')
})

// Подсветка озвучиваемого абзаца (DOM-узлы стабильны, пока контент не меняется).
function highlightParagraph(index: number) {
  if (!import.meta.client) return
  const root = document.querySelector('.reader-content')
  root?.querySelectorAll('.reader-p-active').forEach((el) => el.classList.remove('reader-p-active'))
  if (index < 0) return
  const node = root?.querySelector(`.reader-p[data-p="${index}"]`)
  if (node) {
    node.classList.add('reader-p-active')
    node.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

const nextChapterHref = computed(() =>
  nextChapterId.value ? `/books/${currentBookId.value}/read/${nextChapterId.value}` : null,
)

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

const surfaceClass = computed(() => {
  switch (activeTheme.value) {
    case 'light':
      return 'reader-surface-light'
    case 'sepia':
      return 'reader-surface-sepia'
    case 'dark':
    default:
      return 'reader-surface-dark'
  }
})

// Reading time estimate (~200 wpm).
const chapterWordCount = computed(() =>
  displayContent.value.trim() ? displayContent.value.trim().split(/\s+/).filter(Boolean).length : 0,
)
const readingMinutes = computed(() => Math.max(1, Math.round(chapterWordCount.value / 200)))

watchEffect(() => {
  if (effectiveChapter.value) {
    useSeo({
      title: effectiveChapter.value.title,
      description: `Читать главу ${effectiveChapter.value.chapterNumber} онлайн на LibNode.`,
      type: 'article',
      url: `/books/${currentBookId.value}/read/${currentChapterId.value}`,
    })
  }
})

/* ----------------------------- Reading progress save ---------------------- */

async function saveReadingProgress() {
  if (!import.meta.client || !isAuthenticated.value) return

  const payload: SetProgressDto = { chapterId: currentChapterId.value }
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

/* ----------------------------- Scroll behaviour --------------------------- */

const scrollProgress = ref(0)
const showScrollTop = ref(false)
const chromeVisible = ref(true)
let lastScrollY = 0

const SCROLL_POS_PREFIX = 'libnode-reader-scroll:'

function scrollStorageKey(id: string) {
  return `${SCROLL_POS_PREFIX}${id}`
}

function saveScrollPosition() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(scrollStorageKey(currentChapterId.value), String(Math.round(window.scrollY)))
  }
  catch {
    // ignore
  }
}

function restoreScrollPosition() {
  if (!import.meta.client) return
  try {
    const saved = localStorage.getItem(scrollStorageKey(currentChapterId.value))
    if (saved) {
      const y = Number(saved)
      if (!Number.isNaN(y) && y > 0) {
        nextTick(() => window.scrollTo({ top: y, behavior: 'auto' }))
      }
    }
  }
  catch {
    // ignore
  }
}

let scrollRaf = 0
function onScroll() {
  if (scrollRaf) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    const y = window.scrollY
    scrollProgress.value = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0
    showScrollTop.value = y > 700

    // Immersive chrome: hide on scroll-down, reveal on scroll-up / near top.
    if (y < 80) {
      chromeVisible.value = true
    }
    else if (y > lastScrollY + 8) {
      chromeVisible.value = false
    }
    else if (y < lastScrollY - 8) {
      chromeVisible.value = true
    }
    lastScrollY = y

    saveScrollPositionThrottled()
  })
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function saveScrollPositionThrottled() {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveScrollPosition()
  }, 400)
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/* ----------------------------- Keyboard navigation ------------------------ */

function goPrev() {
  if (prevChapterId.value) {
    router.push(`/books/${currentBookId.value}/read/${prevChapterId.value}`)
  }
}

function goNext() {
  if (nextChapterId.value) {
    router.push(`/books/${currentBookId.value}/read/${nextChapterId.value}`)
  }
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
  if (e.metaKey || e.ctrlKey || e.altKey) return

  if (e.key === 'Escape') {
    isHelpOpen.value = false
    return
  }
  if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'з') {
    goPrev()
  }
  else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'т') {
    goNext()
  }
  else if (e.key === 't' || e.key === 'е') {
    scrollToTop()
  }
  else if (e.key === 'c' || e.key === 'с') {
    isChapterListOpen.value = true
  }
  else if (e.key === 'l' || e.key === 'д') {
    likeChapter()
  }
  else if (e.key === 'm' || e.key === 'ь') {
    markReadThrough()
  }
  else if (e.key === '?') {
    isHelpOpen.value = !isHelpOpen.value
  }
}

/* ----------------------------- Chapter list drawer ------------------------ */

const isChapterListOpen = ref(false)
const isHelpOpen = ref(false)
const shortcutHelp = [
  { keys: '← / p', label: 'Предыдущая глава' },
  { keys: '→ / n', label: 'Следующая глава' },
  { keys: 't', label: 'Наверх' },
  { keys: 'c', label: 'Оглавление' },
  { keys: 'l', label: 'Лайк главе' },
  { keys: 'm', label: 'Отметить прочитанным до этой главы' },
  { keys: '?', label: 'Эта справка' },
]

/* ----------------------------- Lifecycle ---------------------------------- */

onMounted(() => {
  void saveReadingProgress()
  lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('selectionchange', onSelectionChange)
  restoreScrollPosition()

  // Prefetch next chapter content on idle for faster navigation.
  if (nextChapterId.value && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      if (nextChapterId.value) {
        executeApiRequest<ChapterDetailDto>(`/api/chapters/${nextChapterId.value}`, {
          key: `prefetch-chapter:${nextChapterId.value}`,
        }).catch(() => {})
      }
    })
  }
})

onBeforeUnmount(() => {
  saveScrollPosition()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('selectionchange', onSelectionChange)
  if (selectionTimer) clearTimeout(selectionTimer)
  if (scrollRaf) cancelAnimationFrame(scrollRaf)
})

watch(
  () => currentChapterId.value,
  () => {
    chromeVisible.value = true
    scrollProgress.value = 0
    void saveReadingProgress()
    restoreScrollPosition()
  },
)

watch(
  () => isAuthenticated.value,
  (authenticated) => {
    if (authenticated) void saveReadingProgress()
  },
)

/* ----------------------------- Quotes ------------------------------------- */

const { createQuote } = useQuotes()
const isLiking = ref(false)

const showQuotePopup = ref(false)
const popupPosition = ref({ x: 0, y: 0 })
const selectedText = ref('')
const contextText = ref('')
const isSavingQuote = ref(false)

function clearSelection() {
  showQuotePopup.value = false
  selectedText.value = ''
  contextText.value = ''
  if (import.meta.client && window.getSelection) {
    window.getSelection()?.removeAllRanges()
  }
}

function evaluateSelection() {
  if (!import.meta.client || !isAuthenticated.value) return

  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    showQuotePopup.value = false
    return
  }

  const range = selection.getRangeAt(0)
  const container = range.commonAncestorContainer as Node
  const readerContent = document.querySelector('.reader-content')
  if (!readerContent || !readerContent.contains(container)) {
    showQuotePopup.value = false
    return
  }

  const text = selection.toString().trim()
  if (!text || text.length < 3) {
    showQuotePopup.value = false
    return
  }

  selectedText.value = text

  const paragraph = container.nodeType === Node.TEXT_NODE
    ? container.parentElement?.closest('p')
    : (container as Element).closest('p')
  contextText.value = paragraph?.textContent?.trim() ?? ''

  // Попап имеет position: fixed → координаты относительно вьюпорта (БЕЗ scrollY).
  const rect = range.getBoundingClientRect()
  const popupHeight = 44
  const margin = 8
  // Над выделением, если сверху есть место; иначе под ним (чтобы не прятаться
  // за нативным меню выделения, которое на мобильных висит сверху).
  const y = rect.top > popupHeight + margin ? rect.top - popupHeight : rect.bottom + margin
  const x = Math.min(Math.max(rect.left + rect.width / 2, 80), window.innerWidth - 80)
  popupPosition.value = { x, y }

  showQuotePopup.value = true
}

// На тач-устройствах `mouseup` не приходит при выделении текста — слушаем
// `selectionchange` (с дебаунсом, чтобы реагировать на завершённое выделение).
let selectionTimer: ReturnType<typeof setTimeout> | null = null
function onSelectionChange() {
  if (selectionTimer) clearTimeout(selectionTimer)
  selectionTimer = setTimeout(evaluateSelection, 350)
}

async function saveQuote() {
  if (!chapter.value || !selectedText.value || isSavingQuote.value) return

  isSavingQuote.value = true
  try {
    const payload: CreateQuoteDto = {
      chapterId: currentChapterId.value,
      selectedText: selectedText.value,
      contextText: contextText.value || null,
      note: null,
    }
    await createQuote(payload)
    toast('Цитата сохранена')
    clearSelection()
  }
  catch (err: unknown) {
    console.error('Failed to save quote:', err)
    const message
      = (err as { statusMessage?: string; message?: string })?.statusMessage
        || (err as { message?: string })?.message
        || 'Не удалось сохранить цитату'
    toast({ variant: 'destructive', title: message })
  }
  finally {
    isSavingQuote.value = false
  }
}

async function likeChapter() {
  if (!chapter.value || !isAuthenticated.value || chapter.value.isLikedByCurrentUser) return

  isLiking.value = true
  chapter.value.isLikedByCurrentUser = true
  chapter.value.likesCount += 1

  try {
    await executeApiRequest(`/api/chapters/${currentChapterId.value}/like`, { method: 'POST' })
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

const markingRead = ref(false)
async function markReadThrough() {
  if (!chapter.value || !isAuthenticated.value) return
  markingRead.value = true
  try {
    await executeApiRequest(`/api/books/${currentBookId.value}/mark-read-through`, {
      method: 'POST',
      body: { chapterNumber: chapter.value.chapterNumber },
    })
    toast('Отмечено прочитанным до этой главы')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось отметить прочитанным' })
  }
  finally {
    markingRead.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen flex flex-col transition-colors duration-300" :class="themeClasses">
    <!-- Reading progress bar -->
    <div class="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
      <div
        class="h-full bg-primary transition-[width] duration-150 ease-out"
        :style="{ width: `${scrollProgress}%` }"
      ></div>
    </div>

    <header
      class="sticky top-0 z-50 border-b backdrop-blur transition-all duration-300"
      :class="[surfaceClass, chromeVisible ? 'translate-y-0' : '-translate-y-full']"
    >
      <div class="container flex h-14 max-w-4xl items-center justify-between gap-2 px-3 md:px-4">
        <NuxtLink
          :to="`/books/${currentBookId}`"
          class="inline-flex items-center gap-2 text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
          title="К содержанию"
        >
          <ArrowLeft class="h-4 w-4" />
          <span class="hidden sm:inline">К оглавлению</span>
        </NuxtLink>

        <div class="min-w-0 flex-1 truncate px-2 text-center text-sm font-medium opacity-60">
          {{ displayTitle || 'Загрузка...' }}
        </div>

        <div class="flex items-center gap-1.5">
          <ClientOnly>
            <ReaderVersionSwitcher
              :chapter-id="currentChapterId"
              :book-id="currentBookId"
              :surface-class="surfaceClass"
              @select="(d) => (activeVersion = d)"
            />
          </ClientOnly>
          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-md border opacity-70 transition-opacity hover:opacity-100"
            :class="surfaceClass"
            title="Оглавление (C)"
            aria-label="Оглавление"
            @click="isChapterListOpen = true"
          >
            <List class="h-4 w-4" />
          </button>
          <ClientOnly>
            <ReaderStats
              v-if="effectiveChapter"
              :book-id="currentBookId"
              :chapter-number="effectiveChapter.chapterNumber"
              :chapter-words="chapterWordCount"
              :surface-class="surfaceClass"
            />
          </ClientOnly>
          <ClientOnly>
            <ReaderAnchors :chapter-id="currentChapterId" :surface-class="surfaceClass" />
          </ClientOnly>
          <ClientOnly>
            <ReaderAutoScroll :surface-class="surfaceClass" />
          </ClientOnly>
          <ClientOnly>
            <ReaderTts
              :paragraphs="ttsParagraphs"
              :surface-class="surfaceClass"
              :next-href="nextChapterHref"
              @active="highlightParagraph"
            />
          </ClientOnly>
          <ClientOnly>
            <ReaderSettings :book-id="currentBookId" />
          </ClientOnly>
        </div>
      </div>
    </header>

    <main class="flex-1 container px-3 md:px-8 py-6 md:py-12" :class="containerWidthClass">
      <div v-if="chapterPending" class="flex flex-col space-y-4 animate-pulse">
        <div class="h-8 w-2/3 rounded-lg bg-muted/40"></div>
        <div class="mt-8 h-4 w-full rounded bg-muted/40"></div>
        <div class="h-4 w-11/12 rounded bg-muted/40"></div>
        <div class="h-4 w-full rounded bg-muted/40"></div>
        <div class="h-4 w-5/6 rounded bg-muted/40"></div>
        <div class="h-4 w-4/5 rounded bg-muted/40"></div>
        <div class="h-4 w-full rounded bg-muted/40"></div>
      </div>

      <div v-else-if="(chapterError && !isFromCache) || !effectiveChapter" class="py-20 text-center">
        <h1 class="mb-2 text-2xl font-bold">Глава не найдена</h1>
        <p class="mb-6 opacity-60">Возможно, она была удалена или ссылка устарела.</p>
        <Button as-child>
          <NuxtLink :to="`/books/${currentBookId}`">Вернуться к книге</NuxtLink>
        </Button>
      </div>

      <article v-else class="mx-auto">
        <div v-if="isFromCache" class="mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400">
          <span class="font-medium">Чтение из офлайн-кэша</span>
          <span class="opacity-60">— глава загружена без подключения к серверу</span>
        </div>
        <h1 class="mb-3 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
          {{ displayTitle }}
        </h1>
        <div class="mb-10 flex items-center gap-3 text-xs opacity-50">
          <span class="inline-flex items-center gap-1">
            <Clock class="h-3.5 w-3.5" />
            ~{{ readingMinutes }} мин
          </span>
          <span aria-hidden="true">·</span>
          <span>Глава {{ chapter.chapterNumber }}</span>
        </div>

        <div
          class="reader-content"
          :class="readerClasses"
          :style="readerStyle"
          @mouseup="evaluateSelection"
          v-html="readerContentHtml"
        ></div>

        <div
          v-if="showQuotePopup"
          class="fixed z-[60] flex items-center gap-1 rounded-lg border bg-background/95 px-2 py-1.5 text-foreground shadow-lg backdrop-blur"
          :style="{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translateX(-50%)',
          }"
        >
          <Button size="sm" variant="ghost" class="h-8 gap-1.5 px-2 text-xs" :disabled="isSavingQuote" @click="saveQuote">
            <Quote class="h-3.5 w-3.5" />
            <span>Сохранить цитату</span>
          </Button>
          <Button size="sm" variant="ghost" class="h-8 w-8 p-0" @click="clearSelection">
            <X class="h-3.5 w-3.5" />
          </Button>
        </div>

        <div
          class="mt-16 flex flex-col items-center justify-center border-t pt-10 pb-12 transition-colors"
          :class="surfaceClass"
        >
          <button
            class="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full px-8 text-base font-medium shadow-sm transition-all hover:shadow-md disabled:cursor-default disabled:opacity-90"
            :class="chapter.isLikedByCurrentUser
              ? 'border border-destructive/20 bg-destructive/10 text-destructive'
              : 'border border-primary/10 bg-primary/5 text-foreground hover:scale-105 hover:bg-primary/10 active:scale-95'"
            :disabled="!isAuthenticated || chapter.isLikedByCurrentUser || isLiking"
            @click="likeChapter"
          >
            <Heart
              class="relative z-10 h-6 w-6 transition-transform"
              :class="{ 'fill-current text-destructive': chapter.isLikedByCurrentUser, 'group-hover:scale-110': !chapter.isLikedByCurrentUser }"
            />
            <span class="relative z-10 text-lg font-bold">{{ chapter.likesCount }}</span>
          </button>
          <p v-if="!isAuthenticated" class="mt-4 text-xs opacity-60">Войдите, чтобы оценивать главы</p>
          <p v-else-if="chapter.isLikedByCurrentUser" class="mt-4 text-xs font-medium text-destructive/70">
            Вам понравилась эта глава
          </p>

          <button
            v-if="isAuthenticated"
            class="mt-5 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium opacity-80 transition-opacity hover:opacity-100 disabled:opacity-50"
            :class="surfaceClass"
            :disabled="markingRead"
            @click="markReadThrough"
          >
            <Check class="h-3.5 w-3.5" />
            Отметить прочитанным до этой главы
          </button>
        </div>
      </article>

      <section v-if="chapter && !chapterPending" class="mx-auto mt-12">
        <ClientOnly>
          <CommentSection
            :book-id="currentBookId"
            :chapter-id="currentChapterId"
            title="Комментарии к главе"
          />
        </ClientOnly>
      </section>
    </main>

    <!-- Mobile edge tap zones for chapter navigation -->
    <button
      v-if="prevChapterId"
      class="fixed left-0 top-1/2 z-40 flex h-16 w-9 -translate-y-1/2 items-center justify-center rounded-r-xl border-y border-r opacity-40 backdrop-blur transition-opacity hover:opacity-90 sm:hidden"
      :class="surfaceClass"
      aria-label="Предыдущая глава"
      @click="goPrev"
    >
      <ChevronLeft class="h-5 w-5" />
    </button>
    <button
      v-if="nextChapterId"
      class="fixed right-0 top-1/2 z-40 flex h-16 w-9 -translate-y-1/2 items-center justify-center rounded-l-xl border-y border-l opacity-40 backdrop-blur transition-opacity hover:opacity-90 sm:hidden"
      :class="surfaceClass"
      aria-label="Следующая глава"
      @click="goNext"
    >
      <ChevronRight class="h-5 w-5" />
    </button>

    <!-- Scroll to top -->
    <Transition name="fab">
      <button
        v-if="showScrollTop"
        class="fixed bottom-20 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur transition-transform hover:scale-105 md:bottom-24 md:right-8"
        :class="surfaceClass"
        title="Наверх (T)"
        aria-label="Наверх"
        @click="scrollToTop"
      >
        <ArrowUp class="h-5 w-5" />
      </button>
    </Transition>

    <footer
      v-if="!chapterPending && effectiveChapter"
      class="sticky bottom-0 z-50 border-t py-3 backdrop-blur transition-all duration-300"
      :class="[surfaceClass, chromeVisible ? 'translate-y-0' : 'translate-y-full']"
    >
      <div class="container flex max-w-4xl items-center justify-between gap-2 px-2 md:px-4">
        <NuxtLink
          v-if="prevChapterId"
          :to="`/books/${currentBookId}/read/${prevChapterId}`"
          class="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium opacity-80 transition-opacity hover:opacity-100 sm:px-6"
        >
          <ChevronLeft class="h-4 w-4" />
          <span class="hidden sm:inline">Предыдущая</span>
        </NuxtLink>
        <span
          v-else
          class="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium opacity-30 sm:px-6"
        >
          <ChevronLeft class="h-4 w-4" />
          <span class="hidden sm:inline">Предыдущая</span>
        </span>

        <button
          class="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-medium opacity-70 transition-opacity hover:opacity-100"
          title="Оглавление"
          @click="isChapterListOpen = true"
        >
          <List class="h-4 w-4" />
          <span class="hidden sm:inline">Главы</span>
        </button>

        <NuxtLink
          v-if="nextChapterId"
          :to="`/books/${currentBookId}/read/${nextChapterId}`"
          class="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 sm:px-6"
        >
          <span class="hidden sm:inline">Следующая</span>
          <ChevronRight class="h-4 w-4" />
        </NuxtLink>
        <span
          v-else
          class="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md bg-primary/20 px-3 py-2 text-sm font-medium text-primary-foreground opacity-50 sm:px-6"
        >
          <span class="hidden sm:inline">Следующая</span>
          <ChevronRight class="h-4 w-4" />
        </span>
      </div>
    </footer>

    <ClientOnly>
      <ReaderChapterList
        v-model:open="isChapterListOpen"
        :book-id="currentBookId"
        :current-chapter-id="currentChapterId"
      />
    </ClientOnly>

    <!-- Keyboard shortcuts cheatsheet (?) -->
    <Teleport to="body">
      <div
        v-if="isHelpOpen"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="isHelpOpen = false"
      >
        <div class="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold">Горячие клавиши</h3>
            <button class="rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Закрыть" @click="isHelpOpen = false">
              <X class="h-4 w-4" />
            </button>
          </div>
          <ul class="space-y-1.5">
            <li v-for="s in shortcutHelp" :key="s.keys" class="flex items-center justify-between gap-3 text-sm">
              <span class="text-muted-foreground">{{ s.label }}</span>
              <kbd class="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">{{ s.keys }}</kbd>
            </li>
          </ul>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
article ::selection {
  background-color: hsl(var(--primary) / 0.3);
}

.reader-content {
  transition: font-size 0.2s ease, line-height 0.2s ease, letter-spacing 0.2s ease;
}

.reader-content :deep(.reader-p) {
  text-indent: 1.5em;
  margin-bottom: var(--reader-para-gap, 1em);
}

.reader-content :deep(.reader-spacer) {
  height: 1em;
}

.reader-content :deep(.reader-p-img) {
  text-indent: 0;
  text-align: center;
  margin-bottom: var(--reader-para-gap, 1em);
}

.reader-content :deep(.reader-img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  display: inline-block;
}

.reader-content :deep(.reader-note) {
  position: relative;
  cursor: pointer;
  color: hsl(var(--primary));
  font-weight: 600;
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0;
}

.reader-content :deep(.reader-note-tip) {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  display: none;
  background: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.9em;
  font-weight: 400;
  line-height: 1.5;
  white-space: normal;
  text-indent: 0;
  width: max-content;
  max-width: 320px;
  z-index: 20;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
  margin-bottom: 0.4em;
}

.reader-content :deep(.reader-note:hover .reader-note-tip),
.reader-content :deep(.reader-note:focus .reader-note-tip) {
  display: block;
}

/* Подсветка озвучиваемого абзаца (TTS). */
.reader-content :deep(.reader-p-active) {
  background-color: hsl(var(--primary) / 0.12);
  border-radius: 0.375rem;
  box-shadow: 0 0 0 0.4em hsl(var(--primary) / 0.12);
}

/* Переносы при выравнивании по ширине. */
.reader-content.reader-hyphens {
  hyphens: auto;
  -webkit-hyphens: auto;
}

/* Буквица: увеличенная первая буква первого абзаца. */
.reader-content.reader-dropcap :deep(.reader-p:first-of-type)::first-letter {
  float: left;
  font-size: 3.2em;
  line-height: 0.8;
  font-weight: 700;
  padding-right: 0.08em;
  margin-top: 0.05em;
  color: hsl(var(--primary));
}

.fab-enter-active,
.fab-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(8px);
}
</style>
