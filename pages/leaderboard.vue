<script setup lang="ts">
import { Trophy, Flame, MessagesSquare, Loader2, Crown } from 'lucide-vue-next'
import type { LeaderboardDto, LeaderboardEntryDto } from '~/types'
import { useLeaderboard } from '~/composables/useLeaderboard'

useHead({ title: 'Таблица лидеров — LibNode' })

const { fetchLeaderboard } = useLeaderboard()

const { data: board, pending } = await useAsyncData<LeaderboardDto | null>(
  'leaderboard',
  () => fetchLeaderboard(20),
)

type BoardKey = 'xp' | 'streak' | 'commenters'
const boards: { key: BoardKey; label: string; icon: any; unit: string }[] = [
  { key: 'xp', label: 'Опыт', icon: Trophy, unit: 'XP' },
  { key: 'streak', label: 'Серии', icon: Flame, unit: 'дн.' },
  { key: 'commenters', label: 'Комментаторы', icon: MessagesSquare, unit: '★' },
]
const activeBoard = ref<BoardKey>('xp')

const rows = computed<LeaderboardEntryDto[]>(() => {
  const b = board.value
  if (!b) return []
  if (activeBoard.value === 'xp') return b.topXp
  if (activeBoard.value === 'streak') return b.topStreak
  return b.topCommenters
})
const currentUnit = computed(() => boards.find((b) => b.key === activeBoard.value)?.unit ?? '')

const initials = (name: string) => (name || '?').slice(0, 2).toUpperCase()
const rankClass = (rank: number) =>
  rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-orange-400' : 'text-muted-foreground'
</script>

<template>
  <div class="app-container py-6 md:py-10">
    <div class="mb-6 flex items-center gap-3">
      <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Crown class="h-6 w-6" />
      </span>
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Таблица лидеров</h1>
        <p class="text-sm text-muted-foreground">Лучшие читатели сообщества</p>
      </div>
    </div>

    <!-- Board tabs -->
    <div class="mb-5 flex flex-wrap gap-1 border-b border-border">
      <button
        v-for="b in boards"
        :key="b.key"
        type="button"
        class="-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
        :class="activeBoard === b.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeBoard = b.key"
      >
        <component :is="b.icon" class="h-4 w-4" />
        {{ b.label }}
      </button>
    </div>

    <div v-if="pending" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="!rows.length" class="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
      Пока нет данных для этой таблицы.
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-border bg-card">
      <div
        v-for="e in rows"
        :key="e.userId"
        class="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
        :class="{ 'bg-primary/[0.04]': e.rank <= 3 }"
      >
        <span class="w-7 text-center text-lg font-bold tabular-nums" :class="rankClass(e.rank)">{{ e.rank }}</span>
        <UserAvatar :username="e.username" :avatar-url="e.avatarUrl" size="md" />
        <span class="min-w-0 flex-1">
          <span class="block truncate font-medium">{{ e.username }}</span>
          <span class="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Trophy class="h-3 w-3" /> Уровень {{ e.level }}
          </span>
        </span>
        <span class="shrink-0 text-right font-semibold tabular-nums">
          {{ e.value }} <span class="text-xs font-normal text-muted-foreground">{{ currentUnit }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
