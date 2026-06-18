<script setup lang="ts">
import { BarChart3, Timer, BookText, Hourglass } from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import type { BookDetailDto } from '~/types'
import { useReadingStats, formatDuration } from '~/composables/useReadingStats'

const props = defineProps<{
  bookId: string
  chapterNumber: number
  chapterWords: number
  surfaceClass?: string
}>()

const WPM = 200
const bookId = toRef(props, 'bookId')
const { sessionSeconds, totalSeconds } = useReadingStats(bookId)

const chapterCount = ref(0)
onMounted(async () => {
  const b = await executeApiRequest<BookDetailDto>(`/api/books/${props.bookId}`, { key: `stats-book:${props.bookId}` }).catch(() => null)
  if (b) chapterCount.value = b.chapterCount
})

const chaptersLeft = computed(() => Math.max(0, chapterCount.value - props.chapterNumber))
const estMinutesLeft = computed(() => Math.round(chaptersLeft.value * (props.chapterWords / WPM)))
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-md border opacity-80 transition-opacity hover:opacity-100"
        :class="surfaceClass"
        title="Статистика чтения"
      >
        <BarChart3 class="h-4 w-4" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" :side-offset="8" class="w-64 p-3">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Статистика чтения</p>
      <div class="space-y-2 text-sm">
        <div class="flex items-center gap-2">
          <Timer class="h-4 w-4 text-primary" />
          <span class="flex-1 text-muted-foreground">За сессию</span>
          <span class="font-medium tabular-nums">{{ formatDuration(sessionSeconds) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Timer class="h-4 w-4 text-muted-foreground" />
          <span class="flex-1 text-muted-foreground">Всего над книгой</span>
          <span class="font-medium tabular-nums">{{ formatDuration(totalSeconds) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <BookText class="h-4 w-4 text-muted-foreground" />
          <span class="flex-1 text-muted-foreground">Слов в главе</span>
          <span class="font-medium tabular-nums">{{ chapterWords }}</span>
        </div>
        <div v-if="chapterCount" class="flex items-center gap-2">
          <Hourglass class="h-4 w-4 text-muted-foreground" />
          <span class="flex-1 text-muted-foreground">Осталось в книге</span>
          <span class="font-medium tabular-nums">{{ chaptersLeft }} гл · ~{{ estMinutesLeft }} мин</span>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
