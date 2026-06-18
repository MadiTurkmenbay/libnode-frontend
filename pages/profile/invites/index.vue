<script setup lang="ts">
import { Loader2, UsersRound, Check, X, MailOpen } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { TeamInviteDto } from '~/types'
import { teamRoleLabels } from '~/lib/teamRole'
import { formatRelativeTime } from '~/lib/formatters'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Приглашения — LibNode' })

const { toast } = useToast()
const { myInvites, acceptInvite, declineInvite } = useTeams()

const invites = ref<TeamInviteDto[]>([])
const loading = ref(true)
const busy = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    invites.value = (await myInvites()) ?? []
  }
  finally {
    loading.value = false
  }
}

async function accept(inv: TeamInviteDto) {
  busy.value = inv.id
  try {
    await acceptInvite(inv.id)
    invites.value = invites.value.filter((x) => x.id !== inv.id)
    toast(`Вы вступили в команду «${inv.teamName}»`)
  }
  catch (err: unknown) {
    const message = (err as { statusMessage?: string })?.statusMessage || 'Не удалось принять'
    toast({ variant: 'destructive', title: message })
  }
  finally {
    busy.value = null
  }
}

async function decline(inv: TeamInviteDto) {
  busy.value = inv.id
  try {
    await declineInvite(inv.id)
    invites.value = invites.value.filter((x) => x.id !== inv.id)
    toast('Приглашение отклонено')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось отклонить' })
  }
  finally {
    busy.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="app-container py-6 md:py-8">
    <h1 class="mb-6 flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
      <MailOpen class="h-7 w-7 text-primary" />
      Приглашения в команды
    </h1>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="invites.length" class="space-y-3">
      <div
        v-for="inv in invites"
        :key="inv.id"
        class="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UsersRound class="h-5 w-5" />
          </span>
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ inv.teamName }}</p>
            <p class="text-xs text-muted-foreground">
              Роль: {{ teamRoleLabels[inv.role] }} · {{ formatRelativeTime(inv.createdAt) }}
            </p>
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <Button size="sm" :disabled="busy === inv.id" @click="accept(inv)">
            <Loader2 v-if="busy === inv.id" class="mr-1.5 h-4 w-4 animate-spin" />
            <Check v-else class="mr-1.5 h-4 w-4" />
            Принять
          </Button>
          <Button size="sm" variant="ghost" :disabled="busy === inv.id" @click="decline(inv)">
            <X class="mr-1.5 h-4 w-4" /> Отклонить
          </Button>
        </div>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-dashed py-20 text-center">
      <MailOpen class="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
      <h2 class="text-xl font-semibold">Нет приглашений</h2>
      <p class="mt-1 text-sm text-muted-foreground">Когда вас пригласят в команду, оно появится здесь.</p>
    </div>
  </div>
</template>
