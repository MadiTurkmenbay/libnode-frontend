// ── Типы, соответствующие C# бэкенду ──────────────────

export interface BookDto {
  id: string
  title: string
  description: string | null
  coverUrl: string | null
  createdAt: string
  updatedAt: string
  chapterCount: number
}

export interface ChapterListDto {
  id: string
  bookId: string
  title: string
  chapterNumber: number
  createdAt: string
}

export interface ChapterDetailDto {
  id: string
  bookId: string
  title: string
  content: string
  chapterNumber: number
  createdAt: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface CreateBookDto {
  title: string
  description?: string | null
  coverUrl?: string | null
}

export interface CreateChapterDto {
  bookId: string
  title: string
  content: string
  chapterNumber: number
}
