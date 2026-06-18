/**
 * Ранги комментариев по счёту (лайки минус дизлайки). Обводка зависит от ранга.
 * Положительные: 20 бронза · 50 серебро · 100 золото · 250 платина · 500 алмаз.
 * Отрицательные: -20 спорный · -50 непопулярный · -100 заминусован · -250 дно.
 */
export type CommentRankKey =
  | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  | 'controversial' | 'unpopular' | 'downvoted' | 'rockbottom'

export interface CommentRank {
  key: CommentRankKey
  label: string
  threshold: number
  ringClass: string
  badgeClass: string
}

const POSITIVE: CommentRank[] = [
  { key: 'bronze', label: 'Бронза', threshold: 20, ringClass: 'ring-1 ring-amber-700/60 dark:ring-amber-600/50', badgeClass: 'bg-amber-700/15 text-amber-700 dark:text-amber-500 ring-1 ring-amber-700/30' },
  { key: 'silver', label: 'Серебро', threshold: 50, ringClass: 'ring-1 ring-slate-400/70 dark:ring-slate-300/50', badgeClass: 'bg-slate-400/15 text-slate-600 dark:text-slate-300 ring-1 ring-slate-400/40' },
  { key: 'gold', label: 'Золото', threshold: 100, ringClass: 'ring-2 ring-yellow-500/70 dark:ring-yellow-400/60', badgeClass: 'bg-yellow-400/15 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500/40' },
  { key: 'platinum', label: 'Платина', threshold: 250, ringClass: 'ring-2 ring-cyan-400/70 dark:ring-cyan-300/60 shadow-[0_0_18px_-6px_rgba(34,211,238,0.5)]', badgeClass: 'bg-cyan-400/15 text-cyan-600 dark:text-cyan-300 ring-1 ring-cyan-400/40' },
  { key: 'diamond', label: 'Алмаз', threshold: 500, ringClass: 'comment-rank-diamond', badgeClass: 'comment-rank-diamond-badge text-white' },
]

const NEGATIVE: CommentRank[] = [
  { key: 'controversial', label: 'Спорный', threshold: -20, ringClass: 'ring-1 ring-orange-500/50', badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30' },
  { key: 'unpopular', label: 'Непопулярный', threshold: -50, ringClass: 'ring-1 ring-red-500/50', badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/30' },
  { key: 'downvoted', label: 'Заминусован', threshold: -100, ringClass: 'ring-2 ring-red-600/60', badgeClass: 'bg-red-600/20 text-red-600 dark:text-red-400 ring-1 ring-red-600/40' },
  { key: 'rockbottom', label: 'Дно', threshold: -250, ringClass: 'ring-2 ring-red-700/70 shadow-[0_0_16px_-6px_rgba(220,38,38,0.55)]', badgeClass: 'bg-red-700/25 text-red-500 ring-1 ring-red-700/50' },
]

/** Возвращает достигнутый ранг по счёту или null в нейтральной зоне (-20 < score < 20). */
export function getCommentRank(score: number): CommentRank | null {
  if (score >= POSITIVE[0].threshold) {
    let current = POSITIVE[0]
    for (const r of POSITIVE) if (score >= r.threshold) current = r
    return current
  }
  if (score <= NEGATIVE[0].threshold) {
    let current = NEGATIVE[0]
    for (const r of NEGATIVE) if (score <= r.threshold) current = r
    return current
  }
  return null
}

export const COMMENT_RANKS = POSITIVE
