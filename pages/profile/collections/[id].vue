<script setup lang="ts">
import { ArrowLeft, Loader2, BookOpen, Trash2 } from 'lucide-vue-next'
import type { CollectionDetailDto } from '~/types'
import BookCard from '~/components/BookCard.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const collectionId = route.params.id as string

const { data: collection, pending, error, refresh } = await useApiFetch<CollectionDetailDto>(`/api/collections/${collectionId}`, {
  key: `collection:${collectionId}:detail`,
})
const collectionsStore = useCollectionsStore()
const { toast } = useToast()
const name = ref(collection.value?.name ?? '')
const deleteOpen = ref(false)
const mutation = ref<'rename' | 'delete' | null>(null)
const actionError = ref('')
const busy = computed(() => Boolean(mutation.value) || collectionsStore.isUpdating || pending.value)
const canRename = computed(() => Boolean(name.value.trim()) && name.value.trim() !== collection.value?.name && !busy.value)

watch(() => collection.value?.name, value => {
  name.value = value ?? ''
})

async function renameCollection() {
  if (!canRename.value) return
  mutation.value = 'rename'
  actionError.value = ''
  try {
    await collectionsStore.renameCollection(collectionId, name.value)
    await refresh()
    if (error.value) throw error.value
    toast('Название папки сохранено')
  }
  catch {
    actionError.value = 'Не удалось сохранить название папки. Попробуйте ещё раз.'
  }
  finally {
    mutation.value = null
  }
}

function setDeleteOpen(open: boolean) {
  if (busy.value) return
  actionError.value = ''
  deleteOpen.value = open
}

async function deleteCollection() {
  if (busy.value) return
  mutation.value = 'delete'
  actionError.value = ''
  try {
    await collectionsStore.deleteCollection(collectionId)
    deleteOpen.value = false
    toast('Папка удалена')
    await navigateTo('/profile/collections')
  }
  catch {
    actionError.value = 'Не удалось удалить папку. Попробуйте ещё раз.'
  }
  finally {
    mutation.value = null
  }
}

useHead({
  title: computed(() => collection.value ? `${collection.value.name} — Мои закладки` : 'Закладки — LibNode'),
})

function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="app-container py-6 md:py-8">
    <div class="mb-8">
      <NuxtLink
        to="/profile/collections"
        class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mb-4"
      >
        <ArrowLeft class="h-4 w-4" />
        Назад к закладкам
      </NuxtLink>
      
      <div v-if="pending" class="h-8 w-64 bg-muted animate-pulse rounded-md mb-2"></div>
      <h1 v-else-if="collection" class="break-words text-3xl font-bold tracking-tight">{{ collection.name }}</h1>
      
      <div v-if="pending" class="h-6 w-32 bg-muted animate-pulse rounded-md mt-2"></div>
      <p v-else-if="collection" class="text-sm text-muted-foreground mt-2">
        Создано: {{ formatDate(collection.createdAt) }} • Книг: {{ collection.bookCount }}
      </p>
    </div>

    <div v-if="pending" class="py-20 text-center text-muted-foreground">
      <Loader2 class="h-8 w-8 animate-spin mx-auto" />
    </div>
    <div v-else-if="error || !collection" class="py-20 text-center text-destructive">
      Папка с закладками не найдена или у вас нет к ней доступа.
    </div>

    <div v-else>
      <div class="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end">
        <form class="min-w-0 flex-1" :aria-busy="mutation === 'rename'" @submit.prevent="renameCollection">
          <label for="collection-name" class="mb-2 block text-sm font-medium">Название папки</label>
          <div class="flex flex-col gap-2 sm:flex-row">
            <Input
              id="collection-name"
              v-model="name"
              required
              maxlength="150"
              :disabled="busy"
              class="min-w-0 flex-1"
            />
            <Button type="submit" :disabled="!canRename">
              <Loader2 v-if="mutation === 'rename'" class="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Сохранить название
            </Button>
          </div>
        </form>
        <Button type="button" variant="outline" :disabled="busy" @click="setDeleteOpen(true)">
          <Trash2 class="mr-2 h-4 w-4" aria-hidden="true" />
          Удалить папку
        </Button>
      </div>
      <p v-if="actionError && !deleteOpen" role="alert" class="mb-4 text-sm text-destructive">{{ actionError }}</p>

      <div v-if="collection.books && collection.books.length > 0" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-8">
        <BookCard 
          v-for="book in collection.books" 
          :key="book.id" 
          :book="book" 
        />
      </div>
      
      <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center mt-8">
        <BookOpen class="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 class="mt-4 text-lg font-semibold">В папке пусто</h3>
        <p class="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
          Вы еще не добавили ни одной книги в эту закладку.
        </p>
        <NuxtLink
          to="/"
          class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Перейти в каталог
        </NuxtLink>
      </div>

      <Dialog :open="deleteOpen" @update:open="setDeleteOpen">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить папку?</DialogTitle>
            <DialogDescription class="break-words">
              Папка «{{ collection.name }}» и её закладки будут удалены. Сами книги останутся в каталоге.
            </DialogDescription>
          </DialogHeader>
          <p v-if="actionError" role="alert" class="text-sm text-destructive">{{ actionError }}</p>
          <DialogFooter>
            <Button type="button" variant="outline" :disabled="busy" @click="setDeleteOpen(false)">Отмена</Button>
            <Button type="button" variant="destructive" :disabled="busy" :aria-busy="mutation === 'delete'" @click="deleteCollection">
              <Loader2 v-if="mutation === 'delete'" class="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
