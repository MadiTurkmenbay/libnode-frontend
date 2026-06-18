import type { LeaderboardDto } from '~/types'

/** Публичные таблицы лидеров. */
export function useLeaderboard() {
  const fetchLeaderboard = (limit = 20) =>
    executeApiRequest<LeaderboardDto>(`/api/leaderboard?limit=${limit}`, { key: `leaderboard:${limit}` })

  return { fetchLeaderboard }
}
