<script setup lang="ts">
import { Home, ArrowLeft, Compass } from 'lucide-vue-next'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const is404 = computed(() => props.error?.statusCode === 404)

useHead({ title: is404.value ? 'Страница не найдена — LibNode' : 'Ошибка — LibNode' })

function handleError() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
    <div class="max-w-md">
      <div class="mb-6 text-7xl font-black tabular-nums text-gradient">
        {{ error?.statusCode || 500 }}
      </div>

      <h1 class="mb-3 text-2xl font-bold tracking-tight">
        {{ is404 ? 'Страница не найдена' : 'Что-то пошло не так' }}
      </h1>

      <p class="mb-8 text-sm text-muted-foreground">
        {{ is404
          ? 'Возможно, страница была перемещена, удалена или вы ввели неверный адрес.'
          : 'Произошла непредвиденная ошибка. Попробуйте вернуться на главную.' }}
      </p>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          @click="handleError"
        >
          <Home class="h-4 w-4" />
          На главную
        </button>
        <NuxtLink
          to="/catalog"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-6 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <Compass class="h-4 w-4" />
          В каталог
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
