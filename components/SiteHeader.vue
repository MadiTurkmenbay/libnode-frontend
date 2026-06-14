<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { Button } from '@/components/ui/button'
import { AuthModal } from '@/components/auth'
import { Library, Quote } from 'lucide-vue-next'

const { user, isAuthenticated, isAdmin, logout } = useAuth()
const { toast } = useToast()

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
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-14 items-center mx-auto px-4">
      <div class="mr-4 hidden md:flex">
        <NuxtLink to="/" class="mr-6 flex items-center space-x-2">
          <Library class="h-6 w-6 text-primary" />
          <span class="hidden font-bold sm:inline-block text-lg tracking-tight">Lib<span class="text-primary">Node</span></span>
        </NuxtLink>
        <nav class="flex items-center space-x-6 text-sm font-medium">
          <NuxtLink to="/" class="transition-colors hover:text-foreground/80 text-foreground/60">Главная</NuxtLink>
          <NuxtLink to="/catalog" class="transition-colors hover:text-foreground/80 text-foreground/60">Каталог</NuxtLink>
        </nav>
      </div>

      <div class="mr-auto flex items-center space-x-4 md:hidden">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <Library class="h-6 w-6 text-primary" />
          <span class="font-bold text-lg tracking-tight">Lib<span class="text-primary">Node</span></span>
        </NuxtLink>
        <nav class="flex items-center space-x-3 text-sm font-medium">
          <NuxtLink to="/" class="transition-colors hover:text-foreground/80 text-foreground/60">Главная</NuxtLink>
          <NuxtLink to="/catalog" class="transition-colors hover:text-foreground/80 text-foreground/60">Каталог</NuxtLink>
        </nav>
      </div>

      <div class="flex flex-1 items-center justify-end space-x-4">
        <nav class="flex items-center space-x-2">
          <template v-if="!isAuthenticated">
            <Button variant="ghost" class="h-8 px-4" @click="openLogin">
              Войти
            </Button>
            <Button class="h-8 px-4" @click="openRegister">
              Регистрация
            </Button>
          </template>

          <template v-else>
            <div class="text-sm font-medium pr-2 border-r hidden sm:block">
              Привет, {{ user?.username }}
            </div>
            <Button as-child variant="ghost" class="h-8 px-4 text-primary">
              <NuxtLink to="/profile/collections">Мои закладки</NuxtLink>
            </Button>
            <Button as-child variant="ghost" class="h-8 px-4 text-primary">
              <NuxtLink to="/profile/quotes" class="inline-flex items-center gap-1.5">
                <Quote class="h-4 w-4" />
                <span>Цитаты</span>
              </NuxtLink>
            </Button>
            <Button v-if="isAdmin" as-child variant="outline" class="h-8 px-4">
              <NuxtLink to="/admin">Админка</NuxtLink>
            </Button>
            <Button variant="ghost" class="h-8 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive" @click="handleLogout">
              Выйти
            </Button>
          </template>
        </nav>
      </div>
    </div>
  </header>

  <ClientOnly>
    <AuthModal
      v-model:open="isAuthModalOpen"
      :initial-tab="authModalTab"
    />
  </ClientOnly>
</template>
