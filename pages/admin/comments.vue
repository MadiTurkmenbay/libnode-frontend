<script setup lang="ts">
import { Loader2, Trash2, MessageSquare } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { Button } from '~/components/ui/button'
import type { CommentDto, CursorPagedResult } from '~/types'
import { formatRelativeTime } from '~/lib/formatters'
import { getCommentRank } from '~/lib/commentRank'

definePageMeta({ middleware: ['admin'] })
useHead({ title: 'Модерация комментариев — Админка' })

const { toast } = useToast()
const { deleteComment } = useComments()

const comments = ref<CommentDto[]>([])
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)

async function fetchPage(reset: boolean) {
  const cursor = reset ? null : nextCursor.value
  const cursorPart = cursor ? `&cursor=${cursor}` : ''
  const res = await executeApiRequest<CursorPagedResult<CommentDto, string>>(
    `/api/admin/comments?limit=30${cursorPart}`,
    { key: `admin-comments:${cursor ?? 'init'}` },
  )
  if (!res) return
  comments.value = reset ? res.items : [...comments.value, ...res.items]
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

async function remove(comment: CommentDto) {
  if (!window.confirm('Удалить комментарий?')) return
  const idx = comments.value.findIndex((c) => c.id === comment.id)
  const removed = idx >= 0 ? comments.value.splice(idx, 1)[0] : null
  try {
    await deleteComment(comment.id)
    toast('Комментарий удалён')
  }
  catch {
    if (removed && idx >= 0) comments.value.splice(idx, 0, removed)
    toast({ variant: 'destructive', title: 'Не удалось удалить' })
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Комментарии">
    <div class="mb-5 flex items-center gap-2">
      <MessageSquare class="h-5 w-5 text-primary" />
      <h2 class="text-xl font-bold tracking-tight">Модерация</h2>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="comments.length" class="space-y-2.5">
      <div
        v-for="c in comments"
        :key="c.id"
        class="flex items-start gap-3 rounded-xl border border-border bg-background p-3.5"
      >
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span class="font-semibold text-foreground">{{ c.username }}</span>
            <span
              class="rounded-full px-1.5 py-0.5 font-medium"
              :class="c.chapterId ? 'bg-blue-500/10 text-blue-500' : 'bg-violet-500/10 text-violet-500'"
            >
              {{ c.chapterId ? 'глава' : 'тайтл' }}
            </span>
            <span v-if="getCommentRank(c.score)" class="text-muted-foreground">
              {{ getCommentRank(c.score)?.label }}
            </span>
            <span class="text-muted-foreground">· {{ c.score }} ★ · {{ formatRelativeTime(c.createdAt) }}</span>
          </div>
          <p class="mt-1 whitespace-pre-wrap break-words text-sm text-foreground/90">{{ c.content }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          title="Удалить"
          @click="remove(c)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>

      <div v-if="hasMore" class="flex justify-center pt-2">
        <Button variant="outline" size="sm" :disabled="loadingMore" @click="loadMore">
          <Loader2 v-if="loadingMore" class="mr-1.5 h-4 w-4 animate-spin" />
          Показать ещё
        </Button>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
      Комментариев пока нет.
    </div>
  </AdminShell>
</template>
