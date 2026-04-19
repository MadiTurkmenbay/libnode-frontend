<script setup lang="ts">
import type { Ref } from 'vue'
import type { LocationQueryRaw } from 'vue-router'
import { Loader2, Library, RefreshCw, Search, SlidersHorizontal, X, ChevronDown, ArrowUpDown } from 'lucide-vue-next'
import { useDebounceFn, useIntersectionObserver } from '@vueuse/core'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { bookTypeLabels, originalStatusLabels, translationStatusLabels, catalogSortOptions } from '~/lib/enums'
import type { SortOption } from '~/lib/enums'
import {
  BookType,
  CatalogSortBy,
  OriginalStatus,
  SortDirection,
  TranslationStatus,
  type BookCatalogFilters,
  type BookDto,
  type CategoryDto,
  type PagedResult,
  type TagDto,
} from '~/types'

useHead({
  title: 'LibNode — Каталог',
  meta: [
    { name: 'description', content: 'Каталог ранобэ с поиском, фильтрацией и сортировкой. Найдите идеальное произведение.' },
  ],
})

const PAGE_SIZE = 20
const bookTypeOptions = [
  BookType.Japan,
  BookType.Korea,
  BookType.China,
  BookType.English,
  BookType.Original,
  BookType.Fanfic,
] as const
const originalStatusOptions = [
  OriginalStatus.None,
  OriginalStatus.Ongoing,
  OriginalStatus.Completed,
  OriginalStatus.Hiatus,
] as const
const translationStatusOptions = [
  TranslationStatus.None,
  TranslationStatus.Ongoing,
  TranslationStatus.Completed,
  TranslationStatus.Dropped,
  TranslationStatus.Hiatus,
] as const

const route = useRoute()
const router = useRouter()

const books = ref<BookDto[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const isLoadingMore = ref(false)
const loadTrigger = ref<HTMLElement | null>(null)
const sortDropdownOpen = ref(false)
const mobileFiltersOpen = ref(false)

const search = ref('')
const selectedTypes = ref<BookType[]>([])
const selectedOriginalStatuses = ref<OriginalStatus[]>([])
const selectedTranslationStatuses = ref<TranslationStatus[]>([])
const selectedTags = ref<string[]>([])
const selectedCategories = ref<string[]>([])
const selectedSortBy = ref<CatalogSortBy>(CatalogSortBy.CreatedAt)
const selectedSortDirection = ref<SortDirection>(SortDirection.Desc)

// ── Query Parsing ──────────────────────────────────────

function normalizeQueryValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeQueryValues)
  }

  if (value === null || value === undefined) {
    return []
  }

  const normalized = String(value).trim()
  return normalized ? [normalized] : []
}

function parseEnumFilter<T extends number>(value: unknown, allowedValues: readonly T[]): T[] {
  const allowed = new Set(allowedValues.map(String))

  return [...new Set(
    normalizeQueryValues(value)
      .filter(item => allowed.has(item))
      .map(item => Number(item) as T),
  )]
}

function parseStringFilter(value: unknown): string[] {
  return [...new Set(normalizeQueryValues(value))]
}

function parseSortBy(value: unknown): CatalogSortBy {
  const raw = normalizeQueryValues(value)[0]
  const allowed = Object.values(CatalogSortBy) as string[]
  return allowed.includes(raw ?? '') ? (raw as CatalogSortBy) : CatalogSortBy.CreatedAt
}

function parseSortDirection(value: unknown): SortDirection {
  const raw = normalizeQueryValues(value)[0]
  return raw === SortDirection.Asc ? SortDirection.Asc : SortDirection.Desc
}

function parseRouteFilters(): BookCatalogFilters {
  return {
    search: normalizeQueryValues(route.query.search)[0] ?? '',
    types: parseEnumFilter(route.query.types, bookTypeOptions),
    originalStatuses: parseEnumFilter(route.query.originalStatuses, originalStatusOptions),
    translationStatuses: parseEnumFilter(route.query.translationStatuses, translationStatusOptions),
    tags: parseStringFilter(route.query.tags),
    categories: parseStringFilter(route.query.categories),
    sortBy: parseSortBy(route.query.sortBy),
    sortDirection: parseSortDirection(route.query.sortDirection),
  }
}

// ── Route Query Builder ────────────────────────────────

function buildRouteQuery(filters: BookCatalogFilters): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  const trimmedSearch = filters.search.trim()

  if (trimmedSearch) {
    query.search = trimmedSearch
  }

  if (filters.types.length) {
    query.types = [...filters.types].sort((left, right) => left - right).map(String)
  }

  if (filters.originalStatuses.length) {
    query.originalStatuses = [...filters.originalStatuses].sort((left, right) => left - right).map(String)
  }

  if (filters.translationStatuses.length) {
    query.translationStatuses = [...filters.translationStatuses].sort((left, right) => left - right).map(String)
  }

  if (filters.tags.length) {
    query.tags = [...filters.tags].sort((left, right) => left.localeCompare(right))
  }

  if (filters.categories.length) {
    query.categories = [...filters.categories].sort((left, right) => left.localeCompare(right))
  }

  if (filters.sortBy !== CatalogSortBy.CreatedAt) {
    query.sortBy = filters.sortBy
  }

  if (filters.sortDirection !== SortDirection.Desc) {
    query.sortDirection = filters.sortDirection
  }

  return query
}

function getQuerySignature(query: Record<string, unknown>): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(query)
        .map(([key, value]) => [key, normalizeQueryValues(value).sort((left, right) => left.localeCompare(right))] as const)
        .filter(([, value]) => value.length > 0),
    ),
  )
}

function arraysEqual<T extends string | number>(left: T[], right: T[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

// ── UI State Sync ──────────────────────────────────────

function syncUiState(filters: BookCatalogFilters) {
  if (search.value !== filters.search) {
    search.value = filters.search
  }

  if (!arraysEqual(selectedTypes.value, filters.types)) {
    selectedTypes.value = [...filters.types]
  }

  if (!arraysEqual(selectedOriginalStatuses.value, filters.originalStatuses)) {
    selectedOriginalStatuses.value = [...filters.originalStatuses]
  }

  if (!arraysEqual(selectedTranslationStatuses.value, filters.translationStatuses)) {
    selectedTranslationStatuses.value = [...filters.translationStatuses]
  }

  if (!arraysEqual(selectedTags.value, filters.tags)) {
    selectedTags.value = [...filters.tags]
  }

  if (!arraysEqual(selectedCategories.value, filters.categories)) {
    selectedCategories.value = [...filters.categories]
  }

  if (selectedSortBy.value !== filters.sortBy) {
    selectedSortBy.value = filters.sortBy
  }

  if (selectedSortDirection.value !== filters.sortDirection) {
    selectedSortDirection.value = filters.sortDirection
  }
}

function buildCurrentFilters(): BookCatalogFilters {
  return {
    search: search.value,
    types: [...selectedTypes.value],
    originalStatuses: [...selectedOriginalStatuses.value],
    translationStatuses: [...selectedTranslationStatuses.value],
    tags: [...selectedTags.value],
    categories: [...selectedCategories.value],
    sortBy: selectedSortBy.value,
    sortDirection: selectedSortDirection.value,
  }
}

// ── API URL Builder ────────────────────────────────────

function buildBooksUrl(filters: BookCatalogFilters, page: number) {
  const params = new URLSearchParams()
  params.set('limit', String(PAGE_SIZE))
  params.set('page', String(page))

  params.set('sortBy', filters.sortBy)
  params.set('sortDirection', filters.sortDirection)

  const trimmedSearch = filters.search.trim()
  if (trimmedSearch) {
    params.set('search', trimmedSearch)
  }

  for (const type of [...filters.types].sort((left, right) => left - right)) {
    params.append('types', String(type))
  }

  for (const status of [...filters.originalStatuses].sort((left, right) => left - right)) {
    params.append('originalStatuses', String(status))
  }

  for (const status of [...filters.translationStatuses].sort((left, right) => left - right)) {
    params.append('translationStatuses', String(status))
  }

  for (const tag of [...filters.tags].sort((left, right) => left.localeCompare(right))) {
    params.append('tags', tag)
  }

  for (const category of [...filters.categories].sort((left, right) => left.localeCompare(right))) {
    params.append('categories', category)
  }

  return `/api/books?${params.toString()}`
}

// ── Computed ───────────────────────────────────────────

const appliedFilters = computed(() => parseRouteFilters())
const appliedFiltersSignature = computed(() => getQuerySignature(buildRouteQuery(appliedFilters.value)))
const catalogUrl = computed(() => buildBooksUrl(appliedFilters.value, 1))
const hasActiveFilters = computed(() => {
  const f = appliedFilters.value
  return f.search.trim() !== ''
    || f.types.length > 0
    || f.originalStatuses.length > 0
    || f.translationStatuses.length > 0
    || f.tags.length > 0
    || f.categories.length > 0
})
const hasMorePages = computed(() => books.value.length < totalCount.value)
const currentSortLabel = computed(() => {
  const opt = catalogSortOptions.find(
    o => o.sortBy === appliedFilters.value.sortBy && o.sortDirection === appliedFilters.value.sortDirection,
  )
  return opt?.label ?? 'Сортировка'
})

syncUiState(appliedFilters.value)

watch(appliedFiltersSignature, () => {
  syncUiState(appliedFilters.value)
})

// ── Tags & Categories ─────────────────────────────────

const { data: availableTags } = await useApiFetch<TagDto[]>('/api/tags')
const { data: availableCategories } = await useApiFetch<CategoryDto[]>('/api/categories')

const tagNameBySlug = computed(() => new Map((availableTags.value ?? []).map(tag => [tag.slug, tag.name])))
const categoryNameBySlug = computed(() => new Map((availableCategories.value ?? []).map(category => [category.slug, category.name])))

// ── Active Filter Chips ───────────────────────────────

const activeFilterChips = computed(() => [
  ...(appliedFilters.value.search
    ? [{
        key: `search:${appliedFilters.value.search}`,
        label: `Поиск: ${appliedFilters.value.search}`,
        remove: async () => {
          search.value = ''
          await updateRouteFilters()
        },
      }]
    : []),
  ...appliedFilters.value.types.map(type => ({
    key: `type:${type}`,
    label: bookTypeLabels[type],
    remove: () => toggleSelection(selectedTypes, type),
  })),
  ...appliedFilters.value.originalStatuses.map(status => ({
    key: `original:${status}`,
    label: `Оригинал: ${originalStatusLabels[status]}`,
    remove: () => toggleSelection(selectedOriginalStatuses, status),
  })),
  ...appliedFilters.value.translationStatuses.map(status => ({
    key: `translation:${status}`,
    label: `Перевод: ${translationStatusLabels[status]}`,
    remove: () => toggleSelection(selectedTranslationStatuses, status),
  })),
  ...appliedFilters.value.tags.map(tag => ({
    key: `tag:${tag}`,
    label: `Тег: ${tagNameBySlug.value.get(tag) ?? tag}`,
    remove: () => toggleSelection(selectedTags, tag),
  })),
  ...appliedFilters.value.categories.map(category => ({
    key: `category:${category}`,
    label: `Категория: ${categoryNameBySlug.value.get(category) ?? category}`,
    remove: () => toggleSelection(selectedCategories, category),
  })),
])

// ── Route & Filter Actions ────────────────────────────

async function updateRouteFilters() {
  const nextQuery = buildRouteQuery(buildCurrentFilters())

  if (getQuerySignature(nextQuery) === getQuerySignature(route.query)) {
    return
  }

  await router.replace({ query: nextQuery })
}

const applySearch = useDebounceFn(() => {
  void updateRouteFilters()
}, 350)

watch(search, () => {
  applySearch()
})

async function toggleSelection<T extends string | number>(target: Ref<T[]>, value: T) {
  const current = target.value ?? []
  target.value = current.includes(value)
    ? current.filter(item => item !== value)
    : [...current, value]

  await updateRouteFilters()
}

async function selectSort(option: SortOption) {
  selectedSortBy.value = option.sortBy
  selectedSortDirection.value = option.sortDirection
  sortDropdownOpen.value = false
  await updateRouteFilters()
}

async function clearFilters() {
  search.value = ''
  selectedTypes.value = []
  selectedOriginalStatuses.value = []
  selectedTranslationStatuses.value = []
  selectedTags.value = []
  selectedCategories.value = []

  await updateRouteFilters()
}

// ── Data Fetching ─────────────────────────────────────

const { data: pageData, pending, error, execute: fetchCatalog } = await useApiFetch<PagedResult<BookDto>>(
  () => catalogUrl.value,
  {
    immediate: false,
    watch: false,
  },
)

let latestCatalogRequest = 0

function applyPageData(page: PagedResult<BookDto> | null) {
  books.value = page?.items ?? []
  totalCount.value = page?.totalCount ?? 0
  currentPage.value = page?.pageNumber ?? 1
}

async function loadFirstPage() {
  const requestId = ++latestCatalogRequest

  books.value = []
  totalCount.value = 0
  currentPage.value = 1
  isLoadingMore.value = false

  await fetchCatalog()

  if (requestId !== latestCatalogRequest || error.value) {
    return
  }

  applyPageData(pageData.value)
}

await loadFirstPage()

watch(catalogUrl, async (current, previous) => {
  if (previous === undefined || current === previous) {
    return
  }

  await loadFirstPage()
})

async function loadMore() {
  if (!hasMorePages.value || isLoadingMore.value || pending.value) {
    return
  }

  const requestId = latestCatalogRequest
  const nextPage = currentPage.value + 1
  const url = buildBooksUrl(appliedFilters.value, nextPage)
  isLoadingMore.value = true

  try {
    const data = await executeApiRequest<PagedResult<BookDto>>(
      url,
      {
        key: `catalog:page:${nextPage}:${appliedFiltersSignature.value}`,
      },
    )

    if (!data || requestId !== latestCatalogRequest) {
      return
    }

    books.value.push(...data.items)
    currentPage.value = data.pageNumber
    totalCount.value = data.totalCount
  }
  catch (loadMoreError) {
    console.error('Ошибка загрузки книг:', loadMoreError)
  }
  finally {
    isLoadingMore.value = false
  }
}

useIntersectionObserver(
  loadTrigger,
  ([entry]) => {
    if (entry?.isIntersecting) {
      loadMore()
    }
  },
  { rootMargin: '200px' },
)

// ── Filter sidebar sections ───────────────────────────

const filterSections = computed(() => {
  const sections = []

  sections.push({
    id: 'type',
    title: 'Тип',
    items: bookTypeOptions.map(type => ({
      key: type,
      label: bookTypeLabels[type],
      selected: (selectedTypes.value ?? []).includes(type),
      toggle: () => toggleSelection(selectedTypes, type),
    })),
  })

  sections.push({
    id: 'original',
    title: 'Статус оригинала',
    items: originalStatusOptions.map(status => ({
      key: status,
      label: originalStatusLabels[status],
      selected: (selectedOriginalStatuses.value ?? []).includes(status),
      toggle: () => toggleSelection(selectedOriginalStatuses, status),
    })),
  })

  sections.push({
    id: 'translation',
    title: 'Статус перевода',
    items: translationStatusOptions.map(status => ({
      key: status,
      label: translationStatusLabels[status],
      selected: (selectedTranslationStatuses.value ?? []).includes(status),
      toggle: () => toggleSelection(selectedTranslationStatuses, status),
    })),
  })

  if (availableTags.value?.length) {
    sections.push({
      id: 'tags',
      title: 'Теги',
      items: availableTags.value.map(tag => ({
        key: tag.slug,
        label: tag.name,
        selected: (selectedTags.value ?? []).includes(tag.slug),
        toggle: () => toggleSelection(selectedTags, tag.slug),
      })),
    })
  }

  if (availableCategories.value?.length) {
    sections.push({
      id: 'categories',
      title: 'Категории',
      items: availableCategories.value.map(category => ({
        key: category.slug,
        label: category.name,
        selected: (selectedCategories.value ?? []).includes(category.slug),
        toggle: () => toggleSelection(selectedCategories, category.slug),
      })),
    })
  }

  return sections
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <main class="container px-3 py-4 md:px-8 md:py-8">
      <!-- Заголовок + Поиск + Сортировка -->
      <section class="mb-6 space-y-4 md:mb-8">
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              <SlidersHorizontal class="h-3.5 w-3.5" />
              Каталог
            </div>
            <h1 class="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Каталог произведений</h1>
            <p class="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Ищите по названию и описанию, отбирайте тайтлы по типу, статусам, тегам и категориям.
            </p>
          </div>

          <div class="text-sm text-muted-foreground">
            <template v-if="books.length > 0">
              {{ books.length }} из {{ totalCount }} произведений
            </template>
            <template v-else-if="pending">
              Обновляем каталог...
            </template>
            <template v-else-if="hasActiveFilters">
              По текущим фильтрам ничего не найдено
            </template>
            <template v-else>
              Каталог пуст
            </template>
          </div>
        </div>

        <!-- Поиск и сортировка -->
        <div class="rounded-3xl border bg-card/70 p-4 shadow-sm backdrop-blur md:p-5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="relative flex-1">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="search"
                class="h-11 rounded-2xl pl-10"
                placeholder="Название, slug или описание"
              />
            </div>

            <!-- Сортировка -->
            <Popover v-model:open="sortDropdownOpen">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-11 min-w-[220px] justify-between rounded-2xl"
                >
                  <span class="flex items-center gap-2">
                    <ArrowUpDown class="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span class="truncate text-sm">{{ currentSortLabel }}</span>
                  </span>
                  <ChevronDown class="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[260px] p-1.5" align="end">
                <button
                  v-for="option in catalogSortOptions"
                  :key="`${option.sortBy}-${option.sortDirection}`"
                  type="button"
                  class="flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent/10"
                  :class="option.sortBy === appliedFilters.sortBy && option.sortDirection === appliedFilters.sortDirection
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground'"
                  @click="selectSort(option)"
                >
                  {{ option.label }}
                </button>
              </PopoverContent>
            </Popover>

            <!-- Мобильная кнопка фильтров -->
            <Button
              variant="outline"
              class="h-11 rounded-2xl lg:hidden"
              @click="mobileFiltersOpen = !mobileFiltersOpen"
            >
              <SlidersHorizontal class="mr-2 h-4 w-4" />
              Фильтры
              <Badge v-if="hasActiveFilters" class="ml-2 rounded-full px-1.5 py-0.5 text-[10px]">
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

        <!-- Активные чипсы -->
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

      <!-- Мобильный sidebar (раскрывается над контентом) -->
      <div
        v-if="mobileFiltersOpen"
        class="mb-6 space-y-4 lg:hidden"
      >
        <div
          v-for="section in filterSections"
          :key="section.id"
          class="rounded-2xl border bg-card/50 p-4"
        >
          <p class="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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

      <!-- Layout: Sidebar + Content -->
      <div class="flex gap-6">
        <!-- Sidebar Фильтры (десктоп) -->
        <aside class="hidden w-64 shrink-0 lg:block">
          <div class="sticky top-20 space-y-5">
            <div
              v-for="section in filterSections"
              :key="section.id"
              class="rounded-2xl border bg-card/50 p-4"
            >
              <p class="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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


        <!-- Content -->
        <div class="min-w-0 flex-1">
          <!-- Загрузка -->
          <div v-if="pending && books.length === 0" class="flex items-center justify-center py-32">
            <RefreshCw class="h-8 w-8 animate-spin text-primary" />
          </div>

          <!-- Ошибка -->
          <div
            v-else-if="error"
            class="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
          >
            <p class="text-lg font-semibold text-destructive">Ошибка загрузки</p>
            <p class="mt-2 text-sm text-muted-foreground">
              Не удалось получить каталог с сервера. Проверьте, что backend запущен и доступен.
            </p>
            <Button class="mt-4" @click="loadFirstPage">
              <RefreshCw class="mr-2 h-4 w-4" />
              Повторить
            </Button>
          </div>

          <!-- Список книг -->
          <div v-else-if="books.length > 0">
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <div
                v-for="(book, index) in books"
                :key="book.id"
                class="animate-fade-in"
                :style="{ animationDelay: `${Math.min(index, 19) * 50}ms` }"
              >
                <BookCard :book="book" :show-description="false" />
              </div>
            </div>

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
          </div>

          <!-- Пусто -->
          <div
            v-else
            class="flex flex-col items-center justify-center rounded-3xl border border-dashed py-24 text-center"
          >
            <Badge variant="secondary" class="mb-4 rounded-full px-3 py-1">
              Ничего не найдено
            </Badge>
            <Library class="h-16 w-16 text-muted-foreground/30" />
            <p class="mt-4 text-lg font-medium text-foreground">
              {{ hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Каталог пока пуст' }}
            </p>
            <p class="mt-2 max-w-md text-sm text-muted-foreground/70">
              {{
                hasActiveFilters
                  ? 'Сузьте запрос, снимите часть фильтров или очистите поиск, чтобы увидеть больше произведений.'
                  : 'Когда книги появятся в системе, они отобразятся здесь автоматически.'
              }}
            </p>
            <Button
              v-if="hasActiveFilters"
              variant="outline"
              class="mt-5 rounded-2xl"
              @click="clearFilters"
            >
              Очистить фильтры
            </Button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
