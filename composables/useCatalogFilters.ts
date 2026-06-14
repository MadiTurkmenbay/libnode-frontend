import type { Ref } from 'vue'
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { bookTypeLabels, catalogSortOptions, originalStatusLabels, translationStatusLabels } from '~/lib/enums'
import {
  BookType,
  CatalogSortBy,
  OriginalStatus,
  SortDirection,
  TranslationStatus,
  type BookCatalogFilters,
  type CategoryDto,
  type TagDto,
} from '~/types'

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

export type CatalogFilterSectionItem = {
  key: string | number
  label: string
  selected: boolean
  toggle: () => Promise<void> | void
}

export type CatalogFilterSection = {
  id: string
  title: string
  items: CatalogFilterSectionItem[]
}

export type ActiveFilterChip = {
  key: string
  label: string
  remove: () => Promise<void> | void
}

export function normalizeQueryValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeQueryValues)
  }

  if (value === null || value === undefined) {
    return []
  }

  const normalized = String(value).trim()
  return normalized ? [normalized] : []
}

export function parseEnumFilter<T extends number>(value: unknown, allowedValues: readonly T[]): T[] {
  const allowed = new Set(allowedValues.map(String))

  return [...new Set(
    normalizeQueryValues(value)
      .filter(item => allowed.has(item))
      .map(item => Number(item) as T),
  )]
}

export function parseStringFilter(value: unknown): string[] {
  return [...new Set(normalizeQueryValues(value))]
}

export function parseSortBy(value: unknown): CatalogSortBy {
  const raw = normalizeQueryValues(value)[0]
  const allowed = Object.values(CatalogSortBy) as string[]
  return allowed.includes(raw ?? '') ? (raw as CatalogSortBy) : CatalogSortBy.CreatedAt
}

export function parseSortDirection(value: unknown): SortDirection {
  const raw = normalizeQueryValues(value)[0]
  return raw === SortDirection.Asc ? SortDirection.Asc : SortDirection.Desc
}

export function parseRouteFilters(query: LocationQuery): BookCatalogFilters {
  return {
    search: normalizeQueryValues(query.search)[0] ?? '',
    types: parseEnumFilter(query.types, bookTypeOptions),
    originalStatuses: parseEnumFilter(query.originalStatuses, originalStatusOptions),
    translationStatuses: parseEnumFilter(query.translationStatuses, translationStatusOptions),
    tags: parseStringFilter(query.tags),
    categories: parseStringFilter(query.categories),
    sortBy: parseSortBy(query.sortBy),
    sortDirection: parseSortDirection(query.sortDirection),
  }
}

export function buildRouteQuery(filters: BookCatalogFilters): LocationQueryRaw {
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

export function getQuerySignature(query: Record<string, unknown>): string {
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

export function useCatalogFilters(
  availableTags?: Ref<TagDto[] | null | undefined>,
  availableCategories?: Ref<CategoryDto[] | null | undefined>,
) {
  const route = useRoute()
  const router = useRouter()

  const search = ref('')
  const selectedTypes = ref<BookType[]>([])
  const selectedOriginalStatuses = ref<OriginalStatus[]>([])
  const selectedTranslationStatuses = ref<TranslationStatus[]>([])
  const selectedTags = ref<string[]>([])
  const selectedCategories = ref<string[]>([])
  const selectedSortBy = ref<CatalogSortBy>(CatalogSortBy.CreatedAt)
  const selectedSortDirection = ref<SortDirection>(SortDirection.Desc)

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

  async function selectSort(sortBy: CatalogSortBy, sortDirection: SortDirection) {
    selectedSortBy.value = sortBy
    selectedSortDirection.value = sortDirection
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

  const appliedFilters = computed(() => parseRouteFilters(route.query))
  const appliedFiltersSignature = computed(() => getQuerySignature(buildRouteQuery(appliedFilters.value)))
  const hasActiveFilters = computed(() => {
    const filters = appliedFilters.value
    return filters.search.trim() !== ''
      || filters.types.length > 0
      || filters.originalStatuses.length > 0
      || filters.translationStatuses.length > 0
      || filters.tags.length > 0
      || filters.categories.length > 0
  })

  syncUiState(appliedFilters.value)

  watch(appliedFiltersSignature, () => {
    syncUiState(appliedFilters.value)
  })

  const tagNameBySlug = computed(() => new Map((availableTags?.value ?? []).map(tag => [tag.slug, tag.name])))
  const categoryNameBySlug = computed(() => new Map((availableCategories?.value ?? []).map(category => [category.slug, category.name])))

  const activeFilterChips = computed<ActiveFilterChip[]>(() => [
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

  const filterSections = computed<CatalogFilterSection[]>(() => {
    const sections: CatalogFilterSection[] = []

    sections.push({
      id: 'type',
      title: 'Тип',
      items: bookTypeOptions.map(type => ({
        key: type,
        label: bookTypeLabels[type],
        selected: selectedTypes.value.includes(type),
        toggle: () => toggleSelection(selectedTypes, type),
      })),
    })

    sections.push({
      id: 'original',
      title: 'Статус оригинала',
      items: originalStatusOptions.map(status => ({
        key: status,
        label: originalStatusLabels[status],
        selected: selectedOriginalStatuses.value.includes(status),
        toggle: () => toggleSelection(selectedOriginalStatuses, status),
      })),
    })

    sections.push({
      id: 'translation',
      title: 'Статус перевода',
      items: translationStatusOptions.map(status => ({
        key: status,
        label: translationStatusLabels[status],
        selected: selectedTranslationStatuses.value.includes(status),
        toggle: () => toggleSelection(selectedTranslationStatuses, status),
      })),
    })

    if (availableTags?.value?.length) {
      sections.push({
        id: 'tags',
        title: 'Теги',
        items: availableTags.value.map(tag => ({
          key: tag.slug,
          label: tag.name,
          selected: selectedTags.value.includes(tag.slug),
          toggle: () => toggleSelection(selectedTags, tag.slug),
        })),
      })
    }

    if (availableCategories?.value?.length) {
      sections.push({
        id: 'categories',
        title: 'Категории',
        items: availableCategories.value.map(category => ({
          key: category.slug,
          label: category.name,
          selected: selectedCategories.value.includes(category.slug),
          toggle: () => toggleSelection(selectedCategories, category.slug),
        })),
      })
    }

    return sections
  })

  const currentSortLabel = computed(() => {
    const option = catalogSortOptions.find(item => item.sortBy === appliedFilters.value.sortBy && item.sortDirection === appliedFilters.value.sortDirection)
    return option?.label ?? 'Сортировка'
  })

  return {
    search,
    selectedSortBy,
    selectedSortDirection,
    appliedFilters,
    appliedFiltersSignature,
    hasActiveFilters,
    filterSections,
    activeFilterChips,
    currentSortLabel,
    clearFilters,
    selectSort,
    catalogSortOptions,
  }
}
