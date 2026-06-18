<script setup lang="ts">
import { Library } from 'lucide-vue-next'

const year = 2026
</script>

<template>
  <footer class="mt-12 border-t border-border/70 bg-card/30">
    <div class="app-container py-10">
      <div class="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div class="max-w-sm">
          <NuxtLink to="/" class="flex items-center gap-2">
            <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <Library class="h-4 w-4" />
            </span>
            <span class="text-lg font-bold tracking-tight">Lib<span class="text-gradient">Node</span></span>
          </NuxtLink>
          <p class="mt-3 text-sm text-muted-foreground">
            Читай ранобэ и веб-новеллы с удобной читалкой, закладками, цитатами и
            переводами от команд.
          </p>
        </div>

        <nav class="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
          <div class="flex flex-col gap-2">
            <span class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Каталог</span>
            <NuxtLink to="/" class="text-muted-foreground transition-colors hover:text-foreground">Главная</NuxtLink>
            <NuxtLink to="/catalog" class="text-muted-foreground transition-colors hover:text-foreground">Каталог</NuxtLink>
          </div>
          <div class="flex flex-col gap-2">
            <span class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Профиль</span>
            <NuxtLink to="/profile/collections" class="text-muted-foreground transition-colors hover:text-foreground">Закладки</NuxtLink>
            <NuxtLink to="/profile/quotes" class="text-muted-foreground transition-colors hover:text-foreground">Цитаты</NuxtLink>
            <NuxtLink to="/profile/invites" class="text-muted-foreground transition-colors hover:text-foreground">Приглашения</NuxtLink>
          </div>
        </nav>
      </div>

      <div class="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
        <span>© {{ year }} LibNode. Все права у правообладателей.</span>
        <span>Сделано для читателей ✦</span>
      </div>
    </div>
  </footer>
</template>
