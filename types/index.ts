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

// ── Типы авторизации ──────────────────────────────────

export interface UserDto {
  id: string
  username: string
  email: string
  role: 'Admin' | 'User' | 'Translator'
}

export interface AuthResponse {
  token: string
  user: UserDto
}

export interface CreateUserDto {
  username: string
  email: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}

