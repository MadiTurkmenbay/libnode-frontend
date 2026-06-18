<script setup lang="ts">
import { Loader2, Flag, Check, Trash2, ExternalLink } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { Button } from '~/components/ui/button'
import type { CommentReportDto, CursorPagedResult } from '~/types'
import { formatRelativeTime } from '~/lib/formatters'

definePageMeta({ middleware: ['admin'] })
useHead({ title: 'Жалобы — Админка' })

const { toast } = useToast()
const { deleteComment } = useComments()

const reports = ref<CommentReportDto[]>([])
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const showResolved = ref(false)
const busy = ref<string | null>(null)

async function fetchPage(reset: boolean) {
  const params = new URLSearchParams()
  params.set('limit', '30')
  params.set('resolved', String(showResolved.value))
  if (!reset && nextCursor.value) params.set('cursor', nextCursor.value)
  const res = await executeApiRequest<CursorPagedResult<CommentReportDto, string>>(
    `/api/admin/comment-reports?${params.toString()}`,
    { key: `admin-reports:${showResolved.value}:${reset ? 'init' : nextCursor.value}` },
  )
  if (!res) return
  reports.value = reset ? res.items : [...reports.value, ...res.items]
  nextCursor.value = res.nextCursor
  hasMore.value = res.hasMore
}

async function load() {
  loading.value = true
  try { await fetchPage(true) }
  finally { loading.value = false }
}

watch(showResolved, load)

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try { await fetchPage(false) }
  finally { loadingMore.value = false }
}

async function resolve(r: CommentReportDto) {
  busy.value = r.id
  try {
    await executeApiRequest<void>(`/api/admin/comment-reports/${r.id}/resolve`, { method: 'POST' })
    reports.value = reports.value.filter((x) => x.id !== r.id)
    toast('Жалоба закрыта')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось закрыть' })
  }
  finally {
    busy.value = null
  }
}

async function removeComment(r: CommentReportDto) {
  if (!window.confirm('Удалить комментарий и закрыть жалобу?')) return
  busy.value = r.id
  try {
    await deleteComment(r.commentId)
    reports.value = reports.value.filter((x) => x.id !== r.id)
    toast('Комментарий удалён')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось удалить' })
  }
  finally {
    busy.value = null
  }
}

function reportLink(r: CommentReportDto) {
  return r.chapterId ? `/books/${r.bookId}/read/${r.chapterId}` : `/books/${r.bookId}`
}

onMounted(load)
</script>

<template>
  <AdminShell title="Жалобы">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Flag class="h-5 w-5 text-primary" />
        <h2 class="text-xl font-bold tracking-tight">Жалобы на комментарии</h2>
      </div>
      <label class="flex items-center gap-2 text-sm text-muted-foreground">
        <input v-model="showResolved" type="checkbox" class="h-4 w-4" />
        Показать закрытые
      </label>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="reports.length" class="space-y-2.5">
      <div v-for="r in reports" :key="r.id" class="rounded-xl border border-border bg-background p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-xs text-muted-foreground">
              <span class="font-medium text-foreground">{{ r.reporterUsername }}</span> пожаловался ·
              {{ formatRelativeTime(r.createdAt) }}
            </p>
            <p class="mt-1 text-sm font-medium text-destructive">Причина: {{ r.reason }}</p>
            <div class="mt-2 rounded-lg bg-muted/40 p-2.5">
              <p class="text-xs text-muted-foreground">Автор: {{ r.commentAuthor }}</p>
              <p class="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm">{{ r.commentContent }}</p>
            </div>
          </div>
          <NuxtLink :to="reportLink(r)" class="shrink-0 text-muted-foreground hover:text-primary" title="Открыть">
            <ExternalLink class="h-4 w-4" />
          </NuxtLink>
        </div>
        <div v-if="!r.isResolved" class="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="outline" :disabled="busy === r.id" @click="resolve(r)">
            <Check class="mr-1.5 h-4 w-4" /> Закрыть
          </Button>
          <Button size="sm" variant="ghost" class="text-destructive hover:bg-destructive/10" :disabled="busy === r.id" @click="removeComment(r)">
            <Trash2 class="mr-1.5 h-4 w-4" /> Удалить коммент
          </Button>
        </div>
      </div>

      <div v-if="hasMore" class="flex justify-center pt-2">
        <Button variant="outline" size="sm" :disabled="loadingMore" @click="loadMore">
          <Loader2 v-if="loadingMore" class="mr-1.5 h-4 w-4 animate-spin" />
          Показать ещё
        </Button>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
      {{ showResolved ? 'Закрытых жалоб нет.' : 'Открытых жалоб нет.' }}
    </div>
  </AdminShell>
</template>
