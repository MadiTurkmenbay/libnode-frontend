<script setup lang="ts">
import { Star, Loader2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import type { RatingAggregateDto, ReviewDto } from '~/types'
import { useRatings } from '~/composables/useRatings'
import { formatRelativeTime } from '~/lib/formatters'

const props = defineProps<{ bookId: string }>()

const { getAggregate, rate, listReviews } = useRatings()
const { isAuthenticated } = useAuth()
const { toast } = useToast()

const agg = ref<RatingAggregateDto | null>(null)
const reviews = ref<ReviewDto[]>([])
const cursor = ref<string | null>(null)
const hasMore = ref(false)
const loadingReviews = ref(false)

// Форма оценки.
const myValue = ref(0)
const hover = ref(0)
const myReview = ref('')
const saving = ref(false)

async function loadAgg() {
  agg.value = await getAggregate(props.bookId).catch(() => null)
  if (agg.value) {
    myValue.value = agg.value.myValue ?? 0
    myReview.value = agg.value.myReview ?? ''
  }
}
async function loadReviews(reset = false) {
  if (loadingReviews.value) return
  loadingReviews.value = true
  try {
    if (reset) { reviews.value = []; cursor.value = null }
    const res = await listReviews(props.bookId, cursor.value, 10)
    reviews.value.push(...(res?.items ?? []))
    cursor.value = res?.nextCursor ?? null
    hasMore.value = res?.hasMore ?? false
  }
  finally {
    loadingReviews.value = false
  }
}
await loadAgg()
await loadReviews(true)

const distPct = (star: number) => {
  if (!agg.value || !agg.value.count) return 0
  return Math.round(((agg.value.distribution[star - 1] ?? 0) / agg.value.count) * 100)
}

async function submit() {
  if (!myValue.value) {
    toast({ description: 'Поставьте оценку (1–5)', variant: 'destructive' })
    return
  }
  saving.value = true
  try {
    const res = await rate(props.bookId, myValue.value, myReview.value.trim() || null)
    if (res) agg.value = res
    await loadReviews(true)
    toast('Спасибо за оценку!')
  }
  catch (e: any) {
    toast({ description: e?.data?.error || 'Не удалось сохранить оценку', variant: 'destructive' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <!-- Summary + distribution -->
    <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div class="text-center sm:w-32">
        <div class="text-4xl font-bold">{{ agg?.average?.toFixed(1) ?? '—' }}</div>
        <div class="mt-1 flex justify-center">
          <Star v-for="i in 5" :key="i" class="h-4 w-4" :class="(agg?.average ?? 0) >= i - 0.5 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'" />
        </div>
        <div class="mt-1 text-xs text-muted-foreground">{{ agg?.count ?? 0 }} оценок</div>
      </div>
      <div class="flex-1 space-y-1">
        <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2 text-xs">
          <span class="w-3 text-muted-foreground">{{ star }}</span>
          <Star class="h-3 w-3 text-amber-400" />
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full bg-amber-400 transition-all" :style="{ width: `${distPct(star)}%` }"></div>
          </div>
          <span class="w-8 text-right text-muted-foreground">{{ agg?.distribution?.[star - 1] ?? 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Rate form -->
    <div v-if="isAuthenticated" class="rounded-xl border border-border bg-card p-4">
      <div class="mb-2 text-sm font-medium">Ваша оценка</div>
      <div class="mb-3 flex gap-1" @mouseleave="hover = 0">
        <button v-for="i in 5" :key="i" type="button" @click="myValue = i" @mouseenter="hover = i">
          <Star class="h-7 w-7 transition-colors" :class="(hover || myValue) >= i ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40 hover:text-amber-400'" />
        </button>
      </div>
      <textarea
        v-model="myReview"
        rows="3"
        maxlength="2000"
        placeholder="Необязательный отзыв…"
        class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
      ></textarea>
      <Button class="mt-3 gap-1.5" :disabled="saving" @click="submit">
        <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
        <Star v-else class="h-4 w-4" />
        {{ agg?.myValue ? 'Обновить оценку' : 'Оценить' }}
      </Button>
    </div>

    <!-- Reviews -->
    <div v-if="reviews.length" class="space-y-3">
      <h3 class="text-sm font-semibold">Отзывы</h3>
      <div v-for="r in reviews" :key="r.userId" class="rounded-xl border border-border bg-card p-4">
        <div class="mb-1.5 flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            <img v-if="r.avatarThumbUrl" :src="r.avatarThumbUrl" alt="" class="h-full w-full object-cover" />
            <template v-else>{{ r.username.slice(0, 2).toUpperCase() }}</template>
          </span>
          <span class="text-sm font-medium">{{ r.username }}</span>
          <span class="flex">
            <Star v-for="i in 5" :key="i" class="h-3.5 w-3.5" :class="r.value >= i ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'" />
          </span>
          <span class="ml-auto text-[11px] text-muted-foreground">{{ formatRelativeTime(r.updatedAt) }}</span>
        </div>
        <p class="whitespace-pre-line text-sm">{{ r.review }}</p>
      </div>
      <div v-if="hasMore" class="flex justify-center">
        <Button variant="outline" size="sm" :disabled="loadingReviews" @click="loadReviews(false)">Ещё отзывы</Button>
      </div>
    </div>
  </section>
</template>
