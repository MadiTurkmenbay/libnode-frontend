<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Trash2,
  Quote,
  Search,
  Copy,
  Check,
  BookOpen,
  ArrowUpDown,
  Pencil,
  X,
} from 'lucide-vue-next'
import type { QuoteDto } from '~/types'
import { formatRelativeTime } from '~/lib/formatters'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Мои цитаты — LibNode' })

const { toast } = useToast()
const { fetchQuotes, deleteQuote, updateQuote } = useQuotes()

const { data: quotes, pending, error, refresh } = await useAsyncData<QuoteDto[]>(
  'profile-quotes',
  () => fetchQuotes(),
)

const search = ref('')
const bookFilter = ref<string>('all')
const sortOrder = ref<'new' | 'old'>('new')

const bookOptions = computed(() => {
  const map = new Map<string, string>()
  for (const q of quotes.value ?? []) map.set(q.bookId, q.bookTitle)
  return Array.from(map, ([id, title]) => ({ id, title }))
})

const filtered = computed(() => {
  let list = [...(quotes.value ?? [])]
  if (bookFilter.value !== 'all') {
    list = list.filter((q) => q.bookId === bookFilter.value)
  }
  const term = search.value.trim().toLowerCase()
  if (term) {
    list = list.filter((q) =>
      q.selectedText.toLowerCase().includes(term)
      || (q.contextText?.toLowerCase().includes(term) ?? false)
      || (q.note?.toLowerCase().includes(term) ?? false)
      || q.bookTitle.toLowerCase().includes(term)
      || q.chapterTitle.toLowerCase().includes(term),
    )
  }
  list.sort((a, b) =>
    sortOrder.value === 'new'
      ? b.createdAt.localeCompare(a.createdAt)
      : a.createdAt.localeCompare(b.createdAt),
  )
  return list
})

const groups = computed(() => {
  const grouped = new Map<string, { bookId: string; bookTitle: string; quotes: QuoteDto[] }>()
  for (const q of filtered.value) {
    const g = grouped.get(q.bookId)
    if (g) g.quotes.push(q)
    else grouped.set(q.bookId, { bookId: q.bookId, bookTitle: q.bookTitle, quotes: [q] })
  }
  return Array.from(grouped.values())
})

const copiedId = ref<string | null>(null)
async function copyQuote(q: QuoteDto) {
  try {
    await navigator.clipboard.writeText(`«${q.selectedText}» — ${q.bookTitle}, гл. ${q.chapterNumber}`)
    copiedId.value = q.id
    setTimeout(() => (copiedId.value = copiedId.value === q.id ? null : copiedId.value), 1500)
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось скопировать' })
  }
}

const editingId = ref<string | null>(null)
const noteDraft = ref('')
function startEdit(q: QuoteDto) {
  editingId.value = q.id
  noteDraft.value = q.note ?? ''
}
function cancelEdit() {
  editingId.value = null
  noteDraft.value = ''
}
async function saveNote(q: QuoteDto) {
  try {
    await updateQuote(q.id, { note: noteDraft.value.trim() || null })
    q.note = noteDraft.value.trim() || null
    editingId.value = null
    toast('Заметка сохранена')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось сохранить заметку' })
  }
}

async function removeQuote(id: string) {
  if (import.meta.client && !window.confirm('Удалить цитату?')) return
  try {
    await deleteQuote(id)
    await refresh()
    toast('Цитата удалена')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось удалить цитату' })
  }
}
</script>

<template>
  <div class="app-container py-6 md:py-8">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
          <Quote class="h-7 w-7 text-primary" />
          Мои цитаты
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ quotes?.length ?? 0 }} сохранённых · показано {{ filtered.length }}
        </p>
      </div>
    </div>

    <!-- Toolbar -->
    <div v-if="quotes && quotes.length" class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="search"
          type="text"
          placeholder="Поиск по цитатам, заметкам, книгам…"
          class="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        />
      </div>
      <select
        v-model="bookFilter"
        class="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
      >
        <option value="all">Все книги</option>
        <option v-for="b in bookOptions" :key="b.id" :value="b.id">{{ b.title }}</option>
      </select>
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-input bg-background px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        @click="sortOrder = sortOrder === 'new' ? 'old' : 'new'"
      >
        <ArrowUpDown class="h-4 w-4" />
        {{ sortOrder === 'new' ? 'Сначала новые' : 'Сначала старые' }}
      </button>
    </div>

    <!-- States -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-28 animate-pulse rounded-2xl bg-muted/40"></div>
    </div>

    <div v-else-if="error" class="py-20 text-center">
      <p class="text-muted-foreground">Не удалось загрузить цитаты.</p>
      <Button class="mt-4" @click="refresh()">Повторить</Button>
    </div>

    <div v-else-if="!quotes || quotes.length === 0" class="rounded-2xl border border-dashed py-20 text-center">
      <Quote class="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
      <h2 class="mb-2 text-xl font-semibold">У вас пока нет цитат</h2>
      <p class="mb-6 text-muted-foreground">Выделяйте текст в читалке и сохраняйте понравившееся.</p>
      <Button as-child><NuxtLink to="/">Перейти к каталогу</NuxtLink></Button>
    </div>

    <div v-else-if="!filtered.length" class="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
      Ничего не найдено по запросу.
    </div>

    <!-- Grouped quotes -->
    <div v-else class="space-y-8">
      <section v-for="group in groups" :key="group.bookId" class="space-y-3">
        <div class="flex items-center gap-2 border-b border-border pb-2">
          <BookOpen class="h-4 w-4 text-muted-foreground" />
          <NuxtLink :to="`/books/${group.bookId}`" class="font-semibold transition-colors hover:text-primary">
            {{ group.bookTitle }}
          </NuxtLink>
          <span class="text-xs text-muted-foreground">· {{ group.quotes.length }}</span>
        </div>

        <article
          v-for="quote in group.quotes"
          :key="quote.id"
          class="group rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md sm:p-5"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <NuxtLink
              :to="`/books/${quote.bookId}/read/${quote.chapterId}`"
              class="truncate text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Глава {{ quote.chapterNumber }}: {{ quote.chapterTitle }}
            </NuxtLink>
            <div class="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                title="Копировать"
                @click="copyQuote(quote)"
              >
                <Check v-if="copiedId === quote.id" class="h-4 w-4 text-success" />
                <Copy v-else class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                title="Заметка"
                @click="startEdit(quote)"
              >
                <Pencil class="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Удалить"
                @click="removeQuote(quote.id)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <NuxtLink :to="`/books/${quote.bookId}/read/${quote.chapterId}`" class="block">
            <blockquote class="border-l-4 border-primary pl-4 text-base font-medium italic leading-relaxed text-foreground/90">
              «{{ quote.selectedText }}»
            </blockquote>
            <p v-if="quote.contextText" class="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {{ quote.contextText }}
            </p>
          </NuxtLink>

          <!-- Note (view / edit) -->
          <div v-if="editingId === quote.id" class="mt-3">
            <textarea
              v-model="noteDraft"
              rows="2"
              maxlength="2000"
              placeholder="Ваша заметка…"
              class="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            ></textarea>
            <div class="mt-2 flex justify-end gap-2">
              <Button size="sm" variant="ghost" @click="cancelEdit">
                <X class="mr-1 h-3.5 w-3.5" /> Отмена
              </Button>
              <Button size="sm" @click="saveNote(quote)">
                <Check class="mr-1 h-3.5 w-3.5" /> Сохранить
              </Button>
            </div>
          </div>
          <p v-else-if="quote.note" class="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground/80">
            <span class="font-medium">Заметка:</span> {{ quote.note }}
          </p>

          <p class="mt-3 text-xs text-muted-foreground">{{ formatRelativeTime(quote.createdAt) }}</p>
        </article>
      </section>
    </div>
  </div>
</template>
