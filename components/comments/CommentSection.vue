<script setup lang="ts">
import { MessageSquare, Loader2, Send, EyeOff } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import CommentItem from '~/components/comments/CommentItem.vue'
import type { CommentDto } from '~/types'
import { useComments } from '~/composables/useComments'

const props = defineProps<{
  bookId: string
  chapterId?: string | null
  title?: string
}>()

const {
  listBookComments,
  listChapterComments,
  reportComment,
  createBookComment,
  createChapterComment,
  voteComment,
  pinComment,
  deleteComment,
} = useComments()

const { isAuthenticated, isAdmin } = useAuth()
const { toast } = useToast()

const comments = ref<CommentDto[]>([])
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const submitting = ref(false)
const draft = ref('')

const isChapter = computed(() => !!props.chapterId)
const canPin = computed(() => isAdmin.value && !isChapter.value)

const sort = ref<'new' | 'top' | 'controversial'>('new')
const sortTabs = [
  { value: 'new' as const, label: 'Новые' },
  { value: 'top' as const, label: 'Топ' },
  { value: 'controversial' as const, label: 'Спорные' },
]

const sorted = computed(() =>
  [...comments.value].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)),
)

async function fetchPage(reset: boolean) {
  const cursor = reset ? null : nextCursor.value
  const res = isChapter.value
    ? await listChapterComments(props.chapterId as string, cursor, sort.value)
    : await listBookComments(props.bookId, cursor, sort.value)
  if (!res) return
  comments.value = reset ? res.items : [...comments.value, ...res.items]
  nextCursor.value = res.nextCursor
  hasMore.value = res.hasMore
}

function changeSort(value: 'new' | 'top' | 'controversial') {
  if (sort.value === value) return
  sort.value = value
  nextCursor.value = null
  hasMore.value = false
  loadInitial()
}

async function onReport(comment: CommentDto) {
  if (!import.meta.client) return
  const reason = window.prompt('Причина жалобы:')
  if (!reason || !reason.trim()) return
  try {
    await reportComment(comment.id, reason.trim())
    toast('Жалоба отправлена')
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось отправить жалобу'
    toast({ variant: 'destructive', title: message })
  }
}

async function loadInitial() {
  loading.value = true
  try {
    await fetchPage(true)
  }
  catch { /* empty state covers errors */ }
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
  catch { /* retryable */ }
  finally {
    loadingMore.value = false
  }
}

function insertSpoiler() {
  draft.value += '[spoiler]текст[/spoiler]'
}

async function submit() {
  const content = draft.value.trim()
  if (!content || submitting.value) return
  submitting.value = true
  try {
    const created = isChapter.value
      ? await createChapterComment(props.chapterId as string, content)
      : await createBookComment(props.bookId, content)
    if (created) {
      comments.value.unshift(created)
      draft.value = ''
      toast('Комментарий добавлен')
    }
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось отправить комментарий'
    toast({ variant: 'destructive', title: message })
  }
  finally {
    submitting.value = false
  }
}

async function onVote(comment: CommentDto, value: -1 | 0 | 1) {
  if (!isAuthenticated.value) {
    toast('Войдите, чтобы голосовать')
    return
  }
  const prevVote = comment.myVote
  const prevScore = comment.score
  comment.score += value - prevVote
  comment.myVote = value
  try {
    const res = await voteComment(comment.id, value)
    if (res) {
      comment.score = res.score
      comment.myVote = res.myVote
    }
  }
  catch {
    comment.myVote = prevVote
    comment.score = prevScore
    toast({ variant: 'destructive', title: 'Не удалось проголосовать' })
  }
}

async function onPin(comment: CommentDto) {
  try {
    const res = await pinComment(comment.id)
    const pinned = res?.isPinned ?? !comment.isPinned
    if (pinned) {
      for (const c of comments.value) c.isPinned = c.id === comment.id
    }
    else {
      comment.isPinned = false
    }
    toast(pinned ? 'Комментарий закреплён' : 'Комментарий откреплён')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось изменить закреп' })
  }
}

async function onReply(parent: CommentDto, content: string) {
  try {
    const created = isChapter.value
      ? await createChapterComment(props.chapterId as string, content, parent.id)
      : await createBookComment(props.bookId, content, parent.id)
    if (created) {
      parent.replies = [...(parent.replies ?? []), created]
      parent.replyCount += 1
      toast('Ответ добавлен')
    }
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось отправить ответ' })
  }
}

function removeFromTree(id: string): boolean {
  const idx = comments.value.findIndex((c) => c.id === id)
  if (idx >= 0) {
    comments.value.splice(idx, 1)
    return true
  }
  for (const c of comments.value) {
    if (!c.replies?.length) continue
    const ri = c.replies.findIndex((r) => r.id === id)
    if (ri >= 0) {
      c.replies.splice(ri, 1)
      c.replyCount = Math.max(0, c.replyCount - 1)
      return true
    }
  }
  return false
}

async function onDelete(comment: CommentDto) {
  if (import.meta.client && !window.confirm('Удалить комментарий?')) return
  try {
    await deleteComment(comment.id)
    removeFromTree(comment.id)
    toast('Комментарий удалён')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось удалить' })
  }
}

onMounted(loadInitial)
</script>

<template>
  <section class="space-y-4" aria-label="Комментарии">
    <div class="flex items-center gap-2">
      <MessageSquare class="h-5 w-5 text-primary" />
      <h2 class="text-lg font-semibold tracking-tight">{{ title || 'Комментарии' }}</h2>
    </div>

    <!-- Composer -->
    <div v-if="isAuthenticated" class="rounded-2xl border border-border bg-card p-3">
      <textarea
        v-model="draft"
        rows="3"
        maxlength="2000"
        placeholder="Поделитесь мнением… (спойлер: [spoiler]текст[/spoiler])"
        class="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        @keydown.ctrl.enter="submit"
        @keydown.meta.enter="submit"
      ></textarea>
      <div class="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-lg border border-input px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
          title="Вставить спойлер"
          @click="insertSpoiler"
        >
          <EyeOff class="h-3.5 w-3.5" /> Спойлер
        </button>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">{{ draft.length }}/2000</span>
          <Button size="sm" :disabled="!draft.trim() || submitting" @click="submit">
            <Loader2 v-if="submitting" class="mr-1.5 h-4 w-4 animate-spin" />
            <Send v-else class="mr-1.5 h-4 w-4" />
            Отправить
          </Button>
        </div>
      </div>
    </div>
    <div v-else class="rounded-2xl border border-dashed border-border bg-card/50 p-4 text-center text-sm text-muted-foreground">
      Войдите, чтобы оставить комментарий.
    </div>

    <!-- Sort tabs -->
    <div class="flex items-center gap-1">
      <button
        v-for="tab in sortTabs"
        :key="tab.value"
        type="button"
        class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        :class="sort === tab.value ? 'bg-accent/15 text-foreground' : 'text-muted-foreground hover:text-foreground'"
        @click="changeSort(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- List -->
    <div v-if="loading" class="flex justify-center py-8">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="sorted.length" class="space-y-3">
      <CommentItem
        v-for="comment in sorted"
        :key="comment.id"
        :comment="comment"
        :can-moderate="isAdmin"
        :can-pin="canPin"
        @vote="onVote"
        @delete="onDelete"
        @pin="onPin"
        @reply="onReply"
        @report="onReport"
      />

      <div v-if="hasMore" class="flex justify-center pt-1">
        <Button variant="outline" size="sm" :disabled="loadingMore" @click="loadMore">
          <Loader2 v-if="loadingMore" class="mr-1.5 h-4 w-4 animate-spin" />
          Показать ещё
        </Button>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
      Пока нет комментариев. Будьте первым!
    </div>
  </section>
</template>
