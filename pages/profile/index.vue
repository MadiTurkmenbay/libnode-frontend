<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  User as UserIcon,
  Trophy,
  Bookmark,
  Bell,
  Settings,
  Flame,
  BookOpen,
  MessageSquare,
  Sparkles,
  CheckCheck,
  Loader2,
  Save,
  KeyRound,
  UsersRound,
  AtSign,
  Inbox,
  ChevronRight,
  BookMarked,
  Library,
  MessagesSquare,
  Moon,
  Award,
  Lock,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-vue-next'
import { NotificationType, ShelfStatus } from '~/types'
import type { NotificationDto, CollectionDto, ShelfItemDto, NotificationPrefsDto } from '~/types'
import { formatRelativeTime, formatLongDate } from '~/lib/formatters'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Личный кабинет — LibNode' })

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const { user } = useAuth()
const { me, fetchMe, updateProfile, changePassword, uploadAvatar } = useAccount()
const { showGamification, setShowGamification } = useUiPrefs()
const { configured: mediaConfigured, fetchConfig: fetchMediaConfig } = useMediaConfig()
fetchMediaConfig()

const uploadingAvatar = ref(false)
const cropOpen = ref(false)
const cropSrc = ref<string | null>(null)
function onMediaInvalid(msg: string) {
  toast({ description: msg, variant: 'destructive' })
}
// Сначала кадрируем (квадрат) в диалоге, затем грузим результат.
function onAvatarFile(file: File) {
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = URL.createObjectURL(file)
  cropOpen.value = true
}
async function onAvatarCropped(file: File) {
  uploadingAvatar.value = true
  try {
    const url = await uploadAvatar(file)
    if (url) {
      profileForm.avatarUrl = url
      toast('Аватар обновлён')
    }
  }
  catch (err: any) {
    toast({ description: err?.data?.error || 'Не удалось загрузить аватар', variant: 'destructive' })
  }
  finally {
    uploadingAvatar.value = false
    if (cropSrc.value) { URL.revokeObjectURL(cropSrc.value); cropSrc.value = null }
  }
}
const { stats, achievements, quests, fetchStats, fetchAchievements, fetchQuests } = useGamification()

const achievementIcons: Record<string, any> = {
  BookOpen, BookMarked, Library, Flame, MessageSquare, MessagesSquare, Moon, Bookmark, Award, Sparkles,
}
const iconForAchievement = (name: string) => achievementIcons[name] ?? Trophy
const unlockedCount = computed(() => achievements.value.filter((a) => a.unlocked).length)
const questIcons: Record<string, any> = { BookOpen, BookMarked, MessageSquare }
const iconForQuest = (name: string) => questIcons[name] ?? Sparkles
const { list: listNotifs, markRead, markAllRead, refreshUnread, getPrefs, updatePrefs } = useNotifications()

type TabKey = 'profile' | 'bookmarks' | 'shelves' | 'notifications' | 'settings'
const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: 'profile', label: 'Профиль', icon: Trophy },
  { key: 'bookmarks', label: 'Закладки', icon: Bookmark },
  { key: 'shelves', label: 'Полки', icon: Library },
  { key: 'notifications', label: 'Уведомления', icon: Bell },
  { key: 'settings', label: 'Настройки', icon: Settings },
]
const activeTab = ref<TabKey>(
  (['profile', 'bookmarks', 'shelves', 'notifications', 'settings'].includes(route.query.tab as string)
    ? route.query.tab
    : 'profile') as TabKey,
)
watch(activeTab, (t) => router.replace({ query: { ...route.query, tab: t } }))

// ── Initial load ──────────────────────────────────────────────────────────
await fetchMe()
await fetchStats()
await fetchAchievements()
await fetchQuests()

const initials = computed(() =>
  (me.value?.username || user.value?.username || '?').slice(0, 2).toUpperCase(),
)

// Прогресс XP-бара в процентах.
const xpPercent = computed(() => {
  const s = stats.value
  if (!s || s.xpForNextLevel <= 0) return 0
  return Math.min(100, Math.round((s.xpIntoLevel / s.xpForNextLevel) * 100))
})

const statCards = computed(() => {
  const s = stats.value
  return [
    { icon: BookOpen, label: 'Прочитано глав', value: s?.chaptersRead ?? 0 },
    { icon: MessageSquare, label: 'Комментариев', value: s?.commentsPosted ?? 0 },
    { icon: Flame, label: 'Текущая серия', value: `${s?.currentStreak ?? 0} дн.` },
    { icon: Sparkles, label: 'Рекорд серии', value: `${s?.longestStreak ?? 0} дн.` },
  ]
})

// ── Bookmarks tab ───────────────────────────────────────────────────────────
const collections = ref<CollectionDto[]>([])
const collectionsLoaded = ref(false)
const collectionsLoading = ref(false)
async function loadCollections() {
  if (collectionsLoaded.value) return
  collectionsLoading.value = true
  try {
    collections.value = (await executeApiRequest<CollectionDto[]>('/api/collections', { key: 'cabinet-collections' })) ?? []
    collectionsLoaded.value = true
  }
  finally {
    collectionsLoading.value = false
  }
}

// ── Shelves tab ─────────────────────────────────────────────────────────────
const { listShelves } = useShelves()
const shelves = ref<ShelfItemDto[]>([])
const shelvesLoaded = ref(false)
const shelvesLoading = ref(false)
const shelfGroups: { status: ShelfStatus, label: string }[] = [
  { status: ShelfStatus.Reading, label: 'Читаю' },
  { status: ShelfStatus.Completed, label: 'Прочитано' },
  { status: ShelfStatus.PlanToRead, label: 'В планах' },
  { status: ShelfStatus.Dropped, label: 'Брошено' },
]
const booksByStatus = (s: ShelfStatus) => shelves.value.filter((x) => x.status === s).map((x) => x.book)
async function loadShelves() {
  if (shelvesLoaded.value) return
  shelvesLoading.value = true
  try {
    shelves.value = (await listShelves()) ?? []
    shelvesLoaded.value = true
  }
  finally {
    shelvesLoading.value = false
  }
}

// ── Notifications tab ───────────────────────────────────────────────────────
const notifFilter = ref<'all' | 'unread' | 'read'>('all')
const notifItems = ref<NotificationDto[]>([])
const notifCursor = ref<string | null>(null)
const notifHasMore = ref(false)
const notifLoading = ref(false)

const filterToIsRead = (f: 'all' | 'unread' | 'read'): boolean | null =>
  f === 'all' ? null : f === 'read'

const iconForNotif = (t: NotificationType) => {
  switch (t) {
    case NotificationType.CommentReply: return MessageSquare
    case NotificationType.Mention: return AtSign
    case NotificationType.TeamInvite: return UsersRound
    case NotificationType.NewChapter: return BookOpen
    case NotificationType.LevelUp: return Trophy
    case NotificationType.Achievement: return Sparkles
    default: return Inbox
  }
}

async function loadNotifs(reset = false) {
  if (notifLoading.value) return
  notifLoading.value = true
  try {
    if (reset) {
      notifItems.value = []
      notifCursor.value = null
      notifHasMore.value = false
    }
    const res = await listNotifs(notifCursor.value, 20, filterToIsRead(notifFilter.value))
    notifItems.value.push(...(res?.items ?? []))
    notifCursor.value = res?.nextCursor ?? null
    notifHasMore.value = res?.hasMore ?? false
  }
  finally {
    notifLoading.value = false
  }
}

watch(notifFilter, () => loadNotifs(true))

async function onNotifClick(n: NotificationDto) {
  if (!n.isRead) {
    n.isRead = true
    markRead(n.id).catch(() => {})
  }
  if (n.linkUrl) await navigateTo(n.linkUrl)
}

async function onMarkAll() {
  notifItems.value.forEach((n) => (n.isRead = true))
  await markAllRead()
  refreshUnread()
  if (notifFilter.value === 'unread') loadNotifs(true)
}

// Ленивая подгрузка вкладок при первом открытии.
watch(activeTab, (t) => {
  if (t === 'bookmarks') loadCollections()
  if (t === 'shelves') loadShelves()
  if (t === 'notifications' && !notifItems.value.length) loadNotifs(true)
}, { immediate: true })

// ── Settings: profile form ──────────────────────────────────────────────────
const profileForm = reactive({ username: '', email: '', avatarUrl: '', bio: '' })
const savingProfile = ref(false)
watchEffect(() => {
  if (me.value) {
    profileForm.username = me.value.username
    profileForm.email = me.value.email
    profileForm.avatarUrl = me.value.avatarUrl ?? ''
    profileForm.bio = me.value.bio ?? ''
  }
})

async function saveProfile() {
  savingProfile.value = true
  try {
    await updateProfile({
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      avatarUrl: profileForm.avatarUrl.trim() || null,
      bio: profileForm.bio.trim() || null,
    })
    toast('Профиль обновлён')
  }
  catch (e: any) {
    toast({ description: e?.data?.error || 'Не удалось сохранить профиль', variant: 'destructive' })
  }
  finally {
    savingProfile.value = false
  }
}

// ── Settings: password form ─────────────────────────────────────────────────
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirm: '' })
const savingPassword = ref(false)

async function savePassword() {
  if (passwordForm.newPassword.length < 6) {
    toast({ description: 'Новый пароль должен быть не короче 6 символов', variant: 'destructive' })
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirm) {
    toast({ description: 'Пароли не совпадают', variant: 'destructive' })
    return
  }
  savingPassword.value = true
  try {
    await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirm = ''
    toast('Пароль изменён')
  }
  catch (e: any) {
    toast({ description: e?.data?.error || 'Не удалось изменить пароль', variant: 'destructive' })
  }
  finally {
    savingPassword.value = false
  }
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30'

const { downloadSettings, importFromFile, resetAllDefaults } = useSettingsExport()
const fileInput = ref<HTMLInputElement | null>(null)

function onExportClick() {
  downloadSettings()
  toast('Настройки экспортированы')
}

async function onImportFile(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const ok = await importFromFile(file)
  if (ok) {
    toast('Настройки импортированы. Обновите страницу.')
    setTimeout(() => window.location.reload(), 1200)
  } else {
    toast({ variant: 'destructive', title: 'Не удалось импортировать', description: 'Проверьте файл' })
  }
  target.value = ''
}

function onResetClick() {
  if (!confirm('Сбросить все настройки читалки и интерфейса к значениям по умолчанию?')) return
  resetAllDefaults()
  toast('Настройки сброшены. Обновите страницу.')
  setTimeout(() => window.location.reload(), 800)
}

const notifPrefs = ref<NotificationPrefsDto | null>(null)
const savingPrefs = ref(false)

const notifPrefItems = computed(() => [
  { key: 'enableCommentReply', label: 'Ответы на комментарии', icon: MessageSquare },
  { key: 'enableMention', label: 'Упоминания', icon: AtSign },
  { key: 'enableTeamInvite', label: 'Приглашения в команды', icon: UsersRound },
  { key: 'enableNewChapter', label: 'Новые главы', icon: BookOpen },
  { key: 'enableLevelUp', label: 'Повышение уровня', icon: Trophy },
  { key: 'enableAchievement', label: 'Достижения', icon: Award },
  { key: 'enableRequestApproved', label: 'Одобрение заявок', icon: CheckCheck },
  { key: 'enableRequestRejected', label: 'Отклонение заявок', icon: Inbox },
] as const)

async function loadPrefs() {
  try {
    notifPrefs.value = await getPrefs()
  } catch { /* ignore */ }
}

async function togglePref(key: keyof NotificationPrefsDto) {
  if (!notifPrefs.value || savingPrefs.value) return
  const newVal = !notifPrefs.value[key]
  notifPrefs.value = { ...notifPrefs.value, [key]: newVal }
  savingPrefs.value = true
  try {
    const updated = await updatePrefs({ [key]: newVal } as any)
    if (updated) notifPrefs.value = updated
  } catch {
    notifPrefs.value = { ...notifPrefs.value, [key]: !newVal }
  } finally {
    savingPrefs.value = false
  }
}

watch(activeTab, (t) => {
  if (t === 'settings' && !notifPrefs.value) loadPrefs()
})
</script>

<template>
  <div class="app-container py-6 md:py-10">
    <!-- Header card -->
    <div class="mb-6 flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
      <div class="relative shrink-0">
        <div class="h-24 w-24 overflow-hidden rounded-full ring-4 ring-primary/15">
          <img v-if="me?.avatarUrl" :src="me.avatarUrl" alt="avatar" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
            {{ initials }}
          </div>
        </div>
        <span v-if="showGamification" class="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground shadow">
          <Trophy class="h-3 w-3" /> {{ stats?.level ?? 1 }}
        </span>
      </div>

      <div class="min-w-0 flex-1 text-center sm:text-left">
        <h1 class="text-2xl font-bold tracking-tight">{{ me?.username || user?.username }}</h1>
        <p class="text-sm text-muted-foreground">{{ me?.email }}</p>
        <p v-if="me?.bio" class="mt-1.5 text-sm">{{ me.bio }}</p>
        <p class="mt-1 text-xs text-muted-foreground/70">
          <span v-if="me?.role && me.role !== 'User'" class="mr-2 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">{{ me.role }}</span>
          <span v-if="me?.createdAt">С нами с {{ formatLongDate(me.createdAt) }}</span>
        </p>
        <!-- XP bar -->
        <div v-if="showGamification" class="mx-auto mt-3 max-w-sm sm:mx-0">
          <div class="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Уровень {{ stats?.level ?? 1 }}</span>
            <span>{{ stats?.xpIntoLevel ?? 0 }} / {{ stats?.xpForNextLevel ?? 0 }} XP</span>
          </div>
          <div class="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all" :style="{ width: `${xpPercent}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-5 flex flex-wrap gap-1 border-b border-border">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
        :class="activeTab === t.key
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = t.key"
      >
        <component :is="t.icon" class="h-4 w-4" />
        {{ t.label }}
      </button>
    </div>

    <!-- ── Profile tab ── -->
    <section v-show="activeTab === 'profile'">
      <div
        v-if="!showGamification"
        class="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground"
      >
        <Trophy class="mx-auto mb-3 h-8 w-8 opacity-50" />
        <p>Геймификация скрыта.</p>
        <p class="mt-1 text-sm">Включить можно во вкладке «Настройки».</p>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="c in statCards" :key="c.label" class="rounded-xl border border-border bg-card p-5">
        <component :is="c.icon" class="mb-2 h-5 w-5 text-primary" />
        <div class="text-2xl font-bold tabular-nums">{{ c.value }}</div>
        <div class="text-xs text-muted-foreground">{{ c.label }}</div>
      </div>
      <div class="rounded-xl border border-border bg-card p-5 sm:col-span-2 lg:col-span-4">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles class="h-4 w-4 text-primary" />
          Всего опыта: <span class="font-semibold text-foreground">{{ stats?.xp ?? 0 }} XP</span>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          Опыт начисляется за прочитанные главы (+10) и комментарии (+5). Читайте каждый день,
          чтобы держать серию 🔥
        </p>
      </div>

      <!-- Daily quests -->
      <div v-if="quests.length" class="rounded-xl border border-border bg-card p-5 sm:col-span-2 lg:col-span-4">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Sparkles class="h-5 w-5 text-primary" /> Ежедневные квесты
        </h2>
        <div class="grid gap-3 sm:grid-cols-3">
          <div
            v-for="q in quests"
            :key="q.key"
            class="rounded-xl border p-4 transition-colors"
            :class="q.completed ? 'border-primary/30 bg-primary/[0.06]' : 'border-border'"
          >
            <div class="mb-2 flex items-center gap-2">
              <component :is="iconForQuest(q.icon)" class="h-4 w-4" :class="q.completed ? 'text-primary' : 'text-muted-foreground'" />
              <span class="flex-1 text-sm font-medium leading-tight">{{ q.title }}</span>
              <CheckCheck v-if="q.completed" class="h-4 w-4 text-primary" />
            </div>
            <div class="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }"></div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{{ q.progress }} / {{ q.target }}</span>
              <span class="font-medium" :class="q.completed ? 'text-primary' : ''">+{{ q.reward }} XP</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements grid -->
      <div class="rounded-xl border border-border bg-card p-5 sm:col-span-2 lg:col-span-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            <Award class="h-5 w-5 text-primary" /> Достижения
          </h2>
          <span class="text-sm text-muted-foreground">{{ unlockedCount }} / {{ achievements.length }}</span>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="a in achievements"
            :key="a.key"
            class="flex flex-col items-center rounded-xl border p-4 text-center transition-colors"
            :class="a.unlocked ? 'border-primary/30 bg-primary/[0.06]' : 'border-border bg-muted/30 opacity-60'"
            :title="a.description"
          >
            <span
              class="mb-2 flex h-11 w-11 items-center justify-center rounded-full"
              :class="a.unlocked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'"
            >
              <component :is="a.unlocked ? iconForAchievement(a.icon) : Lock" class="h-5 w-5" />
            </span>
            <span class="text-sm font-medium leading-tight">{{ a.title }}</span>
            <span class="mt-0.5 text-[11px] leading-tight text-muted-foreground">{{ a.description }}</span>
          </div>
        </div>
      </div>
      </div>

      <!-- Interface preferences -->
      <div class="rounded-xl border border-border bg-card p-6 lg:col-span-2">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Settings class="h-5 w-5 text-primary" /> Интерфейс
        </h2>
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/10"
          @click="setShowGamification(!showGamification)"
        >
          <span class="min-w-0">
            <span class="flex items-center gap-2 font-medium">
              <Trophy class="h-4 w-4 text-primary" /> Показывать геймификацию
            </span>
            <span class="mt-0.5 block text-sm text-muted-foreground">
              Уровни, опыт, серии, квесты и достижения. Выключите, если они вам не нужны.
            </span>
          </span>
          <span
            class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            :class="showGamification ? 'bg-primary' : 'bg-muted'"
          >
            <span
              class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
              :class="showGamification ? 'left-[22px]' : 'left-0.5'"
            ></span>
          </span>
        </button>
      </div>

      <!-- Settings data export/import -->
      <div class="rounded-xl border border-border bg-card p-6 lg:col-span-2">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Settings class="h-5 w-5 text-primary" /> Данные настроек
        </h2>
        <p class="mb-4 text-sm text-muted-foreground">
          Экспортируйте настройки читалки и интерфейса в JSON-файл, импортируйте на другом устройстве или сбросьте к значениям по умолчанию.
        </p>
        <div class="flex flex-wrap gap-3">
          <Button variant="outline" @click="onExportClick">
            <Download class="mr-2 h-4 w-4" />
            Экспорт
          </Button>
          <Button variant="outline" @click="fileInput?.click()">
            <Upload class="mr-2 h-4 w-4" />
            Импорт
          </Button>
          <Button variant="outline" @click="onResetClick">
            <RotateCcw class="mr-2 h-4 w-4" />
            Сбросить
          </Button>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="hidden"
            @change="onImportFile"
          />
        </div>
      </div>
    </section>

    <!-- ── Bookmarks tab ── -->
    <section v-show="activeTab === 'bookmarks'">
      <div v-if="collectionsLoading" class="flex justify-center py-12">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="!collections.length" class="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
        <Bookmark class="mx-auto mb-3 h-8 w-8 opacity-50" />
        <p>У вас пока нет коллекций-закладок.</p>
        <Button as-child variant="outline" class="mt-4">
          <NuxtLink to="/catalog">Перейти в каталог</NuxtLink>
        </Button>
      </div>
      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="col in collections"
          :key="col.id"
          :to="`/profile/collections/${col.id}`"
          class="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div class="min-w-0">
            <div class="truncate font-medium">{{ col.name }}</div>
            <div class="text-xs text-muted-foreground">{{ col.bookCount }} книг</div>
          </div>
          <ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </NuxtLink>
      </div>
    </section>

    <!-- ── Shelves tab ── -->
    <section v-show="activeTab === 'shelves'">
      <div v-if="shelvesLoading" class="flex justify-center py-12">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="!shelves.length" class="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
        <Library class="mx-auto mb-3 h-8 w-8 opacity-50" />
        <p>Полки пусты. Добавляйте книги в «Читаю», «В планах» и т.д. со страницы тайтла.</p>
      </div>
      <div v-else class="space-y-8">
        <div v-for="g in shelfGroups" :key="g.status">
          <template v-if="booksByStatus(g.status).length">
            <h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
              {{ g.label }}
              <span class="text-sm text-muted-foreground">{{ booksByStatus(g.status).length }}</span>
            </h3>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <BookCard v-for="b in booksByStatus(g.status)" :key="b.id" :book="b" />
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- ── Notifications tab ── -->
    <section v-show="activeTab === 'notifications'">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex rounded-lg border border-border p-0.5">
          <button
            v-for="f in (['all', 'unread', 'read'] as const)"
            :key="f"
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            :class="notifFilter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="notifFilter = f"
          >
            {{ f === 'all' ? 'Все' : f === 'unread' ? 'Непрочитанные' : 'Прочитанные' }}
          </button>
        </div>
        <Button variant="outline" size="sm" class="gap-1.5" @click="onMarkAll">
          <CheckCheck class="h-4 w-4" /> Прочитать все
        </Button>
      </div>

      <div class="overflow-hidden rounded-xl border border-border bg-card">
        <button
          v-for="n in notifItems"
          :key="n.id"
          type="button"
          class="flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/10"
          :class="{ 'bg-primary/[0.04]': !n.isRead }"
          @click="onNotifClick(n)"
        >
          <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <component :is="iconForNotif(n.type)" class="h-4 w-4" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium leading-snug" :class="n.isRead ? 'text-foreground/80' : 'text-foreground'">{{ n.title }}</span>
            <span v-if="n.message" class="block text-xs text-muted-foreground">{{ n.message }}</span>
            <span class="block text-[11px] text-muted-foreground/70">{{ formatRelativeTime(n.createdAt) }}</span>
          </span>
          <span v-if="!n.isRead" class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
        </button>

        <div v-if="notifLoading" class="flex justify-center py-8">
          <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
        <div v-else-if="!notifItems.length" class="py-14 text-center text-sm text-muted-foreground">
          Нет уведомлений
        </div>
      </div>

      <div v-if="notifHasMore" class="mt-4 flex justify-center">
        <Button variant="outline" :disabled="notifLoading" @click="loadNotifs(false)">Показать ещё</Button>
      </div>
    </section>

    <!-- ── Settings tab ── -->
    <section v-show="activeTab === 'settings'" class="grid gap-6 lg:grid-cols-2">
      <!-- Profile edit -->
      <form class="rounded-xl border border-border bg-card p-6" @submit.prevent="saveProfile">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <UserIcon class="h-5 w-5 text-primary" /> Профиль
        </h2>
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium">Имя пользователя</label>
            <input v-model="profileForm.username" :class="inputClass" type="text" required minlength="2" maxlength="50" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">Email</label>
            <input v-model="profileForm.email" :class="inputClass" type="email" required />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">Аватар</label>
            <MediaDropzone
              v-if="mediaConfigured"
              shape="square"
              :preview-url="profileForm.avatarUrl || null"
              :uploading="uploadingAvatar"
              label="Перетащите, вставьте или выберите аватар"
              @file="onAvatarFile"
              @invalid="onMediaInvalid"
            />
            <p v-else class="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Загрузка файлов недоступна (хранилище не настроено). Можно указать URL ниже.
            </p>
            <ImageCropDialog v-model="cropOpen" :src="cropSrc" :output-size="512" filename="avatar" @cropped="onAvatarCropped" />
            <input v-model="profileForm.avatarUrl" :class="[inputClass, 'mt-2']" type="url" placeholder="…или вставьте URL изображения" maxlength="500" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">О себе</label>
            <textarea v-model="profileForm.bio" :class="inputClass" rows="3" maxlength="1000" placeholder="Пара слов о себе…"></textarea>
          </div>
        </div>
        <Button type="submit" class="mt-5 gap-1.5" :disabled="savingProfile">
          <Loader2 v-if="savingProfile" class="h-4 w-4 animate-spin" />
          <Save v-else class="h-4 w-4" />
          Сохранить
        </Button>
      </form>

      <!-- Password change -->
      <form class="h-fit rounded-xl border border-border bg-card p-6" @submit.prevent="savePassword">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <KeyRound class="h-5 w-5 text-primary" /> Смена пароля
        </h2>
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium">Текущий пароль</label>
            <input v-model="passwordForm.currentPassword" :class="inputClass" type="password" required autocomplete="current-password" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">Новый пароль</label>
            <input v-model="passwordForm.newPassword" :class="inputClass" type="password" required minlength="6" autocomplete="new-password" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">Повторите новый пароль</label>
            <input v-model="passwordForm.confirm" :class="inputClass" type="password" required autocomplete="new-password" />
          </div>
        </div>
        <Button type="submit" variant="outline" class="mt-5 gap-1.5" :disabled="savingPassword">
          <Loader2 v-if="savingPassword" class="h-4 w-4 animate-spin" />
          <KeyRound v-else class="h-4 w-4" />
          Изменить пароль
        </Button>
      </form>

      <!-- Interface preferences -->
      <div class="rounded-xl border border-border bg-card p-6 lg:col-span-2">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Settings class="h-5 w-5 text-primary" /> Интерфейс
        </h2>
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/10"
          @click="setShowGamification(!showGamification)"
        >
          <span class="min-w-0">
            <span class="flex items-center gap-2 font-medium">
              <Trophy class="h-4 w-4 text-primary" /> Показывать геймификацию
            </span>
            <span class="mt-0.5 block text-sm text-muted-foreground">
              Уровни, опыт, серии, квесты и достижения. Выключите, если они вам не нужны.
            </span>
          </span>
          <span
            class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            :class="showGamification ? 'bg-primary' : 'bg-muted'"
          >
            <span
              class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
              :class="showGamification ? 'left-[22px]' : 'left-0.5'"
            ></span>
          </span>
        </button>
      </div>

      <!-- Notification preferences -->
      <div class="rounded-xl border border-border bg-card p-6 lg:col-span-2">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Bell class="h-5 w-5 text-primary" /> Уведомления
        </h2>
        <div v-if="!notifPrefs" class="flex justify-center py-6">
          <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
        <div v-else class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="item in notifPrefItems"
            :key="item.key"
            type="button"
            class="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/10"
            @click="togglePref(item.key as keyof NotificationPrefsDto)"
          >
            <span class="flex items-center gap-2 text-sm font-medium">
              <component :is="item.icon" class="h-4 w-4 text-primary" />
              {{ item.label }}
            </span>
            <span
              class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
              :class="notifPrefs[item.key as keyof NotificationPrefsDto] ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                :class="notifPrefs[item.key as keyof NotificationPrefsDto] ? 'left-[22px]' : 'left-0.5'"
              ></span>
            </span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
