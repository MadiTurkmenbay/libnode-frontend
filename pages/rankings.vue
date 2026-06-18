<script setup lang="ts">
import { Trophy, Flame, Star, List, Sparkles, Loader2 } from 'lucide-vue-next'
import { RankingType } from '~/types'
import type { BookDto } from '~/types'
import { useRankings } from '~/composables/useRankings'

useHead({ title: 'Рейтинги — LibNode' })

const { get } = useRankings()

const tabs: { type: RankingType; label: string; icon: any }[] = [
  { type: RankingType.Popular, label: 'Популярные', icon: Flame },
  { type: RankingType.TopRated, label: 'Высокий рейтинг', icon: Star },
  { type: RankingType.MostChapters, label: 'Больше всего глав', icon: List },
  { type: RankingType.Newest, label: 'Новинки', icon: Sparkles },
]
const active = ref<RankingType>(RankingType.Popular)

const books = ref<BookDto[]>([])
const loading = ref(false)
const cache = new Map<RankingType, BookDto[]>()

async function load() {
  if (cache.has(active.value)) { books.value = cache.get(active.value)!; return }
  loading.value = true
  try {
    const res = (await get(active.value, 24)) ?? []
    cache.set(active.value, res)
    books.value = res
  }
  finally {
    loading.value = false
  }
}
watch(active, load, { immediate: true })
</script>

<template>
  <div class="app-container py-6 md:py-10">
    <div class="mb-6 flex items-center gap-3">
      <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Trophy class="h-6 w-6" />
      </span>
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Рейтинги</h1>
        <p class="text-sm text-muted-foreground">Лучшие тайтлы по разным метрикам</p>
      </div>
    </div>

    <div class="mb-5 flex flex-wrap gap-1 border-b border-border">
      <button
        v-for="t in tabs"
        :key="t.type"
        type="button"
        class="-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
        :class="active === t.type ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="active = t.type"
      >
        <component :is="t.icon" class="h-4 w-4" />
        {{ t.label }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
    <div v-else-if="!books.length" class="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
      Пока нет данных для этого рейтинга.
    </div>
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <div v-for="(b, i) in books" :key="b.id" class="relative">
        <span
          class="absolute -left-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow"
          :class="i === 0 ? 'bg-amber-400 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-orange-400 text-black' : 'bg-card text-muted-foreground'"
        >{{ i + 1 }}</span>
        <BookCard :book="b" :show-description="false" />
      </div>
    </div>
  </div>
</template>
