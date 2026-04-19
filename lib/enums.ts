import { BookType, CatalogSortBy, SortDirection, type OriginalStatus, type TranslationStatus } from '~/types'

export const bookTypeLabels: Record<BookType, string> = {
  [BookType.Japan]: 'Япония',
  [BookType.Korea]: 'Корея',
  [BookType.China]: 'Китай',
  [BookType.English]: 'Англия',
  [BookType.Original]: 'Оригинал',
  [BookType.Fanfic]: 'Фанфик',
}

export const translationStatusLabels: Record<TranslationStatus, string> = {
  0: '—',
  1: 'Продолжается',
  2: 'Завершён',
  3: 'Заброшен',
  4: 'Приостановлен',
}

export const originalStatusLabels: Record<OriginalStatus, string> = {
  0: '—',
  1: 'Продолжается',
  2: 'Завершён',
  3: 'Приостановлен',
}

export interface SortOption {
  sortBy: CatalogSortBy
  sortDirection: SortDirection
  label: string
}

export const catalogSortOptions: SortOption[] = [
  { sortBy: CatalogSortBy.CreatedAt, sortDirection: SortDirection.Desc, label: 'По дате создания ↓' },
  { sortBy: CatalogSortBy.CreatedAt, sortDirection: SortDirection.Asc, label: 'По дате создания ↑' },
  { sortBy: CatalogSortBy.UpdatedAt, sortDirection: SortDirection.Desc, label: 'По дате обновления ↓' },
  { sortBy: CatalogSortBy.UpdatedAt, sortDirection: SortDirection.Asc, label: 'По дате обновления ↑' },
  { sortBy: CatalogSortBy.Title, sortDirection: SortDirection.Asc, label: 'По названию (А-Я, A-Z)' },
  { sortBy: CatalogSortBy.Title, sortDirection: SortDirection.Desc, label: 'По названию (Я-А, Z-A)' },
]

