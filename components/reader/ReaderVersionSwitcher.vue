<script setup lang="ts">
import { GitBranch, ArrowBigUp, ArrowBigDown, Check, Columns2 } from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import type { ChapterVersionDto, ChapterVersionDetailDto } from '~/types'
import { useChapterVersions } from '~/composables/useChapterVersions'

const props = defineProps<{ chapterId: string; bookId?: string; surfaceClass?: string }>()
const emit = defineEmits<{ select: [detail: ChapterVersionDetailDto | null] }>()

const { listVersions, getVersion, voteVersion } = useChapterVersions()
const { isAuthenticated } = useAuth()

const versions = ref<ChapterVersionDto[]>([])
const activeId = ref<string | null>(null) // null = каноническая версия

async function load() {
  try {
    versions.value = (await listVersions(props.chapterId)) ?? []
  }
  catch {
    versions.value = []
  }
}

watch(() => props.chapterId, () => {
  activeId.value = null
  load()
}, { immediate: true })

const activeLabel = computed(() => {
  if (!activeId.value) return 'Оригинал'
  const v = versions.value.find((x) => x.id === activeId.value)
  return v?.teamName || 'Версия'
})

async function pick(v: ChapterVersionDto | null) {
  if (!v) {
    activeId.value = null
    emit('select', null)
    return
  }
  activeId.value = v.id
  try {
    const detail = await getVersion(v.id)
    if (detail) emit('select', detail)
  }
  catch { /* keep canonical */ }
}

async function vote(v: ChapterVersionDto, value: -1 | 1) {
  if (!isAuthenticated.value) return
  const next = v.myVote === value ? 0 : value
  try {
    const res = await voteVersion(v.id, next)
    if (res) { v.score = res.score; v.myVote = res.myVote }
  }
  catch { /* ignore */ }
}
</script>

<template>
  <Popover v-if="versions.length">
    <PopoverTrigger as-child>
      <button
        class="inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium opacity-80 transition-opacity hover:opacity-100"
        :class="surfaceClass"
        title="Версии перевода"
      >
        <GitBranch class="h-4 w-4" />
        <span class="max-w-24 truncate">{{ activeLabel }}</span>
        <span class="rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">{{ versions.length + 1 }}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" :side-offset="8" class="w-72 p-1.5">
      <p class="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Версии перевода</p>

      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent/10"
        @click="pick(null)"
      >
        <span class="flex-1">Оригинал (каноническая)</span>
        <Check v-if="!activeId" class="h-4 w-4 text-primary" />
      </button>

      <div
        v-for="v in versions"
        :key="v.id"
        class="flex items-center gap-1 rounded-lg px-1 py-1 transition-colors"
        :class="activeId === v.id ? 'bg-accent/10' : ''"
      >
        <button type="button" class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left text-sm hover:bg-accent/10" @click="pick(v)">
          <span class="min-w-0 flex-1 truncate">{{ v.teamName || 'Без команды' }}</span>
          <Check v-if="activeId === v.id" class="h-4 w-4 shrink-0 text-primary" />
        </button>
        <div class="flex shrink-0 items-center">
          <button type="button" class="inline-flex h-6 w-6 items-center justify-center rounded" :class="v.myVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'" :disabled="!isAuthenticated" @click="vote(v, 1)">
            <ArrowBigUp class="h-4 w-4" :class="{ 'fill-current': v.myVote === 1 }" />
          </button>
          <span class="w-5 text-center text-xs tabular-nums">{{ v.score }}</span>
          <button type="button" class="inline-flex h-6 w-6 items-center justify-center rounded" :class="v.myVote === -1 ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'" :disabled="!isAuthenticated" @click="vote(v, -1)">
            <ArrowBigDown class="h-4 w-4" :class="{ 'fill-current': v.myVote === -1 }" />
          </button>
        </div>
      </div>

      <NuxtLink
        v-if="bookId"
        :to="`/books/${bookId}/compare/${chapterId}`"
        class="mt-1 flex items-center gap-2 rounded-lg border-t px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Columns2 class="h-4 w-4" />
        <span>Сравнить версии</span>
      </NuxtLink>
    </PopoverContent>
  </Popover>
</template>
