import { describe, expect, it } from 'vitest'
import { BookType, CatalogSortBy, OriginalStatus, SortDirection, TranslationStatus } from '~/types'
import { buildCatalogUrl, CATALOG_PAGE_SIZE } from '~/composables/useCatalogCursor'

function baseFilters() {
  return {
    search: '',
    types: [] as BookType[],
    originalStatuses: [] as OriginalStatus[],
    translationStatuses: [] as TranslationStatus[],
    tags: [] as string[],
    categories: [] as string[],
    sortBy: CatalogSortBy.CreatedAt,
    sortDirection: SortDirection.Desc,
  }
}

describe('buildCatalogUrl', () => {
  it('returns default URL with limit and sort only', () => {
    const url = buildCatalogUrl(baseFilters(), null)
    expect(url).toBe(`/api/books?limit=${CATALOG_PAGE_SIZE}&sortBy=createdAt&sortDirection=desc`)
  })

  it('appends cursor when provided', () => {
    const filters = baseFilters()
    const cursor = '2026-06-14T12:00:00.0000000Z|a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const url = buildCatalogUrl(filters, cursor)
    expect(url).toContain(`cursor=${encodeURIComponent(cursor)}`)
  })

  it('appends search, type and status filters', () => {
    const url = buildCatalogUrl({
      ...baseFilters(),
      search: 'test query',
      types: [BookType.Japan, BookType.Korea],
      originalStatuses: [OriginalStatus.Ongoing],
      translationStatuses: [TranslationStatus.Ongoing],
    }, null)

    expect(url).toContain('search=test+query')
    expect(url).toContain('types=1')
    expect(url).toContain('types=2')
    expect(url).toContain('originalStatuses=1')
    expect(url).toContain('translationStatuses=1')
  })

  it('sorts tags and categories alphabetically', () => {
    const url = buildCatalogUrl({
      ...baseFilters(),
      tags: ['z-tag', 'a-tag'],
      categories: ['m-category', 'a-category'],
    }, null)

    const tagsIndex = url.indexOf('tags=a-tag')
    const categoriesIndex = url.indexOf('categories=a-category')
    expect(tagsIndex).toBeGreaterThan(-1)
    expect(categoriesIndex).toBeGreaterThan(-1)
    expect(url.indexOf('tags=z-tag')).toBeGreaterThan(tagsIndex)
    expect(url.indexOf('categories=m-category')).toBeGreaterThan(categoriesIndex)
  })

  it('uses provided sortBy and sortDirection', () => {
    const url = buildCatalogUrl({
      ...baseFilters(),
      sortBy: CatalogSortBy.Title,
      sortDirection: SortDirection.Asc,
    }, null)

    expect(url).toContain('sortBy=title')
    expect(url).toContain('sortDirection=asc')
  })
})
