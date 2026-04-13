// ── Типы, соответствующие C# бэкенду ──────────────────

export interface ReadingProgressDto {
  chapterId: string
  chapterNumber: number
}

export interface BookDto {
  id: string
  title: string
  description: string | null
  coverUrl: string | null
  createdAt: string
  updatedAt: string
  chapterCount: number
  userProgress: ReadingProgressDto | null
}

export interface BookDetailDto extends BookDto {}

export interface ChapterListDto {
  id: string
  bookId: string
  title: string
  chapterNumber: number
  createdAt: string
  likesCount: number
  isLikedByCurrentUser: boolean
}

export interface ChapterDetailDto {
  id: string
  bookId: string
  title: string
  content: string
  chapterNumber: number
  createdAt: string
  likesCount: number
  isLikedByCurrentUser: boolean
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface CursorPagedResult<T, TCursor = string> {
  items: T[]
  nextCursor: TCursor | null
  hasMore: boolean
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

export interface SetProgressDto {
  chapterId: string
}

export interface CollectionDto {
  id: string
  name: string
  createdAt: string
  bookCount: number
}

export interface CollectionDetailDto extends CollectionDto {
  books: BookDto[]
}

export interface CreateCollectionDto {
  name: string
}

export interface AddBookToCollectionDto {
  bookId: string
}

export interface BookCollectionStatusDto {
  collectionId: string
  collectionName: string
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
