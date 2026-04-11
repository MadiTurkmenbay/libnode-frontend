<script setup lang="ts">
import { ArrowLeft, BookOpen, Clock, CalendarIcon, BookmarkPlus, Plus, Loader2, Check, ExternalLink, BookmarkCheck } from 'lucide-vue-next'
import type { BookDto, ChapterListDto, PagedResult, CollectionDto, BookCollectionStatusDto } from '~/types'

const route = useRoute()
const bookId = route.params.id as string

// Загружаем данные о книге
const { data: book, pending: bookPending, error: bookError } = await useApiFetch<BookDto>(
  `/api/books/${bookId}`,
)

// Загружаем список глав
const page = ref(1)
const { data: chaptersResult, pending: chaptersPending } = await useApiFetch<PagedResult<ChapterListDto>>(
  () => `/api/books/${bookId}/chapters?pageNumber=${page.value}&pageSize=50`,
  { watch: [page] }
)

const chapters = computed(() => chaptersResult.value?.items ?? [])

function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Установка title страницы после загрузки
watchEffect(() => {
  if (book.value) {
    useHead({
      title: `${book.value.title} — LibNode`,
    })
  }
})

// === ЛОГИКА ДОБАВЛЕНИЯ В КОЛЛЕКЦИИ ===
const { isAuthenticated } = useAuth()
const isModalOpen = ref(false)

const currentCollectionId = ref<string | null>(null)
const currentCollectionName = ref<string | null>(null)

const { data: collectionStatus, execute: fetchCollectionStatus } = await useApiFetch<BookCollectionStatusDto>(
  `/api/books/${bookId}/collection-status`,
  { immediate: false }
)

watchEffect(() => {
  if (collectionStatus.value) {
    currentCollectionId.value = collectionStatus.value.collectionId
    currentCollectionName.value = collectionStatus.value.collectionName
  } else {
    currentCollectionId.value = null
    currentCollectionName.value = null
  }
})

if (isAuthenticated.value) {
  await fetchCollectionStatus()
}

const { data: myCollections, execute: fetchCollections, pending: collectionsPending } = await useApiFetch<CollectionDto[]>('/api/collections', {
  immediate: false
})

async function openCollectionsModal() {
  if (!isAuthenticated.value) return
  isModalOpen.value = true
  await Promise.all([fetchCollections(), fetchCollectionStatus()])
}

async function apiMutation<T>(endpoint: string, options: any = {}) {
  const config = useRuntimeConfig()
  const baseURL = import.meta.client && config.public.apiBaseClient
    ? config.public.apiBaseClient as string
    : config.public.apiBase as string
  
  const token = useCookie('auth_token')
  const headers: Record<string, string> = { ...options.headers }
  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`
  }

  return $fetch<T>(endpoint, {
    baseURL,
    ...options,
    headers
  })
}

async function toggleCollection(collectionId: string, collectionName: string) {
  const isActive = currentCollectionId.value === collectionId
  try {
    if (isActive) {
      await apiMutation(`/api/collections/${collectionId}/books/${bookId}`, {
        method: 'DELETE'
      })
      currentCollectionId.value = null
      currentCollectionName.value = null
    } else {
      await apiMutation(`/api/collections/${collectionId}/books`, {
        method: 'POST',
        body: { bookId: bookId }
      })
      currentCollectionId.value = collectionId
      currentCollectionName.value = collectionName
    }
  } catch (e) {
    console.error('Failed to toggle collection', e)
  }
}

const newCollectionName = ref('')
const isCreatingCollection = ref(false)

async function createNewCollection() {
  if (!newCollectionName.value.trim()) return
  isCreatingCollection.value = true
  try {
    const created = await apiMutation<CollectionDto>('/api/collections', {
      method: 'POST',
      body: { name: newCollectionName.value.trim() }
    })

    await apiMutation(`/api/collections/${created.id}/books`, {
        method: 'POST',
        body: { bookId: bookId }
    })

    currentCollectionId.value = created.id
    currentCollectionName.value = created.name
    
    newCollectionName.value = ''
    await fetchCollections()
  } catch (e) {
    console.error('Failed to create collection', e)
  } finally {
    isCreatingCollection.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header/Навигация -->
    <header class="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div class="container flex h-14 items-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft class="h-4 w-4" />
          Назад в каталог
        </NuxtLink>
      </div>
    </header>

    <main class="container py-8">
      <!-- Загрузка / Ошибка для книги -->
      <div v-if="bookPending" class="py-20 text-center text-muted-foreground animate-pulse">
        Загрузка информации о книге...
      </div>
      <div v-else-if="bookError || !book" class="py-20 text-center text-destructive">
        Ошибка: Книга не найдена
      </div>

      <!-- Контент книги -->
      <div v-else class="flex flex-col gap-6 md:flex-row md:gap-8 lg:gap-12">
        
        <!-- Левая колонка: Обложка -->
        <div class="space-y-4 w-full md:w-[300px] shrink-0 mx-auto max-w-[300px] md:max-w-none">
          <div class="overflow-hidden rounded-xl border bg-secondary relative aspect-[3/4] shadow-lg">
             <img
              v-if="book.coverUrl"
              :src="book.coverUrl"
              :alt="book.title"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10"
            >
              <BookOpen class="h-20 w-20 text-muted-foreground/40" />
            </div>
          </div>
        </div>

        <!-- Правая колонка: Инфо и Главы -->
        <div class="space-y-8">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold tracking-tight sm:text-4xl">{{ book.title }}</h1>
            
            <div class="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span class="inline-flex items-center gap-1.5">
                <CalendarIcon class="h-4 w-4" />
                Создана: {{ formatDate(book.createdAt) }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <Clock class="h-4 w-4" />
                Обновлена: {{ formatDate(book.updatedAt) }}
              </span>
            </div>

            <!-- Добавить в закладки button -->
            <div class="mt-6" v-if="isAuthenticated">
              <button
                @click="openCollectionsModal"
                class="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md px-8 text-sm font-medium shadow transition-colors"
                :class="currentCollectionId
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'"
              >
                <BookmarkCheck v-if="currentCollectionId" class="mr-2 h-5 w-5" />
                <BookmarkPlus v-else class="mr-2 h-5 w-5" />
                {{ currentCollectionName ?? 'В закладки' }}
              </button>
            </div>
          </div>

          <div v-if="book.description" class="prose prose-invert max-w-none">
            <h3 class="text-xl font-semibold mb-2">Описание</h3>
            <p class="text-muted-foreground leading-relaxed">{{ book.description }}</p>
          </div>

          <!-- Раздел Главы -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b pb-2">
              <h3 class="text-xl md:text-2xl font-semibold tracking-tight">Главы</h3>
              <span class="text-sm rounded-full bg-secondary px-3 py-1 text-muted-foreground">
                Всего: {{ book.chapterCount }}
              </span>
            </div>

            <div v-if="chaptersPending" class="py-8 text-center text-sm text-muted-foreground animate-pulse">
              Загрузка списка глав...
            </div>
            
            <div v-else-if="chapters.length > 0" class="grid gap-2">
              <NuxtLink
                v-for="chapter in chapters"
                :key="chapter.id"
                :to="`/books/${bookId}/read/${chapter.id}`"
                class="group flex items-center justify-between rounded-lg border bg-card p-3 md:p-4 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary text-sm font-medium text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {{ chapter.chapterNumber }}
                  </div>
                  <span class="font-medium group-hover:text-primary transition-colors">
                    {{ chapter.title }}
                  </span>
                </div>
                <span class="hidden text-xs text-muted-foreground sm:block">
                  {{ formatDate(chapter.createdAt) }}
                </span>
              </NuxtLink>
            </div>
            
            <div v-else class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <BookOpen class="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>В этой книге пока нет ни одной главы.</p>
            </div>
          </div>

        </div>
      </div>
    </main>

    <!-- Custom Modal Overlay for Collections -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        class="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        @click="isModalOpen = false"
      ></div>
      <div class="relative z-50 w-full max-w-md overflow-hidden rounded-xl border bg-card p-6 text-card-foreground shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold tracking-tight">Добавить в закладки</h2>
          <button @click="isModalOpen = false" class="rounded-full p-2 hover:bg-muted transition-colors">
             <span class="sr-only">Close</span>
             <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div v-if="collectionsPending" class="py-6 flex justify-center text-muted-foreground">
             <Loader2 class="h-6 w-6 animate-spin" />
          </div>
          
          <div v-else-if="myCollections && myCollections.length > 0" class="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
            <div 
              v-for="collection in myCollections" 
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
                :disabled="isCreatingCollection"
              />
              <button 
                @click="createNewCollection"
                :disabled="isCreatingCollection || !newCollectionName"
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus v-if="!isCreatingCollection" class="h-4 w-4" />
                <Loader2 v-else class="h-4 w-4 animate-spin" />
              </button>
            </div>
          </div>

          <div class="pt-2 text-center">
            <NuxtLink to="/profile/collections" @click="isModalOpen = false" class="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Управление закладками <ExternalLink class="h-3 w-3" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
