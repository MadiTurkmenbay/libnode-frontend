import type { RatingAggregateDto, ReviewDto, CursorPagedResult } from '~/types'

/** Оценки и отзывы на книги. */
export function useRatings() {
  const getAggregate = (bookId: string) =>
    executeApiRequest<RatingAggregateDto>(`/api/books/${bookId}/rating`, { key: `rating-agg:${bookId}` })

  const rate = (bookId: string, value: number, review: string | null) =>
    executeApiRequest<RatingAggregateDto>(`/api/books/${bookId}/rating`, {
      method: 'POST',
      body: { value, review },
    })

  const listReviews = (bookId: string, cursor: string | null, limit = 10) => {
    const cursorPart = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
    return executeApiRequest<CursorPagedResult<ReviewDto, string>>(
      `/api/books/${bookId}/reviews?limit=${limit}${cursorPart}`,
      { key: `reviews:${bookId}:${cursor ?? 'init'}` },
    )
  }

  return { getAggregate, rate, listReviews }
}
