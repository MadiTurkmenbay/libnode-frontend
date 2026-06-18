import type { BookDto } from '~/types'

/** Эвристические рекомендации книг. */
export function useRecommendations() {
  const similar = (bookId: string, limit = 8) =>
    executeApiRequest<BookDto[]>(`/api/books/${bookId}/similar?limit=${limit}`, {
      key: `similar:${bookId}:${limit}`,
    })

  const mine = (limit = 12) =>
    executeApiRequest<BookDto[]>(`/api/recommendations?limit=${limit}`, { key: `recs:${limit}` })

  return { similar, mine }
}
