<script setup lang="ts">
import { Loader2, Library, RefreshCw, Search, SlidersHorizontal, X, ChevronDown, ArrowUpDown } from 'lucide-vue-next'
import { useIntersectionObserver } from '@vueuse/core'
import BookGrid from '~/components/books/BookGrid.vue'
import BookGridSkeleton from '~/components/books/BookGridSkeleton.vue'
import AppState from '~/components/AppState.vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { useCatalogFilters } from '~/composables/useCatalogFilters'
import { useCatalogCursor } from '~/composables/useCatalogCursor'
import type { CategoryDto, TagDto } from '~/types'

useSeo({
  title: 'Каталог ранобэ и новелл',
  description: 'Каталог ранобэ с поиском, фильтрацией и сортировкой. Найдите идеальное произведение.',
  type: 'website',
})

const route = useRoute()

const loadTrigger = ref<HTMLElement | null>(null)
const sortDropdownOpen = ref(false)
const mobileFiltersOpen = ref(false)

const { data: availableTags } = await useApiFetch<TagDto[]>('/api/tags')
const { data: availableCategories } = await useApiFetch<CategoryDto[]>('/api/categories')

const {
  search,
  appliedFilters,
  appliedFiltersSignature,
  hasActiveFilters,
  filterSections,
  activeFilterChips,
  currentSortLabel,
  clearFilters,
  selectSort,
  catalogSortOptions,
} = useCatalogFilters(availableTags, availableCategories)

const {
  books,
  hasMore: hasMorePages,
  pending,
  error,
  isLoadingMore,
  loadFirstPage,
  loadMore,
} = useCatalogCursor(appliedFilters)

await loadFirstPage()

watch(appliedFiltersSignature, async () => {
  await loadFirstPage()
})

useIntersectionObserver(
  loadTrigger,
  ([entry]) => {
    if (entry?.isIntersecting) {
      loadMore()
    }
  },
  { rootMargin: '200px' },
)

const resultsSummary = computed(() => {
  if (books.value.length > 0) {
    return `${books.value.length} произведений`
  }
  if (pending.value) {
    return 'Обновляем каталог...'
  }
  if (hasActiveFilters.value) {
    return 'По текущим фильтрам ничего не найдено'
  }
  return 'Каталог пуст'
})

const emptyState = computed(() => {
  if (hasActiveFilters.value) {
    return {
      badge: 'Ничего не найдено',
      title: 'Попробуйте изменить фильтры',
      description: 'Сузьте запрос, снимите часть фильтров или очистите поиск, чтобы увидеть больше произведений.',
    }
  }
  return {
    badge: 'Каталог пуст',
    title: 'Каталог пока пуст',
    description: 'Когда книги появятся в системе, они отобразятся здесь автоматически.',
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <main class="app-container py-4 md:py-8">
      <section class="mb-6 space-y-4 md:mb-8" aria-labelledby="catalog-title">
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 id="catalog-title" class="text-3xl font-bold tracking-tight md:text-4xl">
              Каталог произведений
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Ищите по названию и описанию, отбирайте тайтлы по типу, статусам, тегам и категориям.
            </p>
          </div>

          <div class="text-sm text-muted-foreground">
            {{ resultsSummary }}
          </div>
        </div>

        <div class="rounded-3xl border bg-card/70 p-4 shadow-sm backdrop-blur md:p-5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="relative flex-1">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="search"
                class="h-11 rounded-2xl pl-10"
                placeholder="Название, slug или описание"
                aria-label="Поиск по каталогу"
              />
            </div>

            <Popover v-model:open="sortDropdownOpen">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-11 min-w-56 justify-between rounded-2xl"
                >
                  <span class="flex items-center gap-2">
                    <ArrowUpDown class="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span class="truncate text-sm">{{ currentSortLabel }}</span>
                  </span>
                  <ChevronDown class="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-64 p-1.5" align="end">
                <button
                  v-for="option in catalogSortOptions"
                  :key="`${option.sortBy}-${option.sortDirection}`"
                  type="button"
                  class="flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent/10"
                  :class="option.sortBy === appliedFilters.sortBy && option.sortDirection === appliedFilters.sortDirection
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground'"
                  @click="selectSort(option.sortBy, option.sortDirection)"
                >
                  {{ option.label }}
                </button>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              class="h-11 rounded-2xl lg:hidden"
              @click="mobileFiltersOpen = !mobileFiltersOpen"
            >
              <SlidersHorizontal class="mr-2 h-4 w-4" />
              Фильтры
              <Badge v-if="hasActiveFilters" class="ml-2 rounded-full px-1.5 py-0.5 text-xs">
                !
              </Badge>
            </Button>

            <Button
              v-if="hasActiveFilters"
              variant="outline"
              class="h-11 rounded-2xl"
              @click="clearFilters"
            >
              <X class="mr-2 h-4 w-4" />
              Сбросить
            </Button>
          </div>
        </div>

        <div v-if="activeFilterChips.length" class="flex flex-wrap gap-2">
          <button
            v-for="chip in activeFilterChips"
            :key="chip.key"
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            @click="chip.remove()"
          >
            {{ chip.label }}
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <div
        v-if="mobileFiltersOpen"
        class="mb-6 space-y-4 lg:hidden"
      >
        <div
          v-for="section in filterSections"
          :key="section.id"
          class="rounded-2xl border bg-card/50 p-4"
        >
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {{ section.title }}
          </p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="item in section.items"
              :key="String(item.key)"
              type="button"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
              :class="item.selected
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border-border bg-transparent text-foreground/70 hover:border-primary/40 hover:text-foreground'"
              @click="item.toggle()"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex gap-6">
        <aside class="hidden w-64 shrink-0 lg:block">
          <div class="sticky top-20 space-y-5">
            <div
              v-for="section in filterSections"
              :key="section.id"
              class="rounded-2xl border bg-card/50 p-4"
            >
              <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {{ section.title }}
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="item in section.items"
                  :key="String(item.key)"
                  type="button"
                  class="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                  :class="item.selected
                    ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border-border bg-transparent text-foreground/70 hover:border-primary/40 hover:text-foreground'"
                  @click="item.toggle()"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div class="min-w-0 flex-1">
          <BookGridSkeleton v-if="pending && books.length === 0" compact />

          <AppState
            v-else-if="error"
            variant="error"
            title="Ошибка загрузки"
            description="Не удалось получить каталог с сервера. Проверьте, что backend запущен и доступен."
            @retry="loadFirstPage"
          />

          <template v-else-if="books.length > 0">
            <BookGrid :books="books" compact />

            <div
              ref="loadTrigger"
              class="mt-8 flex items-center justify-center py-4"
            >
              <div v-if="isLoadingMore" class="flex items-center gap-2 text-muted-foreground">
                <Loader2 class="h-5 w-5 animate-spin" />
                <span class="text-sm">Загрузка...</span>
              </div>
              <p v-else-if="!hasMorePages" class="text-sm text-muted-foreground/60">
                Вы просмотрели все доступные произведения
              </p>
            </div>
          </template>

          <AppState
            v-else
            variant="empty"
            :badge="emptyState.badge"
            :title="emptyState.title"
            :description="emptyState.description"
            class="border-dashed py-16"
          >
            <template #icon>
              <Library class="h-16 w-16 text-muted-foreground/30" />
            </template>
            <template v-if="hasActiveFilters" #actions>
              <Button variant="outline" class="rounded-2xl" @click="clearFilters">
                Очистить фильтры
              </Button>
            </template>
          </AppState>
        </div>
      </div>
    </main>
  </div>
</template>
