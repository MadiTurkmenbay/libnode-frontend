<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import { X, Search, ArrowDownUp, Check, Loader2 } from 'lucide-vue-next'
import type { ChapterListDto, CursorPagedResult } from '~/types'

const props = defineProps<{
  open: boolean
  bookId: string
  currentChapterId: string
}>()

const emit = defineEmits<{ 'update:open': [boolean] }>()

const chapters = ref<ChapterListDto[]>([])
const nextCursor = ref<number | null>(null)
const hasMore = ref(true)
const loading = ref(false)
const loaded = ref(false)
const sortDesc = ref(false)
const search = ref('')
const listEl = ref<HTMLElement | null>(null)

async function loadPage(reset = false) {
  if (loading.value) return
  loading.value = true
  try {
    const cursorPart = !reset && nextCursor.value !== null ? `&cursor=${nextCursor.value}` : ''
    const data = await executeApiRequest<CursorPagedResult<ChapterListDto, number>>(
      `/api/books/${props.bookId}/chapters?limit=100&sortDesc=${sortDesc.value}${cursorPart}`,
      { key: `reader-chapters:${props.bookId}:${sortDesc.value}:${reset ? 'init' : nextCursor.value}` },
    )
    chapters.value = reset ? data.items : [...chapters.value, ...data.items]
    nextCursor.value = data.nextCursor
    hasMore.value = data.hasMore
  }
  catch {
    // Drawer should not crash the reader; leave the list as-is.
  }
  finally {
    loading.value = false
    loaded.value = true
  }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return chapters.value
  return chapters.value.filter(
    (c) => c.title.toLowerCase().includes(q) || String(c.chapterNumber).includes(q),
  )
})

function scrollToCurrent() {
  const el = listEl.value?.querySelector('[data-current="true"]') as HTMLElement | null
  el?.scrollIntoView({ block: 'center' })
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    if (!loaded.value) {
      loadPage(true).then(() => nextTick(scrollToCurrent))
    }
    else {
      nextTick(scrollToCurrent)
    }
  },
)

function toggleSort() {
  sortDesc.value = !sortDesc.value
  nextCursor.value = null
  hasMore.value = true
  loadPage(true)
}

function onOpenChange(value: boolean) {
  emit('update:open', value)
}
</script>

<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        class="fixed inset-y-0 right-0 z-[71] flex w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
      >
        <div class="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <DialogTitle class="text-sm font-semibold">Оглавление</DialogTitle>
            <DialogDescription class="text-xs text-muted-foreground">
              {{ chapters.length }} {{ chapters.length === 1 ? 'глава' : 'глав' }} загружено
            </DialogDescription>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              :title="sortDesc ? 'Сначала старые' : 'Сначала новые'"
              @click="toggleSort"
            >
              <ArrowDownUp class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              title="Закрыть"
              @click="onOpenChange(false)"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="border-b border-border p-3">
          <div class="relative">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="search"
              type="text"
              placeholder="Поиск по номеру или названию"
              class="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div ref="listEl" class="flex-1 overflow-y-auto px-2 py-2">
          <NuxtLink
            v-for="chapter in filtered"
            :key="chapter.id"
            :to="`/books/${bookId}/read/${chapter.id}`"
            :data-current="chapter.id === currentChapterId"
            class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="chapter.id === currentChapterId
              ? 'bg-primary/10 text-primary'
              : 'text-foreground hover:bg-accent/10'"
            @click="onOpenChange(false)"
          >
            <span class="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
              {{ chapter.chapterNumber }}
            </span>
            <span class="line-clamp-1 flex-1">{{ chapter.title }}</span>
            <Check v-if="chapter.id === currentChapterId" class="h-4 w-4 shrink-0" />
          </NuxtLink>

          <div v-if="loading" class="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 class="h-4 w-4 animate-spin" />
            Загрузка…
          </div>

          <div v-else-if="!filtered.length" class="py-10 text-center text-sm text-muted-foreground">
            Ничего не найдено
          </div>

          <button
            v-if="hasMore && !loading && !search"
            type="button"
            class="mt-1 w-full rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            @click="loadPage(false)"
          >
            Показать ещё
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
