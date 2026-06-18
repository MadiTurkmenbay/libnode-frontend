<script setup lang="ts">
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription,
} from 'reka-ui'
import {
  Search, Home, Library, Bookmark, Quote, Mail, SunMoon, Shield, CornerDownLeft, BookOpen, Loader2,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import type { BookDto, CursorPagedResult } from '~/types'
import { useTheme } from '~/composables/useTheme'

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const books = ref<BookDto[]>([])
const searching = ref(false)

const { toggle: toggleTheme } = useTheme()
const { isAuthenticated, isAdmin } = useAuth()

interface Cmd {
  id: string
  label: string
  icon: Component
  to?: string
  action?: () => void
  show?: () => boolean
}

const allCommands: Cmd[] = [
  { id: 'home', label: 'Главная', icon: Home, to: '/' },
  { id: 'catalog', label: 'Каталог', icon: Library, to: '/catalog' },
  { id: 'collections', label: 'Мои закладки', icon: Bookmark, to: '/profile/collections', show: () => isAuthenticated.value },
  { id: 'quotes', label: 'Мои цитаты', icon: Quote, to: '/profile/quotes', show: () => isAuthenticated.value },
  { id: 'invites', label: 'Приглашения в команды', icon: Mail, to: '/profile/invites', show: () => isAuthenticated.value },
  { id: 'admin', label: 'Админка', icon: Shield, to: '/admin', show: () => isAdmin.value },
  { id: 'theme', label: 'Переключить тему', icon: SunMoon, action: () => toggleTheme() },
]

const filteredCommands = computed(() => {
  const q = query.value.trim().toLowerCase()
  return allCommands
    .filter((c) => (c.show ? c.show() : true))
    .filter((c) => !q || c.label.toLowerCase().includes(q))
})

// Flat list of selectable rows: commands then book results.
const rows = computed(() => [
  ...filteredCommands.value.map((c) => ({ kind: 'cmd' as const, cmd: c })),
  ...books.value.map((b) => ({ kind: 'book' as const, book: b })),
])

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(query, (q) => {
  activeIndex.value = 0
  if (searchTimer) clearTimeout(searchTimer)
  const term = q.trim()
  if (term.length < 2) {
    books.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      const res = await executeApiRequest<CursorPagedResult<BookDto>>(
        `/api/books?limit=6&search=${encodeURIComponent(term)}`,
        { key: `cmdk:${term}` },
      )
      books.value = res?.items ?? []
    }
    catch {
      books.value = []
    }
    finally {
      searching.value = false
    }
  }, 250)
})

function openPalette() {
  open.value = true
  query.value = ''
  books.value = []
  activeIndex.value = 0
}

function onGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value ? (open.value = false) : openPalette()
  }
}

function move(delta: number) {
  const n = rows.value.length
  if (n === 0) return
  activeIndex.value = (activeIndex.value + delta + n) % n
}

async function run(index: number) {
  const row = rows.value[index]
  if (!row) return
  open.value = false
  if (row.kind === 'book') {
    await navigateTo(`/books/${row.book.id}`)
  }
  else if (row.cmd.to) {
    await navigateTo(row.cmd.to)
  }
  else {
    row.cmd.action?.()
  }
}

function onInputKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
  else if (e.key === 'Enter') { e.preventDefault(); run(activeIndex.value) }
}

onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <DialogRoot :open="open" @update:open="(v) => (open = v)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogContent
        class="fixed left-1/2 top-[12vh] z-[91] w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        @open-auto-focus="(e: Event) => e.preventDefault()"
      >
        <DialogTitle class="sr-only">Командная палитра</DialogTitle>
        <DialogDescription class="sr-only">Поиск книг и быстрые действия</DialogDescription>

        <div class="flex items-center gap-2 border-b border-border px-3">
          <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            v-model="query"
            autofocus
            placeholder="Поиск книг, переходы, действия…"
            class="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            @keydown="onInputKey"
          />
          <Loader2 v-if="searching" class="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          <kbd class="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">Esc</kbd>
        </div>

        <div class="max-h-[60vh] overflow-y-auto p-2">
          <div v-if="!rows.length" class="py-10 text-center text-sm text-muted-foreground">
            Ничего не найдено
          </div>

          <template v-else>
            <p v-if="filteredCommands.length" class="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Действия</p>
            <button
              v-for="(row, i) in rows"
              :key="row.kind === 'book' ? row.book.id : row.cmd.id"
              type="button"
              class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors"
              :class="i === activeIndex ? 'bg-accent/15 text-foreground' : 'text-foreground/90 hover:bg-accent/10'"
              @mouseenter="activeIndex = i"
              @click="run(i)"
            >
              <template v-if="row.kind === 'cmd'">
                <component :is="row.cmd.icon" class="h-4 w-4 shrink-0 text-muted-foreground" />
                <span class="flex-1">{{ row.cmd.label }}</span>
              </template>
              <template v-else>
                <span class="flex h-8 w-6 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary">
                  <img v-if="row.book.coverThumbUrl || row.book.coverUrl" :src="row.book.coverThumbUrl || row.book.coverUrl || undefined" alt="" loading="lazy" class="h-full w-full object-cover" />
                  <BookOpen v-else class="h-3.5 w-3.5 text-muted-foreground/50" />
                </span>
                <span class="line-clamp-1 flex-1">{{ row.book.title }}</span>
                <span class="shrink-0 text-xs text-muted-foreground">{{ row.book.chapterCount }} гл.</span>
              </template>
              <CornerDownLeft v-if="i === activeIndex" class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </template>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
