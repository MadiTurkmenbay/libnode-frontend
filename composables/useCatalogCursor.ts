import type { Ref } from 'vue'
import type { BookCatalogFilters, BookDto, CursorStringPagedResult } from '~/types'

export const CATALOG_PAGE_SIZE = 20

export function buildCatalogUrl(filters: BookCatalogFilters, cursor: string | null): string {
  const params = new URLSearchParams()
  params.set('limit', String(CATALOG_PAGE_SIZE))
  params.set('sortBy', filters.sortBy)
  params.set('sortDirection', filters.sortDirection)

  if (cursor) {
    params.set('cursor', cursor)
  }

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

export function useCatalogCursor(filters: Ref<BookCatalogFilters>) {
  const books = ref<BookDto[]>([])
  const nextCursor = ref<string | null>(null)
  const isLoadingMore = ref(false)

  const firstPageUrl = computed(() => buildCatalogUrl(filters.value, null))

  const { data: pageData, pending, error, execute: fetchFirstPage } = useApiFetch<CursorStringPagedResult<BookDto>>(
    () => firstPageUrl.value,
    {
      immediate: false,
      watch: false,
    },
  )

  let latestRequest = 0

  function applyPageData(page: CursorStringPagedResult<BookDto> | null) {
    books.value = page?.items ?? []
    nextCursor.value = page?.nextCursor ?? null
  }

  async function loadFirstPage() {
    const requestId = ++latestRequest

    books.value = []
    nextCursor.value = null
    isLoadingMore.value = false

    await fetchFirstPage()

    if (requestId !== latestRequest || error.value) {
      return
    }

    applyPageData(pageData.value)
  }

  async function loadMore() {
    if (nextCursor.value === null || isLoadingMore.value || pending.value) {
      return
    }

    const requestId = latestRequest
    const cursor = nextCursor.value
    const url = buildCatalogUrl(filters.value, cursor)
    isLoadingMore.value = true

    try {
      const data = await executeApiRequest<CursorStringPagedResult<BookDto>>(
        url,
        {
          key: `catalog:cursor:${cursor}`,
        },
      )

      if (!data || requestId !== latestRequest) {
        return
      }

      books.value.push(...data.items)
      nextCursor.value = data.nextCursor
    }
    finally {
      isLoadingMore.value = false
    }
  }

  const hasMore = computed(() => nextCursor.value !== null)

  return {
    books,
    nextCursor,
    hasMore,
    pending,
    error,
    isLoadingMore,
    loadFirstPage,
    loadMore,
  }
}
