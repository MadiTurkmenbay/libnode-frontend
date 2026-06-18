<script setup lang="ts">
import { Rss, BookOpen, Loader2, Users } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { FeedItemDto } from '~/types'
import { useFollow } from '~/composables/useFollow'
import { formatRelativeTime } from '~/lib/formatters'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Лента — LibNode' })

const { feed } = useFollow()

const items = ref<FeedItemDto[]>([])
const cursor = ref<string | null>(null)
const hasMore = ref(false)
const loading = ref(false)

async function load(reset = false) {
  if (loading.value) return
  loading.value = true
  try {
    if (reset) { items.value = []; cursor.value = null; hasMore.value = false }
    const res = await feed(cursor.value, 20)
    items.value.push(...(res?.items ?? []))
    cursor.value = res?.nextCursor ?? null
    hasMore.value = res?.hasMore ?? false
  }
  finally {
    loading.value = false
  }
}
await load(true)
</script>

<template>
  <div class="app-container py-6 md:py-10">
    <div class="mb-6 flex items-center gap-3">
      <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Rss class="h-6 w-6" />
      </span>
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Лента</h1>
        <p class="text-sm text-muted-foreground">Новые главы от команд, на которые вы подписаны</p>
      </div>
    </div>

    <div v-if="loading && !items.length" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="!items.length" class="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
      <Users class="mx-auto mb-3 h-8 w-8 opacity-50" />
      <p>Пока пусто. Подпишитесь на команды переводчиков,</p>
      <p class="mt-1 text-sm">и здесь появятся их новые главы.</p>
      <Button as-child variant="outline" class="mt-4">
        <NuxtLink to="/catalog">В каталог</NuxtLink>
      </Button>
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="it in items"
        :key="it.chapterId"
        :to="`/books/${it.bookId}/read/${it.chapterId}`"
        class="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
      >
        <div class="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-muted/40">
          <img v-if="it.coverThumbUrl" :src="it.coverThumbUrl" alt="" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center"><BookOpen class="h-5 w-5 text-muted-foreground" /></div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate font-medium">{{ it.bookTitle }}</div>
          <div class="truncate text-sm text-muted-foreground">Глава {{ it.chapterNumber }} · {{ it.chapterTitle }}</div>
          <div class="mt-0.5 text-[11px] text-muted-foreground/70">
            <span v-if="it.teamName">{{ it.teamName }} · </span>{{ formatRelativeTime(it.createdAt) }}
          </div>
        </div>
      </NuxtLink>

      <div v-if="hasMore" class="flex justify-center pt-2">
        <Button variant="outline" :disabled="loading" @click="load(false)">Показать ещё</Button>
      </div>
    </div>
  </div>
</template>
