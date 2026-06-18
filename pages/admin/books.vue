<script setup lang="ts">
import { Loader2, Plus, BookMarked, ExternalLink } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { BookType } from '~/types'
import type { BookDto, CreateBookDto, CursorPagedResult } from '~/types'
import { bookTypeLabels } from '~/lib/enums'

definePageMeta({ middleware: ['admin'] })
useHead({ title: 'Книги — Админка' })

const { toast } = useToast()

const books = ref<BookDto[]>([])
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)

const form = reactive<CreateBookDto>({
  title: '',
  description: '',
  coverUrl: '',
  type: BookType.Japan,
})
const creating = ref(false)

const typeOptions = Object.entries(bookTypeLabels).map(([value, label]) => ({
  value: Number(value) as BookType,
  label,
}))

async function fetchPage(reset: boolean) {
  const cursor = reset ? null : nextCursor.value
  const cursorPart = cursor ? `&cursor=${cursor}` : ''
  const res = await executeApiRequest<CursorPagedResult<BookDto>>(
    `/api/books?limit=24${cursorPart}`,
    { key: `admin-books:${cursor ?? 'init'}` },
  )
  if (!res) return
  books.value = reset ? res.items : [...books.value, ...res.items]
  nextCursor.value = res.nextCursor
  hasMore.value = res.hasMore
}

async function load() {
  loading.value = true
  try {
    await fetchPage(true)
  }
  finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    await fetchPage(false)
  }
  finally {
    loadingMore.value = false
  }
}

async function createBook() {
  if (!form.title.trim() || creating.value) return
  creating.value = true
  try {
    const payload: CreateBookDto = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      coverUrl: form.coverUrl?.trim() || null,
      type: form.type,
    }
    const created = await executeApiRequest<BookDto>('/api/books', { method: 'POST', body: payload })
    if (created) {
      books.value.unshift(created)
      form.title = ''
      form.description = ''
      form.coverUrl = ''
      toast('Книга создана')
    }
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось создать книгу'
    toast({ variant: 'destructive', title: message })
  }
  finally {
    creating.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Книги">
    <!-- Create form -->
    <section class="mb-8 rounded-2xl border border-border bg-background p-5">
      <div class="mb-4 flex items-center gap-2">
        <Plus class="h-5 w-5 text-primary" />
        <h2 class="text-lg font-semibold tracking-tight">Новая книга</h2>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs font-medium text-muted-foreground">Название *</label>
          <Input v-model="form.title" placeholder="Название книги" @keydown.enter="createBook" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-muted-foreground">Тип</label>
          <select
            v-model.number="form.type"
            class="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          >
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-muted-foreground">URL обложки</label>
          <Input v-model="form.coverUrl" placeholder="https://…" />
        </div>
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs font-medium text-muted-foreground">Описание</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            placeholder="Аннотация…"
          ></textarea>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <Button :disabled="!form.title.trim() || creating" @click="createBook">
          <Loader2 v-if="creating" class="mr-1.5 h-4 w-4 animate-spin" />
          <Plus v-else class="mr-1.5 h-4 w-4" />
          Создать
        </Button>
      </div>
    </section>

    <!-- Books list -->
    <section>
      <div class="mb-4 flex items-center gap-2">
        <BookMarked class="h-5 w-5 text-primary" />
        <h2 class="text-lg font-semibold tracking-tight">Каталог</h2>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="books.length" class="space-y-2">
        <NuxtLink
          v-for="b in books"
          :key="b.id"
          :to="`/admin/books/${b.id}`"
          class="group flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 transition-colors hover:border-primary/40"
        >
          <div class="h-12 w-9 shrink-0 overflow-hidden rounded-md bg-secondary">
            <img v-if="b.coverUrl" :src="b.coverUrl" :alt="b.title" class="h-full w-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ b.title }}</p>
            <p class="text-xs text-muted-foreground">{{ bookTypeLabels[b.type] }} · {{ b.chapterCount }} гл.</p>
          </div>
          <ExternalLink class="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </NuxtLink>

        <div v-if="hasMore" class="flex justify-center pt-2">
          <Button variant="outline" size="sm" :disabled="loadingMore" @click="loadMore">
            <Loader2 v-if="loadingMore" class="mr-1.5 h-4 w-4 animate-spin" />
            Показать ещё
          </Button>
        </div>
      </div>

      <div v-else class="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        Книг пока нет.
      </div>
    </section>
  </AdminShell>
</template>
