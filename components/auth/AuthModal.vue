<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { LoginForm, RegisterForm } from '@/components/auth'

type AuthTab = 'login' | 'register'

const props = defineProps<{
  open: boolean
  initialTab?: AuthTab
  redirectTo?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

const activeTab = ref<AuthTab>(props.initialTab ?? 'login')

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

watch(() => props.initialTab, (tab) => {
  if (tab) {
    activeTab.value = tab
  }
})

watch(() => props.open, (open) => {
  if (open) {
    activeTab.value = props.initialTab ?? 'login'
  }
})

function handleSuccess() {
  isOpen.value = false
  emit('success')
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="text-center sm:text-center">
        <DialogTitle>
          {{ activeTab === 'login' ? 'Вход в LibNode' : 'Регистрация' }}
        </DialogTitle>
        <DialogDescription>
          {{ activeTab === 'login'
            ? 'Введите ваш email и пароль для доступа к аккаунту'
            : 'Создайте новый аккаунт в LibNode' }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-2 gap-1 rounded-lg border bg-muted p-1 mb-2">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="activeTab === 'login'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'login'"
        >
          Вход
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="activeTab === 'register'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'register'"
        >
          Регистрация
        </button>
      </div>

      <LoginForm
        v-if="activeTab === 'login'"
        :redirect-to="redirectTo"
        @success="handleSuccess"
      />
      <RegisterForm
        v-else
        :redirect-to="redirectTo"
        @success="handleSuccess"
      />

      <div class="text-center text-sm text-muted-foreground mt-2">
        <template v-if="activeTab === 'login'">
          Нет аккаунта?
          <button
            type="button"
            class="underline underline-offset-4 hover:text-primary"
            @click="activeTab = 'register'"
          >
            Зарегистрироваться
          </button>
        </template>
        <template v-else>
          Уже есть аккаунт?
          <button
            type="button"
            class="underline underline-offset-4 hover:text-primary"
            @click="activeTab = 'login'"
          >
            Войти
          </button>
        </template>
      </div>
    </DialogContent>
  </Dialog>
</template>
