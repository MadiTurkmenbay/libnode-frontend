<script setup lang="ts">
import { Loader2, Search, Shield, ShieldOff, Trash2, Users, Ban, VolumeX } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { Button } from '~/components/ui/button'
import type { AdminUserDto, CursorPagedResult } from '~/types'
import { formatShortDate } from '~/lib/formatters'

definePageMeta({ middleware: ['admin'] })
useHead({ title: 'Пользователи — Админка' })

const { toast } = useToast()
const { listUsers, updateUserRole, deleteUser } = useAdmin()
const { user: me } = useAuth()

const users = ref<AdminUserDto[]>([])
const nextCursor = ref<string | null>(null)
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const search = ref('')

async function fetchPage(reset: boolean) {
  const res = await listUsers(search.value.trim(), reset ? null : nextCursor.value)
  if (!res) return
  users.value = reset ? res.items : [...users.value, ...res.items]
  nextCursor.value = res.nextCursor
  hasMore.value = res.hasMore
}

async function load() {
  loading.value = true
  try { await fetchPage(true) }
  finally { loading.value = false }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 300)
})

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try { await fetchPage(false) }
  finally { loadingMore.value = false }
}

async function toggleRole(u: AdminUserDto) {
  const newRole = u.role === 'Admin' ? 'User' : 'Admin'
  try {
    const updated = await updateUserRole(u.id, newRole)
    if (updated) u.role = updated.role
    toast(`Роль изменена на ${newRole}`)
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось изменить роль' })
  }
}

async function toggleBan(u: AdminUserDto) {
  try {
    const updated = await executeApiRequest<AdminUserDto>(`/api/admin/users/${u.id}/ban`, { method: 'POST' })
    if (updated) { u.isBanned = updated.isBanned; u.isMuted = updated.isMuted }
    toast(updated?.isBanned ? 'Пользователь забанен' : 'Бан снят')
  } catch { toast({ variant: 'destructive', title: 'Ошибка' }) }
}

async function toggleMute(u: AdminUserDto) {
  try {
    const updated = await executeApiRequest<AdminUserDto>(`/api/admin/users/${u.id}/mute`, { method: 'POST' })
    if (updated) { u.isBanned = updated.isBanned; u.isMuted = updated.isMuted }
    toast(updated?.isMuted ? 'Пользователь заглушен' : 'Мьют снят')
  } catch { toast({ variant: 'destructive', title: 'Ошибка' }) }
}

async function remove(u: AdminUserDto) {
  if (!window.confirm(`Удалить пользователя ${u.username}?`)) return
  try {
    await deleteUser(u.id)
    users.value = users.value.filter((x) => x.id !== u.id)
    toast('Пользователь удалён')
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось удалить'
    toast({ variant: 'destructive', title: message })
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Пользователи">
    <div class="mb-5 flex items-center gap-2">
      <Users class="h-5 w-5 text-primary" />
      <h2 class="text-xl font-bold tracking-tight">Пользователи</h2>
    </div>

    <div class="relative mb-4">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        v-model="search"
        type="text"
        placeholder="Поиск по нику или email…"
        class="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="users.length" class="space-y-2">
      <div
        v-for="u in users"
        :key="u.id"
        class="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
      >
        <UserAvatar :username="u.username" :avatar-url="u.avatarUrl" :avatar-thumb-url="u.avatarThumbUrl" size="md" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">
            {{ u.username }}
            <span
              v-if="u.role === 'Admin'"
              class="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary"
            >Admin</span>
            <span
              v-if="u.isBanned"
              class="ml-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-500"
            >Ban</span>
            <span
              v-if="u.isMuted"
              class="ml-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-500"
            >Mute</span>
          </p>
          <p class="truncate text-xs text-muted-foreground">{{ u.email }} · {{ formatShortDate(u.createdAt) }}</p>
        </div>
        <button
          v-if="u.id !== me?.id"
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
          :class="u.isBanned ? 'border-red-500/40 bg-red-500/10 text-red-500' : ''"
          :title="u.isBanned ? 'Разбанить' : 'Забанить'"
          @click="toggleBan(u)"
        >
          <Ban class="h-4 w-4" />
        </button>
        <button
          v-if="u.id !== me?.id"
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-500"
          :class="u.isMuted ? 'border-amber-500/40 bg-amber-500/10 text-amber-500' : ''"
          :title="u.isMuted ? 'Снять мьют' : 'Заглушить'"
          @click="toggleMute(u)"
        >
          <VolumeX class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          :title="u.role === 'Admin' ? 'Снять админа' : 'Сделать админом'"
          @click="toggleRole(u)"
        >
          <ShieldOff v-if="u.role === 'Admin'" class="h-3.5 w-3.5" />
          <Shield v-else class="h-3.5 w-3.5" />
          {{ u.role === 'Admin' ? 'Снять' : 'Админ' }}
        </button>
        <button
          v-if="u.id !== me?.id"
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          title="Удалить"
          @click="remove(u)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>

      <div v-if="hasMore" class="flex justify-center pt-2">
        <Button variant="outline" size="sm" :disabled="loadingMore" @click="loadMore">
          <Loader2 v-if="loadingMore" class="mr-1.5 h-4 w-4 animate-spin" />
          Показать ещё
        </Button>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
      Пользователи не найдены.
    </div>
  </AdminShell>
</template>
