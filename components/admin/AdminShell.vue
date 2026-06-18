<script setup lang="ts">
import { LayoutDashboard, BookMarked, MessageSquare, ArrowLeft, Library, Users, UsersRound, Inbox, Flag } from 'lucide-vue-next'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuth } from '~/composables/useAuth'

defineProps<{ title?: string }>()

const { user } = useAuth()

const nav = [
  { to: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { to: '/admin/books', label: 'Книги', icon: BookMarked, exact: false },
  { to: '/admin/comments', label: 'Комментарии', icon: MessageSquare, exact: false },
  { to: '/admin/reports', label: 'Жалобы', icon: Flag, exact: false },
  { to: '/admin/teams', label: 'Команды', icon: UsersRound, exact: false },
  { to: '/admin/requests', label: 'Заявки', icon: Inbox, exact: false },
  { to: '/admin/users', label: 'Пользователи', icon: Users, exact: false },
]
</script>

<template>
  <div class="flex min-h-screen bg-muted/30">
    <!-- Sidebar -->
    <aside class="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background md:flex">
      <div class="flex h-14 items-center gap-2 border-b border-border px-4">
        <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <Library class="h-4 w-4" />
        </span>
        <span class="font-bold tracking-tight">Admin</span>
      </div>

      <nav class="flex-1 space-y-1 p-3">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :exact-active-class="item.exact ? 'bg-primary/10 text-primary' : ''"
          :active-class="!item.exact ? 'bg-primary/10 text-primary' : ''"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="border-t border-border p-3">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <ArrowLeft class="h-4 w-4" />
          На сайт
        </NuxtLink>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
        <div class="flex items-center gap-2">
          <!-- Mobile nav -->
          <nav class="flex items-center gap-1 md:hidden">
            <NuxtLink
              v-for="item in nav"
              :key="item.to"
              :to="item.to"
              :active-class="'text-primary'"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground"
              :title="item.label"
            >
              <component :is="item.icon" class="h-4 w-4" />
            </NuxtLink>
          </nav>
          <h1 class="text-base font-semibold tracking-tight">{{ title }}</h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="hidden text-sm text-muted-foreground sm:inline">{{ user?.username }}</span>
          <ThemeToggle />
        </div>
      </header>

      <main class="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
