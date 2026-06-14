<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { CreateUserDto } from '~/types'

const props = defineProps<{
  redirectTo?: string
}>()

const emit = defineEmits<{
  success: []
  error: [message: string]
}>()

const { register } = useAuth()
const { toast } = useToast()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Пароли не совпадают'
    emit('error', errorMessage.value)
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Пароль должен быть не менее 6 символов'
    emit('error', errorMessage.value)
    return
  }

  isLoading.value = true

  try {
    await register({
      username: username.value,
      email: email.value,
      password: password.value,
    } as CreateUserDto)
    toast('Регистрация прошла успешно')
    emit('success')
    if (props.redirectTo) {
      navigateTo(props.redirectTo)
    } else {
      navigateTo('/')
    }
  } catch (e: any) {
    const message = e?.response?._data?.error
      ?? 'Не удалось создать аккаунт. Возможно, email или имя уже заняты.'
    errorMessage.value = message
    emit('error', message)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <div
      v-if="errorMessage"
      class="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center"
      role="alert"
    >
      {{ errorMessage }}
    </div>
    <div class="grid gap-2">
      <Label for="register-username">Имя пользователя</Label>
      <Input
        id="register-username"
        v-model="username"
        type="text"
        placeholder="User123"
        minlength="3"
        maxlength="50"
        autocomplete="username"
        required
        :disabled="isLoading"
        autofocus
      />
    </div>
    <div class="grid gap-2">
      <Label for="register-email">Email</Label>
      <Input
        id="register-email"
        v-model="email"
        type="email"
        placeholder="m@example.com"
        autocomplete="email"
        required
        :disabled="isLoading"
      />
    </div>
    <div class="grid gap-2">
      <Label for="register-password">Пароль</Label>
      <Input
        id="register-password"
        v-model="password"
        type="password"
        autocomplete="new-password"
        placeholder="Минимум 6 символов"
        required
        :disabled="isLoading"
      />
    </div>
    <div class="grid gap-2">
      <Label for="register-confirm-password">Повторите пароль</Label>
      <Input
        id="register-confirm-password"
        v-model="confirmPassword"
        type="password"
        autocomplete="new-password"
        required
        :disabled="isLoading"
      />
    </div>
    <Button class="w-full" type="submit" :disabled="isLoading">
      <template v-if="isLoading">Регистрация...</template>
      <template v-else>Зарегистрироваться</template>
    </Button>
  </form>
</template>
