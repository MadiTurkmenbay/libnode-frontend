import type { NotificationDto, CursorPagedResult, NotificationPrefsDto, UpdateNotificationPrefsDto } from '~/types'

/**
 * Уведомления пользователя + глобальный счётчик непрочитанных (shared state).
 */
export function useNotifications() {
  const unreadCount = useState<number>('notif-unread', () => 0)

  function list(cursor: string | null, limit = 20, isRead: boolean | null = null) {
    const cursorPart = cursor ? `&cursor=${cursor}` : ''
    const readPart = isRead === null ? '' : `&isRead=${isRead}`
    return executeApiRequest<CursorPagedResult<NotificationDto, string>>(
      `/api/notifications?limit=${limit}${cursorPart}${readPart}`,
      { key: `notifications:${isRead ?? 'all'}:${cursor ?? 'init'}` },
    )
  }

  async function refreshUnread() {
    try {
      const res = await executeApiRequest<{ count: number }>('/api/notifications/unread-count', {
        key: 'notif-unread-count',
      })
      unreadCount.value = res?.count ?? 0
    }
    catch {
      // ignore
    }
  }

  async function markRead(id: string) {
    await executeApiRequest<void>(`/api/notifications/${id}/read`, { method: 'POST' })
    if (unreadCount.value > 0) unreadCount.value -= 1
  }

  async function markAllRead() {
    await executeApiRequest<void>('/api/notifications/read-all', { method: 'POST' })
    unreadCount.value = 0
  }

  async function getPrefs() {
    return executeApiRequest<NotificationPrefsDto>('/api/notifications/prefs', {
      key: 'notif-prefs',
    })
  }

  async function updatePrefs(dto: UpdateNotificationPrefsDto) {
    return executeApiRequest<NotificationPrefsDto>('/api/notifications/prefs', {
      method: 'PUT',
      body: dto,
    })
  }

  return { unreadCount, list, refreshUnread, markRead, markAllRead, getPrefs, updatePrefs }
}
