import { ShelfStatus } from '~/types'
import type { ShelfItemDto } from '~/types'

export const SHELF_LABELS: Record<ShelfStatus, string> = {
  [ShelfStatus.Reading]: 'Читаю',
  [ShelfStatus.Completed]: 'Прочитано',
  [ShelfStatus.PlanToRead]: 'В планах',
  [ShelfStatus.Dropped]: 'Брошено',
}

/** Полки пользователя (статусы чтения книг). */
export function useShelves() {
  const getStatus = (bookId: string) =>
    executeApiRequest<{ status: ShelfStatus | null }>(`/api/books/${bookId}/shelf`, {
      key: `shelf-status:${bookId}`,
    })

  const setShelf = (bookId: string, status: ShelfStatus) =>
    executeApiRequest<void>(`/api/books/${bookId}/shelf`, { method: 'PUT', body: { status } })

  const removeShelf = (bookId: string) =>
    executeApiRequest<void>(`/api/books/${bookId}/shelf`, { method: 'DELETE' })

  const listShelves = (status?: ShelfStatus) => {
    const q = status ? `?status=${status}` : ''
    return executeApiRequest<ShelfItemDto[]>(`/api/me/shelves${q}`, { key: `shelves:${status ?? 'all'}` })
  }

  return { getStatus, setShelf, removeShelf, listShelves }
}
