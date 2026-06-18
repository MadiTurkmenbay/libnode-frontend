import type {
  AdminUserDto,
  CursorPagedResult,
  CreateChapterDto,
  UpdateChapterDto,
  UpdateBookDto,
  ChapterDetailDto,
  BookDto,
} from '~/types'

/** Админские операции: пользователи и редактирование контента. */
export function useAdmin() {
  function listUsers(search: string, cursor: string | null, limit = 25) {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    if (search) params.set('search', search)
    if (cursor) params.set('cursor', cursor)
    return executeApiRequest<CursorPagedResult<AdminUserDto, string>>(
      `/api/admin/users?${params.toString()}`,
      { key: `admin-users:${search}:${cursor ?? 'init'}` },
    )
  }

  const updateUserRole = (id: string, role: string) =>
    executeApiRequest<AdminUserDto>(`/api/admin/users/${id}/role`, { method: 'PUT', body: { role } })
  const deleteUser = (id: string) =>
    executeApiRequest<void>(`/api/admin/users/${id}`, { method: 'DELETE' })

  // Content editing (admin or team members, enforced server-side)
  const createChapter = (body: CreateChapterDto) =>
    executeApiRequest<ChapterDetailDto>('/api/chapters', { method: 'POST', body })
  const updateChapter = (id: string, body: UpdateChapterDto) =>
    executeApiRequest<ChapterDetailDto>(`/api/chapters/${id}`, { method: 'PUT', body })
  const deleteChapter = (id: string) =>
    executeApiRequest<void>(`/api/chapters/${id}`, { method: 'DELETE' })
  const updateBook = (id: string, body: UpdateBookDto) =>
    executeApiRequest<BookDto>(`/api/books/${id}`, { method: 'PUT', body })

  /** Загрузка обложки книги (multipart) в MinIO. Возвращает новый URL. */
  const uploadCover = (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return executeApiRequest<{ coverUrl: string }>(`/api/admin/books/${id}/cover`, {
      method: 'POST',
      body: form,
    })
  }

  return { listUsers, updateUserRole, deleteUser, createChapter, updateChapter, deleteChapter, updateBook, uploadCover }
}
