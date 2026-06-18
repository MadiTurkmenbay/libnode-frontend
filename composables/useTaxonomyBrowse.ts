import type { BookDto, CursorStringPagedResult, TagDto, CategoryDto } from '~/types'

/**
 * Просмотр книг по тегу/категории (slug). Переиспользует /api/books с фильтром tags=/categories=.
 * kind: 'tags' | 'categories' (совпадает с query-параметром и списочным эндпоинтом).
 */
export function useTaxonomyBrowse(kind: 'tags' | 'categories', slug: string) {
  const books = ref<BookDto[]>([])
  const cursor = ref<string | null>(null)
  const hasMore = ref(false)
  const pending = ref(false)
  const name = ref<string>(slug)

  function url(c: string | null) {
    const p = new URLSearchParams()
    p.set('limit', '20')
    p.set(kind, slug)
    if (c) p.set('cursor', c)
    return `/api/books?${p.toString()}`
  }

  async function load(reset = false) {
    if (pending.value) return
    pending.value = true
    try {
      if (reset) { books.value = []; cursor.value = null; hasMore.value = false }
      const res = await executeApiRequest<CursorStringPagedResult<BookDto>>(url(cursor.value), {
        key: `browse:${kind}:${slug}:${cursor.value ?? 'init'}`,
      })
      books.value.push(...(res?.items ?? []))
      cursor.value = res?.nextCursor ?? null
      hasMore.value = res?.hasMore ?? false
    }
    finally {
      pending.value = false
    }
  }

  async function resolveName() {
    try {
      const list = await executeApiRequest<(TagDto | CategoryDto)[]>(`/api/${kind}`, { key: `taxonomy:${kind}` })
      const found = list?.find((x) => x.slug === slug)
      if (found) name.value = found.name
    }
    catch { /* keep slug */ }
  }

  return { books, hasMore, pending, name, load, resolveName }
}
