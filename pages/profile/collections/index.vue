<script setup lang="ts">
import { ArrowRight, FolderHeart, Loader2, Plus, Search, FolderPlus } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatShortDate } from '~/lib/formatters'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Мои закладки — LibNode' })

const collectionsStore = useCollectionsStore()
const { collections, isPending: pending } = storeToRefs(collectionsStore)
const { toast } = useToast()

await collectionsStore.fetchCollections()

const search = ref('')
const newName = ref('')
const creating = ref(false)

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  const list = term
    ? collections.value.filter((c) => c.name.toLowerCase().includes(term))
    : collections.value
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
})

const totalBooks = computed(() => collections.value.reduce((sum, c) => sum + c.bookCount, 0))

async function create() {
  const name = newName.value.trim()
  if (!name || creating.value) return
  creating.value = true
  try {
    await collectionsStore.createCollection(name)
    newName.value = ''
    toast('Папка создана')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось создать папку' })
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="app-container py-6 md:py-8">
    <div class="mb-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
        <FolderHeart class="h-7 w-7 text-primary" />
        Мои закладки
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ collections.length }} папок · {{ totalBooks }} книг
      </p>
    </div>

    <!-- Create + search -->
    <div class="mb-6 flex flex-col gap-2 sm:flex-row">
      <div class="flex flex-1 gap-2">
        <div class="relative flex-1">
          <FolderPlus class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="newName"
            placeholder="Новая папка…"
            class="pl-9"
            maxlength="150"
            @keydown.enter="create"
          />
        </div>
        <Button :disabled="!newName.trim() || creating" @click="create">
          <Loader2 v-if="creating" class="mr-1.5 h-4 w-4 animate-spin" />
          <Plus v-else class="mr-1.5 h-4 w-4" />
          Создать
        </Button>
      </div>
      <div class="relative sm:w-64">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="search"
          type="text"
          placeholder="Поиск папок…"
          class="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>

    <div v-if="pending && !collections.length" class="flex justify-center py-20 text-muted-foreground">
      <Loader2 class="h-8 w-8 animate-spin" />
    </div>

    <div v-else-if="filtered.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="collection in filtered"
        :key="collection.id"
        :to="`/profile/collections/${collection.id}`"
        class="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      >
        <div>
          <div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <FolderHeart class="h-5 w-5" />
          </div>
          <h3 class="truncate text-lg font-semibold tracking-tight">{{ collection.name }}</h3>
          <p class="mt-0.5 text-xs text-muted-foreground">Создана {{ formatShortDate(collection.createdAt) }}</p>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span class="text-sm font-medium text-muted-foreground">{{ collection.bookCount }} книг</span>
          <ArrowRight class="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </NuxtLink>
    </div>

    <div v-else-if="search" class="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
      Папки не найдены.
    </div>

    <div v-else class="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
      <FolderHeart class="mb-4 h-12 w-12 text-muted-foreground/40" />
      <h3 class="text-lg font-semibold">Нет закладок</h3>
      <p class="mb-4 mt-1 max-w-sm text-sm text-muted-foreground">
        Создайте папку выше или сохраните книгу со страницы тайтла.
      </p>
      <Button as-child variant="outline"><NuxtLink to="/">Перейти в каталог</NuxtLink></Button>
    </div>
  </div>
</template>
