<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { ChapterDetailDto, ChapterVersionDto, ChapterVersionDetailDto } from '~/types'
import { useChapterVersions } from '~/composables/useChapterVersions'

const route = useRoute()
const bookId = computed(() => route.params.bookId as string)
const chapterId = computed(() => route.params.chapterId as string)

const { listVersions, getVersion } = useChapterVersions()

const { data: chapter } = await useApiFetch<ChapterDetailDto>(
  () => `/api/chapters/${chapterId.value}`,
)

const versions = ref<ChapterVersionDto[]>([])
versions.value = (await listVersions(chapterId.value)) ?? []

// Опции выбора: каноническая + все версии.
const options = computed(() => [
  { id: '', label: 'Оригинал (каноническая)' },
  ...versions.value.map((v) => ({ id: v.id, label: `${v.teamName || 'Без команды'} · ${v.score}` })),
])

const leftId = ref<string>('')
const rightId = ref<string>(versions.value[0]?.id ?? '')

const leftPane = ref<{ title: string; content: string } | null>(null)
const rightPane = ref<{ title: string; content: string } | null>(null)

async function resolvePane(id: string): Promise<{ title: string; content: string } | null> {
  if (!id) {
    if (!chapter.value) return null
    return { title: chapter.value.title, content: chapter.value.content }
  }
  const d: ChapterVersionDetailDto | null = await getVersion(id)
  return d ? { title: d.title, content: d.content } : null
}

watch(leftId, async (id) => { leftPane.value = await resolvePane(id) }, { immediate: true })
watch(rightId, async (id) => { rightPane.value = await resolvePane(id) }, { immediate: true })

function toParagraphs(text: string): string[] {
  return text.split('\n').map((p) => p.trim()).filter(Boolean)
}

useHead({ title: 'Сравнение версий — LibNode' })
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div class="app-container flex h-14 items-center gap-3">
        <Button as-child variant="ghost" size="sm" class="gap-1.5">
          <NuxtLink :to="`/books/${bookId}/read/${chapterId}`">
            <ArrowLeft class="h-4 w-4" />
            <span class="hidden sm:inline">К чтению</span>
          </NuxtLink>
        </Button>
        <h1 class="truncate text-sm font-medium">Сравнение версий перевода</h1>
      </div>
    </header>

    <main class="app-container py-6">
      <div v-if="!versions.length" class="py-20 text-center text-muted-foreground">
        У этой главы пока только одна версия — сравнивать нечего.
      </div>

      <div v-else class="grid gap-5 md:grid-cols-2">
        <section
          v-for="pane in [{ id: 'left', data: leftPane }, { id: 'right', data: rightPane }]"
          :key="pane.id"
          class="min-w-0"
        >
          <select
            class="mb-4 w-full rounded-lg border bg-card px-3 py-2 text-sm"
            :value="pane.id === 'left' ? leftId : rightId"
            @change="(e) => pane.id === 'left' ? (leftId = (e.target as HTMLSelectElement).value) : (rightId = (e.target as HTMLSelectElement).value)"
          >
            <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>

          <article v-if="pane.data" class="rounded-xl border bg-card p-5">
            <h2 class="mb-4 text-lg font-semibold tracking-tight">{{ pane.data.title }}</h2>
            <p v-for="(p, i) in toParagraphs(pane.data.content)" :key="i" class="mb-3 text-[15px] leading-relaxed">
              {{ p }}
            </p>
          </article>
          <div v-else class="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Загрузка…
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
