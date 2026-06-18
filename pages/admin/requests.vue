<script setup lang="ts">
import { Loader2, Inbox, Check, X } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { RequestStatus } from '~/types'
import type { TeamTitleRequestDto } from '~/types'
import { requestStatusLabels, requestStatusBadge } from '~/lib/teamRole'
import { formatRelativeTime } from '~/lib/formatters'

definePageMeta({ middleware: ['admin'] })
useHead({ title: 'Заявки команд — Админка' })

const { toast } = useToast()
const { listRequests, decideRequest } = useTeams()

const requests = ref<TeamTitleRequestDto[]>([])
const loading = ref(true)
const filter = ref<RequestStatus | 'all'>(RequestStatus.Pending)
const busy = ref<string | null>(null)

const filterOptions = [
  { value: RequestStatus.Pending, label: 'Ожидают' },
  { value: 'all' as const, label: 'Все' },
  { value: RequestStatus.Approved, label: 'Одобренные' },
  { value: RequestStatus.Rejected, label: 'Отклонённые' },
]

async function load() {
  loading.value = true
  try {
    requests.value = (await listRequests(filter.value === 'all' ? undefined : filter.value)) ?? []
  }
  finally {
    loading.value = false
  }
}

watch(filter, load)

async function decide(r: TeamTitleRequestDto, approve: boolean) {
  busy.value = r.id
  try {
    const updated = await decideRequest(r.id, approve)
    if (updated) {
      if (filter.value === 'all') {
        const i = requests.value.findIndex((x) => x.id === r.id)
        if (i >= 0) requests.value[i] = updated
      }
      else {
        requests.value = requests.value.filter((x) => x.id !== r.id)
      }
    }
    toast(approve ? 'Заявка одобрена, тайтл закреплён' : 'Заявка отклонена')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось обработать заявку' })
  }
  finally {
    busy.value = null
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Заявки">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Inbox class="h-5 w-5 text-primary" />
        <h2 class="text-xl font-bold tracking-tight">Заявки команд на тайтлы</h2>
      </div>
      <div class="flex gap-1 rounded-xl border border-border bg-background p-1">
        <button
          v-for="opt in filterOptions"
          :key="String(opt.value)"
          type="button"
          class="rounded-lg px-3 py-1 text-xs font-medium transition-colors"
          :class="filter === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="filter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="requests.length" class="space-y-2.5">
      <div
        v-for="r in requests"
        :key="r.id"
        class="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center"
      >
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold">{{ r.teamName }}</span>
            <span class="text-muted-foreground">→</span>
            <NuxtLink :to="`/books/${r.bookId}`" class="truncate text-primary hover:underline">{{ r.bookTitle }}</NuxtLink>
            <span class="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase" :class="requestStatusBadge[r.status]">
              {{ requestStatusLabels[r.status] }}
            </span>
          </div>
          <p v-if="r.message" class="mt-1 text-sm text-muted-foreground">{{ r.message }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ formatRelativeTime(r.createdAt) }}</p>
        </div>
        <div v-if="r.status === RequestStatus.Pending" class="flex shrink-0 gap-2">
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 text-sm font-medium text-emerald-500 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
            :disabled="busy === r.id"
            @click="decide(r, true)"
          >
            <Loader2 v-if="busy === r.id" class="h-4 w-4 animate-spin" />
            <Check v-else class="h-4 w-4" />
            Одобрить
          </button>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-500/15 px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/25 disabled:opacity-50"
            :disabled="busy === r.id"
            @click="decide(r, false)"
          >
            <X class="h-4 w-4" />
            Отклонить
          </button>
        </div>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
      Заявок нет.
    </div>
  </AdminShell>
</template>
