import type { RankingType, BookDto } from '~/types'

/** Топ-N рейтинги книг. */
export function useRankings() {
  const get = (type: RankingType, limit = 24) =>
    executeApiRequest<BookDto[]>(`/api/rankings?type=${type}&limit=${limit}`, {
      key: `rankings:${type}:${limit}`,
    })

  return { get }
}
