<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { Button } from '@/components/ui/button'
import { Library } from 'lucide-vue-next'

const { user, isAuthenticated, isAdmin, logout } = useAuth()
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

      <!-- Mobile logo + nav -->
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
            <NuxtLink to="/login">
              <Button variant="ghost" class="h-8 px-4">Войти</Button>
            </NuxtLink>
            <NuxtLink to="/register">
              <Button class="h-8 px-4">Регистрация</Button>
            </NuxtLink>
          </template>
          
          <template v-else>
            <div class="text-sm font-medium pr-2 border-r hidden sm:block">
              Привет, {{ user?.username }}
            </div>
            <NuxtLink to="/profile/collections">
              <Button variant="ghost" class="h-8 px-4 text-primary">Мои закладки</Button>
            </NuxtLink>
            <NuxtLink v-if="isAdmin" to="/admin">
              <Button variant="outline" class="h-8 px-4">Админка</Button>
            </NuxtLink>
            <Button variant="ghost" class="h-8 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive" @click="logout">
              Выйти
            </Button>
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>

