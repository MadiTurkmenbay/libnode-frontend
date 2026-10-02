<script setup lang="ts">
import { Bell, CheckCheck, Loader2, MessageSquare, UsersRound, BookOpen, Inbox, AtSign } from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { NotificationType } from '~/types'
import type { NotificationDto } from '~/types'
import { formatRelativeTime } from '~/lib/formatters'

const { unreadCount, list, refreshUnread, markRead, markAllRead } = useNotifications()
const { isAuthenticated } = useAuth()

const items = ref<NotificationDto[]>([])
const loading = ref(false)
const loaded = ref(false)
const open = ref(false)

const iconFor = (t: NotificationType) => {
  switch (t) {
    case NotificationType.CommentReply: return MessageSquare
    case NotificationType.Mention: return AtSign
    case NotificationType.TeamInvite: return UsersRound
    case NotificationType.NewChapter: return BookOpen
    default: return Inbox
  }
}

async function loadList() {
  if (!isAuthenticated.value) return
  loading.value = true
  try {
    const res = await list(null)
    items.value = res?.items ?? []
    loaded.value = true
  }
  finally {
    loading.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen && !loaded.value) loadList()
})

async function onItemClick(n: NotificationDto) {
  if (!n.isRead) {
    n.isRead = true
    markRead(n.id).catch(() => {})
  }
  open.value = false
  if (n.linkUrl) await navigateTo(n.linkUrl)
}

async function readAll() {
  items.value.forEach((n) => (n.isRead = true))
  await markAllRead()
}

let pollTimer: ReturnType<typeof setInterval> | null = null
let eventSource: EventSource | null = null
let sseFailed = false
let streamRunId = 0

function stopNotifications() {
  streamRunId += 1
  eventSource?.close()
  eventSource = null
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  sseFailed = false
}

function startSse() {
  if (!isAuthenticated.value || eventSource) return

  if (typeof EventSource === 'undefined') {
    sseFailed = true
    return
  }
  try {
    eventSource = new EventSource('/api/notifications/stream', { withCredentials: true })
    eventSource.addEventListener('count', (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        if (typeof data.count === 'number') {
          unreadCount.value = data.count
        }
      } catch { /* ignore malformed */ }
    })
    eventSource.onerror = () => {
      eventSource?.close()
      eventSource = null
      if (!sseFailed && isAuthenticated.value) {
        sseFailed = true
        startPolling()
      }
    }
  } catch {
    sseFailed = true
  }
}

function startPolling() {
  if (!isAuthenticated.value) return

  if (pollTimer) clearInterval(pollTimer)
  refreshUnread()
  pollTimer = setInterval(() => {
    if (!isAuthenticated.value) {
      stopNotifications()
      return
    }
    refreshUnread()
    if (open.value) loadList()
  }, 45000)
}

async function startNotifications() {
  const runId = ++streamRunId

  if (!isAuthenticated.value) return

  // Wait one UI tick after login so the browser has committed Set-Cookie.
  await nextTick()
  if (!isAuthenticated.value || runId !== streamRunId) return

  refreshUnread()
  startSse()
  if (sseFailed) startPolling()
}

onMounted(() => {
  if (isAuthenticated.value) startNotifications()
})

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    startNotifications()
  } else {
    stopNotifications()
  }
})

onBeforeUnmount(() => {
  stopNotifications()
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/60 text-muted-foreground transition-all hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Уведомления"
        aria-label="Уведомления"
      >
        <Bell class="h-4 w-4" />
        <span
          v-if="unreadCount > 0"
          class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
        >{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>
    </PopoverTrigger>

    <PopoverContent :side-offset="8" align="end" class="w-80 p-0">
      <div class="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span class="text-sm font-semibold">Уведомления</span>
        <button
          v-if="items.some((n) => !n.isRead)"
          type="button"
          class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          @click="readAll"
        >
          <CheckCheck class="h-3.5 w-3.5" /> Прочитать все
        </button>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <div v-if="loading" class="flex justify-center py-8">
          <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
        </div>

        <button
          v-for="n in items"
          v-else
          :key="n.id"
          type="button"
          class="flex w-full items-start gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-accent/10"
          :class="{ 'bg-primary/[0.04]': !n.isRead }"
          @click="onItemClick(n)"
        >
          <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <component :is="iconFor(n.type)" class="h-3.5 w-3.5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium leading-snug" :class="n.isRead ? 'text-foreground/80' : 'text-foreground'">
              {{ n.title }}
            </span>
            <span v-if="n.message" class="block truncate text-xs text-muted-foreground">{{ n.message }}</span>
            <span class="block text-[11px] text-muted-foreground/70">{{ formatRelativeTime(n.createdAt) }}</span>
          </span>
          <span v-if="!n.isRead" class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
        </button>

        <div v-if="loaded && !loading && !items.length" class="py-10 text-center text-sm text-muted-foreground">
          Нет уведомлений
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
