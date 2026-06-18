import { FollowTargetType } from '~/types'
import type { FollowStatusDto, FeedItemDto, CursorPagedResult } from '~/types'

/** Подписки на пользователей/команды + лента активности. */
export function useFollow() {
  const status = (targetType: FollowTargetType, targetId: string) =>
    executeApiRequest<FollowStatusDto>(
      `/api/follow/status?targetType=${targetType}&targetId=${targetId}`,
      { key: `follow-status:${targetType}:${targetId}` },
    )

  const follow = (targetType: FollowTargetType, targetId: string) =>
    executeApiRequest<FollowStatusDto>('/api/follow', { method: 'POST', body: { targetType, targetId } })

  const unfollow = (targetType: FollowTargetType, targetId: string) =>
    executeApiRequest<FollowStatusDto>(
      `/api/follow?targetType=${targetType}&targetId=${targetId}`,
      { method: 'DELETE' },
    )

  const feed = (cursor: string | null, limit = 20) => {
    const cursorPart = cursor ? `&cursor=${cursor}` : ''
    return executeApiRequest<CursorPagedResult<FeedItemDto, string>>(
      `/api/feed?limit=${limit}${cursorPart}`,
      { key: `feed:${cursor ?? 'init'}` },
    )
  }

  return { status, follow, unfollow, feed }
}
