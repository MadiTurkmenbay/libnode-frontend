<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const { register } = useAuth()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Пароли не совпадают'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Пароль должен быть не менее 6 символов'
    return
  }

  isLoading.value = true
  
  try {
    await register({
      username: username.value,
      email: email.value,
      password: password.value
    })
    
    // В случае успеха можно перекинуть на окно входа или сразу на главную (так как useAuth сохраняет токен)
    // Перекинем на главную, т.к. бэкенд сразу возвращает JWT-токен на register!
    navigateTo('/')
  } catch (e: any) {
    if (e?.response?._data?.error) {
       errorMessage.value = e.response._data.error
    } else {
       errorMessage.value = 'Не удалось создать аккаунт. Возможно, email или имя уже заняты.'
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
        <CardTitle class="text-2xl">Регистрация</CardTitle>
        <CardDescription>Создайте новый аккаунт в LibNode</CardDescription>
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
            
            <div
              v-if="successMessage"
              class="rounded-md bg-green-500/15 p-3 text-sm text-green-600 text-center"
            >
              {{ successMessage }}
            </div>

            <div class="grid gap-2">
              <Label for="username">Имя пользователя (Никнейм)</Label>
              <Input
                id="username"
                v-model="username"
                type="text"
                placeholder="User123"
                minlength="3"
                maxlength="50"
                required
              />
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
                autocomplete="new-password"
                placeholder="Минимум 6 символов"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="confirmPassword">Повторите пароль</Label>
              <Input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
              />
            </div>
            <Button class="w-full" type="submit" :disabled="isLoading || successMessage.length > 0">
              <template v-if="isLoading">Регистрация...</template>
              <template v-else>Зарегистрироваться</template>
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex flex-col gap-2">
        <div class="text-center text-sm text-muted-foreground w-full">
          Уже есть аккаунт?
          <NuxtLink to="/login" class="underline underline-offset-4 hover:text-primary">
            Войти
          </NuxtLink>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
