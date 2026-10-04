<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { apiErrorMessage } from '~/lib/apiErrors'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { LoginDto } from '~/types'

const props = defineProps<{
  redirectTo?: string
}>()

const emit = defineEmits<{
  success: []
  error: [message: string]
}>()

const { login } = useAuth()
const { toast } = useToast()

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
      password: password.value,
    } as LoginDto)
    toast('Вы успешно вошли в систему')
    emit('success')
    if (props.redirectTo) {
      navigateTo(props.redirectTo)
    } else {
      navigateTo('/')
    }
  } catch (e: unknown) {
    const message = apiErrorMessage(e, 'Не удалось войти. Убедитесь, что email и пароль правильные.')
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
      <Label for="login-email">Email</Label>
      <Input
        id="login-email"
        v-model="email"
        type="email"
        placeholder="m@example.com"
        autocomplete="email"
        required
        :disabled="isLoading"
        autofocus
      />
    </div>
    <div class="grid gap-2">
      <Label for="login-password">Пароль</Label>
      <Input
        id="login-password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        placeholder="Ваш пароль"
        required
        :disabled="isLoading"
      />
    </div>
    <Button class="w-full" type="submit" :disabled="isLoading">
      <template v-if="isLoading">Загрузка...</template>
      <template v-else>Войти</template>
    </Button>
  </form>
</template>
