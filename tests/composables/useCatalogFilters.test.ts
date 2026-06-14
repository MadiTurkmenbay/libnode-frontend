import { describe, expect, it } from 'vitest'
import { BookType, CatalogSortBy, OriginalStatus, SortDirection, TranslationStatus } from '~/types'
import {
  buildRouteQuery,
  getQuerySignature,
  normalizeQueryValues,
  parseEnumFilter,
  parseRouteFilters,
  parseSortBy,
  parseSortDirection,
} from '~/composables/useCatalogFilters'

function baseQuery() {
  return {
    search: '',
    types: [] as string[],
    originalStatuses: [] as string[],
    translationStatuses: [] as string[],
    tags: [] as string[],
    categories: [] as string[],
    sortBy: '',
    sortDirection: '',
  }
}

describe('normalizeQueryValues', () => {
  it('returns empty array for null or undefined', () => {
    expect(normalizeQueryValues(null)).toEqual([])
    expect(normalizeQueryValues(undefined)).toEqual([])
  })

  it('flattens nested arrays', () => {
    expect(normalizeQueryValues(['a', ['b', 'c']])).toEqual(['a', 'b', 'c'])
  })

  it('trims and filters empty strings', () => {
    expect(normalizeQueryValues('  hello  ')).toEqual(['hello'])
    expect(normalizeQueryValues('   ')).toEqual([])
  })
})

describe('parseEnumFilter', () => {
  it('keeps only allowed enum values', () => {
    expect(parseEnumFilter(['1', '2', '99'], [BookType.Japan, BookType.Korea, BookType.China]))
      .toEqual([BookType.Japan, BookType.Korea])
  })

  it('deduplicates values', () => {
    expect(parseEnumFilter(['1', '1', '2'], [BookType.Japan, BookType.Korea]))
      .toEqual([BookType.Japan, BookType.Korea])
  })
})

describe('parseSortBy', () => {
  it('returns provided sortBy when valid', () => {
    expect(parseSortBy(CatalogSortBy.Title)).toBe(CatalogSortBy.Title)
  })

  it('defaults to createdAt for unknown values', () => {
    expect(parseSortBy('unknown')).toBe(CatalogSortBy.CreatedAt)
    expect(parseSortBy('')).toBe(CatalogSortBy.CreatedAt)
  })
})

describe('parseSortDirection', () => {
  it('returns asc when requested', () => {
    expect(parseSortDirection(SortDirection.Asc)).toBe(SortDirection.Asc)
  })

  it('defaults to desc', () => {
    expect(parseSortDirection(SortDirection.Desc)).toBe(SortDirection.Desc)
    expect(parseSortDirection('')).toBe(SortDirection.Desc)
  })
})

describe('parseRouteFilters', () => {
  it('parses default empty filters', () => {
    const result = parseRouteFilters(baseQuery())
    expect(result).toEqual({
      search: '',
      types: [],
      originalStatuses: [],
      translationStatuses: [],
      tags: [],
      categories: [],
      sortBy: CatalogSortBy.CreatedAt,
      sortDirection: SortDirection.Desc,
    })
  })

  it('parses all filter fields', () => {
    const result = parseRouteFilters({
      search: 'test query',
      types: ['1', '2'],
      originalStatuses: ['1'],
      translationStatuses: ['2'],
      tags: ['foo', 'bar'],
      categories: ['baz'],
      sortBy: CatalogSortBy.Title,
      sortDirection: SortDirection.Asc,
    })

    expect(result.search).toBe('test query')
    expect(result.types).toEqual([BookType.Japan, BookType.Korea])
    expect(result.originalStatuses).toEqual([OriginalStatus.Ongoing])
    expect(result.translationStatuses).toEqual([TranslationStatus.Completed])
    expect(result.tags).toEqual(['foo', 'bar'])
    expect(result.categories).toEqual(['baz'])
    expect(result.sortBy).toBe(CatalogSortBy.Title)
    expect(result.sortDirection).toBe(SortDirection.Asc)
  })
})

describe('buildRouteQuery', () => {
  it('returns empty query for default filters', () => {
    const query = buildRouteQuery({
      search: '',
      types: [],
      originalStatuses: [],
      translationStatuses: [],
      tags: [],
      categories: [],
      sortBy: CatalogSortBy.CreatedAt,
      sortDirection: SortDirection.Desc,
    })

    expect(query).toEqual({})
  })

  it('builds query with all filters', () => {
    const query = buildRouteQuery({
      search: 'test query',
      types: [BookType.Korea, BookType.Japan],
      originalStatuses: [OriginalStatus.Ongoing],
      translationStatuses: [TranslationStatus.Completed],
      tags: ['z', 'a'],
      categories: ['m', 'a'],
      sortBy: CatalogSortBy.Title,
      sortDirection: SortDirection.Asc,
    })

    expect(query.search).toBe('test query')
    expect(query.types).toEqual(['1', '2'])
    expect(query.originalStatuses).toEqual(['1'])
    expect(query.translationStatuses).toEqual(['2'])
    expect(query.tags).toEqual(['a', 'z'])
    expect(query.categories).toEqual(['a', 'm'])
    expect(query.sortBy).toBe(CatalogSortBy.Title)
    expect(query.sortDirection).toBe(SortDirection.Asc)
  })
})

describe('getQuerySignature', () => {
  it('returns stable signature for identical queries', () => {
    const a = getQuerySignature({ types: ['2', '1'], tags: ['b', 'a'] })
    const b = getQuerySignature({ types: ['1', '2'], tags: ['a', 'b'] })
    expect(a).toBe(b)
  })

  it('ignores empty arrays', () => {
    const a = getQuerySignature({ types: ['1'], empty: [] })
    const b = getQuerySignature({ types: ['1'] })
    expect(a).toBe(b)
  })
})
