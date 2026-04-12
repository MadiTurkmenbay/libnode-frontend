<script setup lang="ts">
import { Check, ExternalLink, Loader2, Plus } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BookCollectionStatusDto, CollectionDto } from '~/types'

const props = defineProps<{
  bookId: string
  open: boolean
  collectionStatus: BookCollectionStatusDto | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'collection-changed': [value: BookCollectionStatusDto | null]
}>()

const collectionsStore = useCollectionsStore()
const { toast } = useToast()

const currentCollectionId = ref<string | null>(null)
const newCollectionName = ref('')
const isSubmitting = ref(false)

watch(
  () => props.collectionStatus,
  (status) => {
    currentCollectionId.value = status?.collectionId ?? null
  },
  { immediate: true },
)

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      newCollectionName.value = ''
      return
    }

    await collectionsStore.fetchCollections()
  },
  { immediate: true },
)

function emitCollectionStatus(value: BookCollectionStatusDto | null) {
  currentCollectionId.value = value?.collectionId ?? null
  emit('collection-changed', value)
}

async function moveBookToCollection(targetCollection: CollectionDto) {
  if (isSubmitting.value) {
    return
  }

  const isActiveCollection = currentCollectionId.value === targetCollection.id

  isSubmitting.value = true

  try {
    if (isActiveCollection) {
      await collectionsStore.removeBookFromCollection(targetCollection.id, props.bookId)
      emitCollectionStatus(null)
      toast('Книга удалена из закладок')
      return
    }

    if (currentCollectionId.value) {
      await collectionsStore.removeBookFromCollection(currentCollectionId.value, props.bookId)
    }

    await collectionsStore.addBookToCollection(targetCollection.id, props.bookId)
    emitCollectionStatus({
      collectionId: targetCollection.id,
      collectionName: targetCollection.name,
    })
    toast(`Книга перемещена в "${targetCollection.name}"`)
  }
  catch {
    toast({
      variant: 'destructive',
      title: 'Не удалось обновить закладки',
    })
  }
  finally {
    isSubmitting.value = false
  }
}

async function createCollection() {
  const trimmedName = newCollectionName.value.trim()

  if (!trimmedName || isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    const createdCollection = await collectionsStore.createCollection(trimmedName)

    if (!createdCollection) {
      return
    }

    if (currentCollectionId.value) {
      await collectionsStore.removeBookFromCollection(currentCollectionId.value, props.bookId)
    }

    await collectionsStore.addBookToCollection(createdCollection.id, props.bookId)
    emitCollectionStatus({
      collectionId: createdCollection.id,
      collectionName: createdCollection.name,
    })
    newCollectionName.value = ''

    toast(`Папка "${createdCollection.name}" создана`)
  }
  catch {
    toast({
      variant: 'destructive',
      title: 'Не удалось создать папку',
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Закладки</DialogTitle>
        <DialogDescription>
          Книга может находиться только в одной папке. Выберите папку или создайте новую.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div v-if="collectionsStore.isPending" class="flex justify-center py-6 text-muted-foreground">
          <Loader2 class="h-6 w-6 animate-spin" />
        </div>

        <div
          v-else-if="collectionsStore.collections.length > 0"
          class="max-h-[60vh] space-y-2 overflow-y-auto pr-2"
        >
          <button
            v-for="collection in collectionsStore.collections"
            :key="collection.id"
            type="button"
            class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
            :class="currentCollectionId === collection.id ? 'border-primary bg-primary/5' : ''"
            :disabled="isSubmitting || collectionsStore.isUpdating"
            @click="moveBookToCollection(collection)"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium">{{ collection.name }}</span>
              <span class="text-xs text-muted-foreground">{{ collection.bookCount }} книг(и)</span>
            </div>

            <span
              class="flex h-8 w-8 items-center justify-center rounded-md border transition-colors"
              :class="currentCollectionId === collection.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-transparent'"
            >
              <Check v-if="currentCollectionId === collection.id" class="h-4 w-4" />
              <Plus v-else class="h-4 w-4" />
            </span>
          </button>
        </div>

        <div v-else class="py-4 text-center text-sm text-muted-foreground">
          У вас пока нет папок с закладками.
        </div>

        <div class="border-t pt-4">
          <h3 class="mb-3 text-sm font-medium">Новая папка</h3>

          <div class="flex items-center gap-2">
            <input
              v-model="newCollectionName"
              type="text"
              placeholder="Название папки"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              :disabled="isSubmitting || collectionsStore.isCreating"
              @keyup.enter="createCollection"
            />

            <button
              type="button"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!newCollectionName.trim() || isSubmitting || collectionsStore.isCreating"
              @click="createCollection"
            >
              <Plus v-if="!collectionsStore.isCreating" class="h-4 w-4" />
              <Loader2 v-else class="h-4 w-4 animate-spin" />
            </button>
          </div>
        </div>

        <div class="pt-2 text-center">
          <NuxtLink
            to="/profile/collections"
            class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            @click="$emit('update:open', false)"
          >
            Управление закладками
            <ExternalLink class="h-3 w-3" />
          </NuxtLink>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
