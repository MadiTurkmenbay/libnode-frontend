<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { Button } from '@/components/ui/button'
import { AuthModal } from '@/components/auth'
import ThemeToggle from '@/components/ThemeToggle.vue'
import NotificationBell from '@/components/NotificationBell.vue'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { Library, Quote, Bookmark, LogOut, Shield, Trophy, Menu, Home, Star, Rss, Crown, LogIn, UserPlus } from 'lucide-vue-next'

const menuOpen = ref(false)
function closeMenu() { menuOpen.value = false }
function menuLogout() { closeMenu(); handleLogout() }
function menuLogin() { closeMenu(); openLogin() }
function menuRegister() { closeMenu(); openRegister() }

const { user, isAuthenticated, isAdmin, logout } = useAuth()
const { me, fetchMe } = useAccount()
const { stats, fetchStats } = useGamification()
const { showGamification } = useUiPrefs()
const { toast } = useToast()

const avatarInitials = computed(() =>
  (me.value?.username || user.value?.username || '?').slice(0, 2).toUpperCase(),
)

function loadAccount() {
  if (!isAuthenticated.value) return
  fetchMe().catch(() => {})
  fetchStats().catch(() => {})
}
onMounted(loadAccount)
watch(isAuthenticated, (v) => { if (v) loadAccount() })

const isAuthModalOpen = ref(false)
const authModalTab = ref<'login' | 'register'>('login')

function openLogin() {
  authModalTab.value = 'login'
  isAuthModalOpen.value = true
}

function openRegister() {
  authModalTab.value = 'register'
  isAuthModalOpen.value = true
}

function handleLogout() {
  logout()
  toast('Вы вышли из аккаунта')
}

const navLinkClass =
  'relative rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
const navLinkActiveClass = 'text-foreground bg-accent/10'
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container mx-auto flex h-14 items-center gap-3 px-4">
      <!-- Brand -->
      <NuxtLink to="/" class="flex shrink-0 items-center gap-2">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
        >
          <Library class="h-4 w-4" />
        </span>
        <span class="text-lg font-bold tracking-tight">Lib<span class="text-gradient">Node</span></span>
      </NuxtLink>

      <!-- Primary nav -->
      <nav class="ml-2 hidden items-center gap-1 sm:flex">
        <NuxtLink to="/" :class="navLinkClass" :active-class="navLinkActiveClass">Главная</NuxtLink>
        <NuxtLink to="/catalog" :class="navLinkClass" :active-class="navLinkActiveClass">Каталог</NuxtLink>
        <NuxtLink to="/rankings" :class="navLinkClass" :active-class="navLinkActiveClass">Рейтинги</NuxtLink>
        <NuxtLink to="/leaderboard" :class="navLinkClass" :active-class="navLinkActiveClass">Лидеры</NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/feed" :class="navLinkClass" :active-class="navLinkActiveClass">Лента</NuxtLink>
      </nav>

      <!-- Right side -->
      <div class="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <template v-if="!isAuthenticated">
          <Button variant="ghost" class="hidden h-9 px-3 sm:inline-flex" @click="openLogin">Войти</Button>
          <Button class="hidden h-9 px-4 sm:inline-flex" @click="openRegister">Регистрация</Button>
        </template>

        <template v-else>
          <ClientOnly>
            <NotificationBell />
          </ClientOnly>

          <!-- Desktop-only quick links (collapsed into the menu on mobile) -->
          <Button as-child variant="ghost" class="hidden sm:inline-flex sm:w-auto sm:px-3" title="Мои закладки">
            <NuxtLink to="/profile/collections" class="inline-flex items-center gap-1.5">
              <Bookmark class="h-4 w-4" /><span>Закладки</span>
            </NuxtLink>
          </Button>
          <Button as-child variant="ghost" class="hidden sm:inline-flex sm:w-auto sm:px-3" title="Мои цитаты">
            <NuxtLink to="/profile/quotes" class="inline-flex items-center gap-1.5">
              <Quote class="h-4 w-4" /><span>Цитаты</span>
            </NuxtLink>
          </Button>
          <Button v-if="isAdmin" as-child variant="ghost" class="hidden text-primary sm:inline-flex sm:w-auto sm:px-3" title="Админка">
            <NuxtLink to="/admin" class="inline-flex items-center gap-1.5">
              <Shield class="h-4 w-4" /><span>Админка</span>
            </NuxtLink>
          </Button>

          <ClientOnly>
            <NuxtLink
              to="/profile"
              class="ml-1 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 py-0.5 pl-0.5 pr-2.5 transition-colors hover:bg-accent/10"
              title="Личный кабинет"
            >
              <span class="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                <img v-if="me?.avatarUrl" :src="me.avatarUrl" alt="" class="h-full w-full object-cover" />
                <template v-else>{{ avatarInitials }}</template>
              </span>
              <span class="hidden text-sm font-medium sm:inline">{{ me?.username || user?.username }}</span>
              <span v-if="showGamification" class="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 text-[11px] font-bold text-primary">
                <Trophy class="h-3 w-3" />{{ stats?.level ?? 1 }}
              </span>
            </NuxtLink>
          </ClientOnly>

          <Button
            variant="ghost"
            class="hidden text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:inline-flex sm:w-auto sm:px-3"
            title="Выйти"
            @click="handleLogout"
          >
            <LogOut class="h-4 w-4" /><span>Выйти</span>
          </Button>
        </template>

        <!-- Mobile menu (collapses nav + actions) -->
        <Popover v-model:open="menuOpen">
          <PopoverTrigger as-child>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/60 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground sm:hidden"
              title="Меню"
              aria-label="Меню"
            >
              <Menu class="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" :side-offset="8" class="w-56 p-1.5">
            <NuxtLink to="/" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent/10" @click="closeMenu">
              <Home class="h-4 w-4 text-muted-foreground" /> Главная
            </NuxtLink>
            <NuxtLink to="/catalog" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent/10" @click="closeMenu">
              <Library class="h-4 w-4 text-muted-foreground" /> Каталог
            </NuxtLink>
            <NuxtLink to="/rankings" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent/10" @click="closeMenu">
              <Star class="h-4 w-4 text-muted-foreground" /> Рейтинги
            </NuxtLink>
            <NuxtLink to="/leaderboard" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent/10" @click="closeMenu">
              <Crown class="h-4 w-4 text-muted-foreground" /> Лидеры
            </NuxtLink>

            <template v-if="isAuthenticated">
              <NuxtLink to="/feed" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent/10" @click="closeMenu">
                <Rss class="h-4 w-4 text-muted-foreground" /> Лента
              </NuxtLink>
              <div class="my-1 border-t border-border"></div>
              <NuxtLink to="/profile/collections" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent/10" @click="closeMenu">
                <Bookmark class="h-4 w-4 text-muted-foreground" /> Закладки
              </NuxtLink>
              <NuxtLink to="/profile/quotes" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent/10" @click="closeMenu">
                <Quote class="h-4 w-4 text-muted-foreground" /> Цитаты
              </NuxtLink>
              <NuxtLink v-if="isAdmin" to="/admin" class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-primary transition-colors hover:bg-accent/10" @click="closeMenu">
                <Shield class="h-4 w-4" /> Админка
              </NuxtLink>
              <button type="button" class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10" @click="menuLogout">
                <LogOut class="h-4 w-4" /> Выйти
              </button>
            </template>
            <template v-else>
              <div class="my-1 border-t border-border"></div>
              <button type="button" class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent/10" @click="menuLogin">
                <LogIn class="h-4 w-4 text-muted-foreground" /> Войти
              </button>
              <button type="button" class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-accent/10" @click="menuRegister">
                <UserPlus class="h-4 w-4" /> Регистрация
              </button>
            </template>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  </header>

  <ClientOnly>
    <AuthModal v-model:open="isAuthModalOpen" :initial-tab="authModalTab" />
  </ClientOnly>
</template>
