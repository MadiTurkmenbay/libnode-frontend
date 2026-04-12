<script setup lang="ts">
import { Loader2, Check, Plus, ExternalLink } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCollectionsStore } from '~/stores/collections'
import { watchEffect, ref } from 'vue'

const props = defineProps<{
  bookId: string
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'collectionChanged': [id: string | null, name: string | null]
}>()

const store = useCollectionsStore()
const { toast } = useToast()

const currentCollectionId = ref<string | null>(null)
const currentCollectionName = ref<string | null>(null)
const newCollectionName = ref('')

watchEffect(async () => {
  if (props.open && store.collections.length === 0 && !store.isPending) {
    await store.fetchCollections()
  }
})

const { data: collectionStatus, execute: fetchCollectionStatus } = await useApiFetch<any>(
  `/api/books/${props.bookId}/collection-status`,
  { immediate: false }
)

watchEffect(async () => {
  if (props.open) {
    await fetchCollectionStatus()
  }
})

watchEffect(() => {
  if (collectionStatus.value) {
    currentCollectionId.value = collectionStatus.value.collectionId
    currentCollectionName.value = collectionStatus.value.collectionName
    emit('collectionChanged', currentCollectionId.value, currentCollectionName.value)
  } else {
    currentCollectionId.value = null
    currentCollectionName.value = null
    emit('collectionChanged', null, null)
  }
})

async function toggleCollection(collectionId: string, collectionName: string) {
  const isActive = currentCollectionId.value === collectionId
  try {
    if (isActive) {
      await store.removeBookFromCollection(collectionId, props.bookId)
      currentCollectionId.value = null
      currentCollectionName.value = null
      emit('collectionChanged', null, null)
      toast('Вкладка обновлена: книга удалена из коллекции')
    } else {
      await store.addBookToCollection(collectionId, props.bookId)
      currentCollectionId.value = collectionId
      currentCollectionName.value = collectionName
      emit('collectionChanged', currentCollectionId.value, currentCollectionName.value)
      toast('Вкладка обновлена: книга добавлена в коллекцию')
    }
  } catch (e) {
    toast({ variant: 'destructive', title: 'Ошибка при обновлении закладки' })
  }
}

async function createNewCollection() {
  if (!newCollectionName.value.trim()) return
  try {
    const created = await store.createCollection(newCollectionName.value.trim())
    if (!created) return
    
    await store.addBookToCollection(created.id, props.bookId)

    currentCollectionId.value = created.id
    currentCollectionName.value = created.name
    emit('collectionChanged', currentCollectionId.value, currentCollectionName.value)
    
    newCollectionName.value = ''
    toast('Папка создана и книга добавлена')
  } catch (e) {
    toast({ variant: 'destructive', title: 'Ошибка при создании папки' })
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md bg-card">
      <DialogHeader>
        <DialogTitle>Добавить в закладки</DialogTitle>
      </DialogHeader>
      
      <div class="space-y-4">
        <div v-if="store.isPending" class="py-6 flex justify-center text-muted-foreground">
           <Loader2 class="h-6 w-6 animate-spin" />
        </div>
        
        <div v-else-if="store.collections.length > 0" class="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
          <div 
            v-for="collection in store.collections" 
            :key="collection.id"
            class="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            :class="currentCollectionId === collection.id ? 'border-primary/50 bg-primary/5' : ''"
          >
            <div class="flex flex-col">
              <span class="font-medium text-sm">{{ collection.name }}</span>
              <span class="text-xs text-muted-foreground">{{ collection.bookCount }} книг(и)</span>
            </div>
            <button 
              @click="toggleCollection(collection.id, collection.name)"
              class="flex h-8 w-8 items-center justify-center rounded-md border transition-colors"
              :class="currentCollectionId === collection.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent hover:bg-secondary'"
            >
              <Check v-if="currentCollectionId === collection.id" class="h-4 w-4" />
              <Plus v-else class="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div v-else class="py-4 text-center text-sm text-muted-foreground">
           У вас пока нет ни одной папки с закладками.
        </div>

        <div class="border-t pt-4 mt-4">
          <h3 class="text-sm font-medium mb-3">Создать новую папку</h3>
          <div class="flex items-center gap-2">
            <input 
              v-model="newCollectionName"
              @keyup.enter="createNewCollection"
              type="text" 
              placeholder="Название папки..." 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="store.isCreating"
            />
            <button 
              @click="createNewCollection"
              :disabled="store.isCreating || !newCollectionName"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus v-if="!store.isCreating" class="h-4 w-4" />
              <Loader2 v-else class="h-4 w-4 animate-spin" />
            </button>
          </div>
        </div>

        <div class="pt-2 text-center">
          <NuxtLink to="/profile/collections" @click="$emit('update:open', false)" class="text-xs text-primary hover:underline inline-flex items-center gap-1">
            Управление закладками <ExternalLink class="h-3 w-3" />
          </NuxtLink>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
