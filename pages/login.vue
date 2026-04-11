<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const { login } = useAuth()

const email = ref('')
const password = ref('')

const isLoading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    await login({
      email: email.value,
      password: password.value
    })
    // Редирект на главную при успехе, это уже неявно обрабатывается пользователем либо делаем тут:
    navigateTo('/')
  } catch (e: any) {
    if (e?.response?._data?.error) {
       errorMessage.value = e.response._data.error
    } else {
       errorMessage.value = 'Не удалось войти. Убедитесь, что email и пароль правильные.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="container relative flex h-screen w-full flex-col items-center justify-center -mt-14 mx-auto px-4">
    <Card class="w-full max-w-[400px]">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl">Вход</CardTitle>
        <CardDescription>Введите ваш email и пароль для доступа к аккаунту</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit">
          <div class="grid gap-4">
            <div
              v-if="errorMessage"
              class="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center"
            >
              {{ errorMessage }}
            </div>
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="password">Пароль</Label>
              <Input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="Ваш пароль"
                required
              />
            </div>
            <Button class="w-full" type="submit" :disabled="isLoading">
              <template v-if="isLoading">Загрузка...</template>
              <template v-else>Войти</template>
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex flex-col gap-2">
        <div class="text-center text-sm text-muted-foreground w-full">
          Нет аккаунта?
          <NuxtLink to="/register" class="underline underline-offset-4 hover:text-primary">
            Зарегистрироваться
          </NuxtLink>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
