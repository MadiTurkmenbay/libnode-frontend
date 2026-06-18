<script setup lang="ts">
import { Loader2, Plus, UsersRound, ArrowRight, Trash2 } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { TeamDto } from '~/types'

definePageMeta({ middleware: ['admin'] })
useHead({ title: 'Команды — Админка' })

const { toast } = useToast()
const { listTeams, createTeam, deleteTeam } = useTeams()

const teams = ref<TeamDto[]>([])
const loading = ref(true)
const creating = ref(false)
const newName = ref('')
const newDesc = ref('')

async function load() {
  loading.value = true
  try {
    teams.value = (await listTeams()) ?? []
  }
  finally {
    loading.value = false
  }
}

async function create() {
  if (!newName.value.trim() || creating.value) return
  creating.value = true
  try {
    const t = await createTeam({ name: newName.value.trim(), description: newDesc.value.trim() || null })
    if (t) {
      teams.value.unshift(t)
      newName.value = ''
      newDesc.value = ''
      toast('Команда создана')
    }
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось создать команду'
    toast({ variant: 'destructive', title: message })
  }
  finally {
    creating.value = false
  }
}

async function remove(t: TeamDto) {
  if (!window.confirm(`Удалить команду «${t.name}»? Тайтлы открепятся.`)) return
  try {
    await deleteTeam(t.id)
    teams.value = teams.value.filter((x) => x.id !== t.id)
    toast('Команда удалена')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось удалить' })
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Команды">
    <section class="mb-8 rounded-2xl border border-border bg-background p-5">
      <div class="mb-4 flex items-center gap-2">
        <Plus class="h-5 w-5 text-primary" />
        <h2 class="text-lg font-semibold tracking-tight">Новая команда</h2>
      </div>
      <div class="grid gap-3">
        <Input v-model="newName" placeholder="Название команды" maxlength="150" @keydown.enter="create" />
        <textarea
          v-model="newDesc"
          rows="2"
          placeholder="Описание (необязательно)"
          class="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        ></textarea>
        <div class="flex justify-end">
          <Button :disabled="!newName.trim() || creating" @click="create">
            <Loader2 v-if="creating" class="mr-1.5 h-4 w-4 animate-spin" />
            <Plus v-else class="mr-1.5 h-4 w-4" />
            Создать
          </Button>
        </div>
      </div>
    </section>

    <section>
      <div class="mb-4 flex items-center gap-2">
        <UsersRound class="h-5 w-5 text-primary" />
        <h2 class="text-lg font-semibold tracking-tight">Все команды</h2>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="teams.length" class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="t in teams"
          :key="t.id"
          class="group flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
        >
          <NuxtLink :to="`/admin/teams/${t.id}`" class="min-w-0 flex-1">
            <p class="truncate font-semibold">{{ t.name }}</p>
            <p class="text-xs text-muted-foreground">{{ t.memberCount }} участн. · {{ t.bookCount }} тайтлов</p>
          </NuxtLink>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
            title="Удалить"
            @click="remove(t)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
          <NuxtLink :to="`/admin/teams/${t.id}`" class="text-muted-foreground transition-colors group-hover:text-primary">
            <ArrowRight class="h-4 w-4" />
          </NuxtLink>
        </div>
      </div>

      <div v-else class="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        Команд пока нет.
      </div>
    </section>
  </AdminShell>
</template>
