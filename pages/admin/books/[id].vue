<script setup lang="ts">
import { Loader2, Save, Plus, Pencil, Trash2, ArrowLeft, BookOpen, X } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { BookType } from '~/types'
import type {
  BookDetailDto,
  ChapterListDto,
  ChapterDetailDto,
  CursorPagedResult,
  UpdateBookDto,
} from '~/types'
import {
  bookTypeLabels,
  originalStatusLabels,
  translationStatusLabels,
} from '~/lib/enums'

definePageMeta({ middleware: ['admin'] })

const route = useRoute()
const bookId = route.params.id as string
const { toast } = useToast()
const { updateBook, createChapter, updateChapter, deleteChapter, uploadCover } = useAdmin()
const { configured: mediaConfigured, fetchConfig: fetchMediaConfig } = useMediaConfig()
fetchMediaConfig()

const uploadingCover = ref(false)
function onMediaInvalid(msg: string) {
  toast({ description: msg, variant: 'destructive' })
}
async function onCoverFile(file: File) {
  uploadingCover.value = true
  try {
    const res = await uploadCover(bookId, file)
    if (res?.coverUrl) {
      form.coverUrl = res.coverUrl
      toast('Обложка загружена')
    }
  }
  catch (err: any) {
    toast({ description: err?.data?.error || 'Не удалось загрузить обложку', variant: 'destructive' })
  }
  finally {
    uploadingCover.value = false
  }
}

const book = ref<BookDetailDto | null>(null)
const chapters = ref<ChapterListDto[]>([])
const loading = ref(true)
const savingBook = ref(false)

const form = reactive<UpdateBookDto>({
  title: '',
  description: '',
  coverUrl: '',
  type: BookType.Japan,
  originalStatus: 0,
  translationStatus: 0,
})

const typeOptions = Object.entries(bookTypeLabels).map(([v, l]) => ({ value: Number(v), label: l }))
const originalOptions = Object.entries(originalStatusLabels).map(([v, l]) => ({ value: Number(v), label: l }))
const translationOptions = Object.entries(translationStatusLabels).map(([v, l]) => ({ value: Number(v), label: l }))

async function load() {
  loading.value = true
  try {
    const [b, ch] = await Promise.all([
      executeApiRequest<BookDetailDto>(`/api/books/${bookId}`, { key: `admin-book:${bookId}` }),
      executeApiRequest<CursorPagedResult<ChapterListDto, number>>(`/api/books/${bookId}/chapters?limit=100&sortDesc=false`, { key: `admin-book-chapters:${bookId}` }),
    ])
    book.value = b ?? null
    chapters.value = ch?.items ?? []
    if (b) {
      form.title = b.title
      form.description = b.description ?? ''
      form.coverUrl = b.coverUrl ?? ''
      form.type = b.type
      form.originalStatus = b.originalStatus
      form.translationStatus = b.translationStatus
    }
  }
  finally {
    loading.value = false
  }
}

useHead(() => ({ title: book.value ? `Редактор: ${book.value.title}` : 'Редактор тайтла' }))

async function saveBook() {
  if (savingBook.value) return
  savingBook.value = true
  try {
    await updateBook(bookId, {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      coverUrl: form.coverUrl?.trim() || null,
      type: form.type,
      originalStatus: form.originalStatus,
      translationStatus: form.translationStatus,
    })
    toast('Тайтл сохранён')
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось сохранить'
    toast({ variant: 'destructive', title: message })
  }
  finally {
    savingBook.value = false
  }
}

// ── Chapter editor ──────────────────────────────────────
const editorOpen = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const editorBusy = ref(false)
const editingId = ref<string | null>(null)
const chForm = reactive({ title: '', chapterNumber: 1, content: '', isPublished: true })

function openCreate() {
  editorMode.value = 'create'
  editingId.value = null
  const maxNum = chapters.value.reduce((m, c) => Math.max(m, c.chapterNumber), 0)
  chForm.title = ''
  chForm.chapterNumber = maxNum + 1
  chForm.content = ''
  chForm.isPublished = true
  editorOpen.value = true
}

async function openEdit(chapter: ChapterListDto) {
  editorMode.value = 'edit'
  editingId.value = chapter.id
  editorOpen.value = true
  editorBusy.value = true
  try {
    const full = await executeApiRequest<ChapterDetailDto>(`/api/chapters/${chapter.id}`, { key: `admin-chapter:${chapter.id}` })
    chForm.title = full?.title ?? chapter.title
    chForm.chapterNumber = full?.chapterNumber ?? chapter.chapterNumber
    chForm.content = full?.content ?? ''
    chForm.isPublished = full?.isPublished ?? chapter.isPublished
  }
  finally {
    editorBusy.value = false
  }
}

async function saveChapter() {
  if (!chForm.title.trim() || !chForm.content.trim() || editorBusy.value) return
  editorBusy.value = true
  try {
    if (editorMode.value === 'create') {
      const created = await createChapter({ bookId, title: chForm.title.trim(), content: chForm.content, chapterNumber: chForm.chapterNumber, isPublished: chForm.isPublished })
      if (created) {
        chapters.value.push({ id: created.id, bookId, title: created.title, chapterNumber: created.chapterNumber, createdAt: created.createdAt, likesCount: 0, isLikedByCurrentUser: false, isPublished: chForm.isPublished })
        chapters.value.sort((a, b) => a.chapterNumber - b.chapterNumber)
      }
      toast(chForm.isPublished ? 'Глава опубликована' : 'Черновик сохранён')
    }
    else if (editingId.value) {
      await updateChapter(editingId.value, { title: chForm.title.trim(), content: chForm.content, chapterNumber: chForm.chapterNumber, isPublished: chForm.isPublished })
      const c = chapters.value.find((x) => x.id === editingId.value)
      if (c) { c.title = chForm.title.trim(); c.chapterNumber = chForm.chapterNumber; c.isPublished = chForm.isPublished }
      chapters.value.sort((a, b) => a.chapterNumber - b.chapterNumber)
      toast('Глава сохранена')
    }
    editorOpen.value = false
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось сохранить главу'
    toast({ variant: 'destructive', title: message })
  }
  finally {
    editorBusy.value = false
  }
}

async function removeChapter(chapter: ChapterListDto) {
  if (!window.confirm(`Удалить главу «${chapter.title}»?`)) return
  try {
    await deleteChapter(chapter.id)
    chapters.value = chapters.value.filter((x) => x.id !== chapter.id)
    toast('Глава удалена')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось удалить главу' })
  }
}

onMounted(load)
</script>

<template>
  <AdminShell :title="book?.title || 'Редактор тайтла'">
    <NuxtLink to="/admin/books" class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft class="h-4 w-4" /> К книгам
    </NuxtLink>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="book" class="space-y-8">
      <!-- Book metadata editor -->
      <section class="rounded-2xl border border-border bg-background p-5">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Pencil class="h-5 w-5 text-primary" /> Метаданные тайтла
        </h3>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Название</label>
            <Input v-model="form.title" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Обложка</label>
            <MediaDropzone
              v-if="mediaConfigured"
              shape="cover"
              :preview-url="form.coverUrl || null"
              :uploading="uploadingCover"
              label="Перетащите, вставьте или выберите обложку"
              @file="onCoverFile"
              @invalid="onMediaInvalid"
            />
            <p v-else class="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Загрузка файлов недоступна (хранилище не настроено). Можно указать URL ниже.
            </p>
            <Input v-model="form.coverUrl" class="mt-2" placeholder="…или URL обложки https://…" />
            <p class="mt-1 text-xs text-muted-foreground">Обложка сохраняется сразу после загрузки.</p>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Тип</label>
            <select v-model.number="form.type" class="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option v-for="o in typeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Статус оригинала</label>
            <select v-model.number="form.originalStatus" class="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option v-for="o in originalOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Статус перевода</label>
            <select v-model.number="form.translationStatus" class="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option v-for="o in translationOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Описание</label>
            <textarea v-model="form.description" rows="4" class="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"></textarea>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <Button :disabled="!form.title.trim() || savingBook" @click="saveBook">
            <Loader2 v-if="savingBook" class="mr-1.5 h-4 w-4 animate-spin" />
            <Save v-else class="mr-1.5 h-4 w-4" />
            Сохранить
          </Button>
        </div>
      </section>

      <!-- Chapters -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <BookOpen class="h-5 w-5 text-primary" /> Главы ({{ chapters.length }})
          </h3>
          <Button size="sm" @click="openCreate">
            <Plus class="mr-1.5 h-4 w-4" /> Добавить главу
          </Button>
        </div>

        <div v-if="chapters.length" class="space-y-2">
          <div
            v-for="c in chapters"
            :key="c.id"
            class="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-secondary text-xs font-medium">{{ c.chapterNumber }}</span>
            <span class="min-w-0 flex-1 truncate text-sm">{{ c.title }}</span>
            <span
              v-if="!c.isPublished"
              class="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-500"
            >Черновик</span>
            <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary" title="Редактировать" @click="openEdit(c)">
              <Pencil class="h-4 w-4" />
            </button>
            <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive" title="Удалить" @click="removeChapter(c)">
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
        <p v-else class="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Глав пока нет.
        </p>
      </section>
    </div>

    <div v-else class="py-16 text-center text-muted-foreground">Тайтл не найден.</div>

    <!-- Chapter editor modal -->
    <Teleport to="body">
      <div v-if="editorOpen" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="editorOpen = false"></div>
        <div class="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-background shadow-2xl">
          <div class="flex items-center justify-between border-b border-border px-4 py-3">
            <h4 class="font-semibold">{{ editorMode === 'create' ? 'Новая глава' : 'Редактирование главы' }}</h4>
            <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10" @click="editorOpen = false">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="flex-1 space-y-3 overflow-y-auto p-4">
            <div class="flex gap-3">
              <div class="w-24">
                <label class="mb-1 block text-xs font-medium text-muted-foreground">Номер</label>
                <Input v-model.number="chForm.chapterNumber" type="number" min="1" />
              </div>
              <div class="flex-1">
                <label class="mb-1 block text-xs font-medium text-muted-foreground">Заголовок</label>
                <Input v-model="chForm.title" placeholder="Название главы" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-muted-foreground">Текст главы</label>
              <textarea
                v-model="chForm.content"
                rows="16"
                placeholder="Текст главы (абзацы разделяются переводом строки)…"
                class="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
              ></textarea>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input v-model="chForm.isPublished" type="checkbox" class="h-4 w-4" />
              <span :class="chForm.isPublished ? 'text-foreground' : 'text-amber-500'">
                {{ chForm.isPublished ? 'Опубликовано' : 'Черновик' }}
              </span>
            </label>
            <div class="flex items-center gap-2">
              <Button variant="ghost" @click="editorOpen = false">Отмена</Button>
              <Button :disabled="!chForm.title.trim() || !chForm.content.trim() || editorBusy" @click="saveChapter">
                <Loader2 v-if="editorBusy" class="mr-1.5 h-4 w-4 animate-spin" />
                <Save v-else class="mr-1.5 h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminShell>
</template>
