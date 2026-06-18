<script setup lang="ts">
import { BookMarked, MessageSquare, ArrowRight, UsersRound, Inbox, Users, HardDrive, Flag, BookOpen, FileText, Bell, Tag } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { formatRelativeTime } from '~/lib/formatters'

definePageMeta({ middleware: ['admin'] })
useHead({ title: 'Админка — LibNode' })

interface AdminMetrics {
  userCount: number
  bookCount: number
  chapterCount: number
  commentCount: number
  reportCount: number
  teamCount: number
  pendingRequests: number
  pendingInvites: number
  recentSignups: { id: string, username: string, avatarUrl: string | null, createdAt: string }[]
}

const storage = ref<{ configured: boolean, objectCount: number, totalBytes: number } | null>(null)
const metrics = ref<AdminMetrics | null>(null)

onMounted(async () => {
  storage.value = await executeApiRequest('/api/admin/storage', { key: 'admin-storage' }).catch(() => null)
  metrics.value = await executeApiRequest<AdminMetrics>('/api/admin/metrics', { key: 'admin-metrics' }).catch(() => null)
})

function humanBytes(n: number): string {
  if (!n) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`
}

const metricCards = computed(() => {
  if (!metrics.value) return []
  const m = metrics.value
  return [
    { icon: Users, label: 'Пользователи', value: m.userCount, color: 'text-blue-500' },
    { icon: BookMarked, label: 'Книги', value: m.bookCount, color: 'text-emerald-500' },
    { icon: FileText, label: 'Главы', value: m.chapterCount, color: 'text-purple-500' },
    { icon: MessageSquare, label: 'Комментарии', value: m.commentCount, color: 'text-cyan-500' },
    { icon: Flag, label: 'Жалобы', value: m.reportCount, color: 'text-red-500', highlight: m.reportCount > 0 },
    { icon: UsersRound, label: 'Команды', value: m.teamCount, color: 'text-orange-500' },
    { icon: Inbox, label: 'Заявки', value: m.pendingRequests, color: 'text-amber-500', highlight: m.pendingRequests > 0 },
    { icon: Bell, label: 'Приглашения', value: m.pendingInvites, color: 'text-pink-500', highlight: m.pendingInvites > 0 },
  ]
})

const sections = [
  { to: '/admin/books', icon: BookMarked, title: 'Книги', desc: 'Редактор тайтлов и глав, управление каталогом.' },
  { to: '/admin/comments', icon: MessageSquare, title: 'Комментарии', desc: 'Модерация комментариев книг и глав.' },
  { to: '/admin/teams', icon: UsersRound, title: 'Команды', desc: 'Команды переводчиков, участники и роли.' },
  { to: '/admin/requests', icon: Inbox, title: 'Заявки', desc: 'Заявки команд на закрепление тайтлов.' },
  { to: '/admin/users', icon: Users, title: 'Пользователи', desc: 'Управление пользователями и ролями.' },
  { to: '/admin/taxonomy', icon: Tag, title: 'Теги и категории', desc: 'CRUD тегов и категорий каталога.' },
]
</script>

<template>
  <AdminShell title="Дашборд">
    <div class="mb-6">
      <h2 class="text-2xl font-bold tracking-tight">Панель администратора</h2>
      <p class="mt-1 text-sm text-muted-foreground">Управление контентом и модерация.</p>
    </div>

    <!-- Metrics -->
    <div v-if="metrics" class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="mc in metricCards"
        :key="mc.label"
        class="rounded-xl border p-4 transition-colors"
        :class="mc.highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'"
      >
        <div class="mb-2 flex items-center gap-2">
          <component :is="mc.icon" class="h-4 w-4" :class="mc.color" />
          <span class="text-xs font-medium text-muted-foreground">{{ mc.label }}</span>
        </div>
        <div class="text-2xl font-bold tabular-nums">{{ mc.value }}</div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="s in sections"
        :key="s.to"
        :to="s.to"
        class="group rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      >
        <div class="flex items-center justify-between">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <component :is="s.icon" class="h-5 w-5" />
          </span>
          <ArrowRight class="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <h3 class="mt-3 font-semibold">{{ s.title }}</h3>
        <p class="mt-1 text-sm text-muted-foreground">{{ s.desc }}</p>
      </NuxtLink>
    </div>

    <!-- Recent signups -->
    <div v-if="metrics && metrics.recentSignups.length" class="mt-6 rounded-2xl border border-border bg-background p-5">
      <h3 class="mb-3 font-semibold">Новые пользователи</h3>
      <div class="space-y-2">
        <div
          v-for="u in metrics.recentSignups"
          :key="u.id"
          class="flex items-center gap-3"
        >
          <UserAvatar :username="u.username" :avatar-url="u.avatarUrl" size="sm" />
          <span class="text-sm font-medium">{{ u.username }}</span>
          <span class="text-xs text-muted-foreground">{{ formatRelativeTime(u.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Хранилище (MinIO) -->
    <div class="mt-6 rounded-2xl border border-border bg-background p-5">
      <div class="mb-3 flex items-center gap-2">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <HardDrive class="h-4 w-4" />
        </span>
        <h3 class="font-semibold">Хранилище медиа</h3>
      </div>
      <p v-if="storage && !storage.configured" class="text-sm text-muted-foreground">Хранилище не настроено.</p>
      <div v-else-if="storage" class="flex gap-8">
        <div>
          <div class="text-2xl font-bold tabular-nums">{{ storage.objectCount }}</div>
          <div class="text-xs text-muted-foreground">объектов</div>
        </div>
        <div>
          <div class="text-2xl font-bold tabular-nums">{{ humanBytes(storage.totalBytes) }}</div>
          <div class="text-xs text-muted-foreground">занято</div>
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">Загрузка…</p>
    </div>
  </AdminShell>
</template>
