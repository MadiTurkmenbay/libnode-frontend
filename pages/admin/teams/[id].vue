<script setup lang="ts">
import { Loader2, UserPlus, Trash2, BookMarked, ArrowLeft, Send, BadgeCheck } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { TeamRole } from '~/types'
import type { TeamDetailDto } from '~/types'
import { teamRoleLabels, teamRoleBadge } from '~/lib/teamRole'

definePageMeta({ middleware: ['admin'] })

const route = useRoute()
const teamId = route.params.id as string
const { toast } = useToast()
const { getTeam, inviteMember, updateMember, removeMember, requestTitle } = useTeams()

const team = ref<TeamDetailDto | null>(null)
const loading = ref(true)

const newUsername = ref('')
const newRole = ref<TeamRole>(TeamRole.Translator)
const adding = ref(false)

const requestBookId = ref('')
const requestMsg = ref('')
const requesting = ref(false)

const roleOptions = [TeamRole.Head, TeamRole.Translator, TeamRole.Editor]

async function load() {
  loading.value = true
  try {
    team.value = (await getTeam(teamId)) ?? null
  }
  finally {
    loading.value = false
  }
}

useHead(() => ({ title: team.value ? `${team.value.name} — Команда` : 'Команда' }))

async function toggleVerify() {
  if (!team.value) return
  try {
    const updated = await executeApiRequest<TeamDetailDto>(`/api/admin/teams/${teamId}/verify`, { method: 'POST' })
    if (updated) team.value = { ...team.value, isVerified: updated.isVerified }
    toast(updated?.isVerified ? 'Команда верифицирована' : 'Верификация снята')
  } catch {
    toast('Ошибка')
  }
}

async function add() {
  if (!newUsername.value.trim() || adding.value) return
  adding.value = true
  try {
    await inviteMember(teamId, { username: newUsername.value.trim(), role: newRole.value })
    newUsername.value = ''
    toast('Приглашение отправлено')
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось пригласить'
    toast({ variant: 'destructive', title: message })
  }
  finally {
    adding.value = false
  }
}

async function changeRole(userId: string, role: TeamRole) {
  try {
    await updateMember(teamId, userId, role)
    const m = team.value?.members.find((x) => x.userId === userId)
    if (m) m.role = role
    toast('Роль обновлена')
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось изменить роль'
    toast({ variant: 'destructive', title: message })
    await load()
  }
}

async function remove(userId: string, username: string) {
  if (!window.confirm(`Убрать ${username} из команды?`)) return
  try {
    await removeMember(teamId, userId)
    if (team.value) team.value.members = team.value.members.filter((x) => x.userId !== userId)
    toast('Участник удалён')
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось удалить'
    toast({ variant: 'destructive', title: message })
  }
}

async function submitRequest() {
  if (!requestBookId.value.trim() || requesting.value) return
  requesting.value = true
  try {
    await requestTitle(teamId, requestBookId.value.trim(), requestMsg.value.trim() || null)
    requestBookId.value = ''
    requestMsg.value = ''
    toast('Заявка отправлена')
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось отправить заявку'
    toast({ variant: 'destructive', title: message })
  }
  finally {
    requesting.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell :title="team?.name || 'Команда'">
    <NuxtLink to="/admin/teams" class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft class="h-4 w-4" /> К списку команд
    </NuxtLink>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="team" class="space-y-8">
      <p v-if="team.description" class="text-sm text-muted-foreground">{{ team.description }}</p>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        :class="team.isVerified ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent/10'"
        @click="toggleVerify"
      >
        <BadgeCheck class="h-4 w-4" />
        {{ team.isVerified ? 'Снять верификацию' : 'Подтвердить команду' }}
      </button>

      <!-- Members -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold tracking-tight">Участники ({{ team.members.length }})</h3>

        <div class="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Ник пользователя</label>
            <Input v-model="newUsername" placeholder="username" @keydown.enter="add" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Роль</label>
            <select v-model.number="newRole" class="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option v-for="r in roleOptions" :key="r" :value="r">{{ teamRoleLabels[r] }}</option>
            </select>
          </div>
          <Button :disabled="!newUsername.trim() || adding" @click="add">
            <Loader2 v-if="adding" class="mr-1.5 h-4 w-4 animate-spin" />
            <UserPlus v-else class="mr-1.5 h-4 w-4" />
            Пригласить
          </Button>
        </div>

        <div v-if="team.members.length" class="space-y-2">
          <div
            v-for="m in team.members"
            :key="m.userId"
            class="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
          >
            <UserAvatar :username="m.username" size="md" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ m.username }}</p>
              <span class="inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase" :class="teamRoleBadge[m.role]">
                {{ teamRoleLabels[m.role] }}
              </span>
            </div>
            <select
              :value="m.role"
              class="h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              @change="(e) => changeRole(m.userId, Number((e.target as HTMLSelectElement).value))"
            >
              <option v-for="r in roleOptions" :key="r" :value="r">{{ teamRoleLabels[r] }}</option>
            </select>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              title="Убрать"
              @click="remove(m.userId, m.username)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
        <p v-else class="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Пока нет участников.
        </p>
      </section>

      <!-- Request title -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold tracking-tight">Заявка на тайтл</h3>
        <div class="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">ID тайтла</label>
            <Input v-model="requestBookId" placeholder="GUID книги" />
          </div>
          <div class="flex-1">
            <label class="mb-1 block text-xs font-medium text-muted-foreground">Сообщение</label>
            <Input v-model="requestMsg" placeholder="Необязательно" />
          </div>
          <Button :disabled="!requestBookId.trim() || requesting" @click="submitRequest">
            <Loader2 v-if="requesting" class="mr-1.5 h-4 w-4 animate-spin" />
            <Send v-else class="mr-1.5 h-4 w-4" />
            Запросить
          </Button>
        </div>
      </section>

      <!-- Books -->
      <section class="space-y-3">
        <h3 class="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <BookMarked class="h-5 w-5 text-primary" /> Закреплённые тайтлы ({{ team.books.length }})
        </h3>
        <div v-if="team.books.length" class="grid gap-2 sm:grid-cols-2">
          <NuxtLink
            v-for="b in team.books"
            :key="b.id"
            :to="`/admin/books/${b.id}`"
            class="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 transition-colors hover:border-primary/40"
          >
            <div class="h-12 w-9 shrink-0 overflow-hidden rounded-md bg-secondary">
              <img v-if="b.coverUrl" :src="b.coverUrl" :alt="b.title" class="h-full w-full object-cover" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ b.title }}</p>
              <p class="text-xs text-muted-foreground">{{ b.chapterCount }} гл.</p>
            </div>
          </NuxtLink>
        </div>
        <p v-else class="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Нет закреплённых тайтлов.
        </p>
      </section>
    </div>

    <div v-else class="py-16 text-center text-muted-foreground">Команда не найдена.</div>
  </AdminShell>
</template>
