import type { UserStatsDto, AchievementDto, QuestDto } from '~/types'

/** Игровая статистика текущего пользователя (XP, уровень, серии, достижения, квесты). */
export function useGamification() {
  const stats = useState<UserStatsDto | null>('gamification-stats', () => null)
  const achievements = useState<AchievementDto[]>('gamification-achievements', () => [])
  const quests = useState<QuestDto[]>('gamification-quests', () => [])

  async function fetchStats(force = false) {
    if (stats.value && !force) return stats.value
    const res = await executeApiRequest<UserStatsDto>('/api/me/stats', { key: 'me-stats' })
    if (res) stats.value = res
    return res
  }

  async function fetchAchievements(force = false) {
    if (achievements.value.length && !force) return achievements.value
    const res = await executeApiRequest<AchievementDto[]>('/api/me/achievements', { key: 'me-achievements' })
    if (res) achievements.value = res
    return res
  }

  async function fetchQuests(force = false) {
    if (quests.value.length && !force) return quests.value
    const res = await executeApiRequest<QuestDto[]>('/api/me/quests', { key: 'me-quests' })
    if (res) quests.value = res
    return res
  }

  return { stats, achievements, quests, fetchStats, fetchAchievements, fetchQuests }
}
