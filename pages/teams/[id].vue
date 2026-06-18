<script setup lang="ts">
import { UsersRound, BookOpen, Loader2, BadgeCheck } from 'lucide-vue-next'
import { FollowTargetType } from '~/types'
import type { TeamDetailDto } from '~/types'
import { teamRoleLabels, teamRoleBadge } from '~/lib/teamRole'

const route = useRoute()
const teamId = route.params.id as string
const { publicTeam } = useTeams()

const { data: team, pending } = await useAsyncData<TeamDetailDto | null>(
  `public-team-${teamId}`,
  () => publicTeam(teamId).then((t) => t ?? null).catch(() => null),
)

useHead(() => ({ title: team.value ? `${team.value.name} — Команда` : 'Команда' }))

const sortedMembers = computed(() =>
  [...(team.value?.members ?? [])].sort((a, b) => a.role - b.role),
)
</script>

<template>
  <div class="app-container py-6 md:py-8">
    <div v-if="pending" class="flex justify-center py-20">
      <Loader2 class="h-7 w-7 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="team">
      <!-- Hero -->
      <div class="mb-8 flex items-start gap-4">
        <span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <UsersRound class="h-8 w-8" />
        </span>
        <div>
          <h1 class="text-2xl font-bold tracking-tight md:text-3xl">
            {{ team.name }}
            <span v-if="team.isVerified" class="ml-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20" title="Проверенная команда">
              <BadgeCheck class="h-3.5 w-3.5" /> Проверена
            </span>
          </h1>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ team.members.length }} участн. · {{ team.books.length }} тайтлов
          </p>
          <p v-if="team.description" class="mt-2 max-w-2xl text-sm text-muted-foreground">{{ team.description }}</p>
          <div class="mt-3">
            <FollowButton :target-type="FollowTargetType.Team" :target-id="teamId" show-count />
          </div>
        </div>
      </div>

      <!-- Members -->
      <section class="mb-10">
        <h2 class="mb-3 text-lg font-semibold tracking-tight">Состав</h2>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="m in sortedMembers"
            :key="m.userId"
            class="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3"
          >
            <UserAvatar :username="m.username" size="sm" />
            <span class="text-sm font-medium">{{ m.username }}</span>
            <span class="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase" :class="teamRoleBadge[m.role]">
              {{ teamRoleLabels[m.role] }}
            </span>
          </div>
        </div>
      </section>

      <!-- Titles -->
      <section>
        <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <BookOpen class="h-5 w-5 text-primary" /> Переводы команды
        </h2>
        <div v-if="team.books.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <NuxtLink
            v-for="b in team.books"
            :key="b.id"
            :to="`/books/${b.id}`"
            class="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/50"
          >
            <div class="aspect-[3/4] w-full overflow-hidden bg-secondary">
              <img v-if="b.coverUrl" :src="b.coverUrl" :alt="b.title" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
                <BookOpen class="h-10 w-10 text-muted-foreground/40" />
              </div>
            </div>
            <div class="p-2.5">
              <p class="line-clamp-2 text-xs font-semibold leading-snug transition-colors group-hover:text-primary sm:text-sm">{{ b.title }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ b.chapterCount }} гл.</p>
            </div>
          </NuxtLink>
        </div>
        <p v-else class="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          У команды пока нет закреплённых тайтлов.
        </p>
      </section>
    </div>

    <div v-else class="py-20 text-center text-muted-foreground">Команда не найдена.</div>
  </div>
</template>
