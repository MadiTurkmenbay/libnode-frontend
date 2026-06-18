export function formatShortDate(dateString: string) {
  if (!dateString) {
    return ''
  }

  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatLongDate(dateString: string) {
  if (!dateString) {
    return ''
  }

  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Относительное время «N мин/ч/дн назад» с откатом к короткой дате
 * для давних значений. Бэкенд отдаёт UTC без таймзоны — трактуем как UTC.
 */
export function formatRelativeTime(dateString: string) {
  if (!dateString) {
    return ''
  }

  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(dateString) ? dateString : `${dateString}Z`
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) {
    return formatShortDate(dateString)
  }

  const diffSec = Math.round((Date.now() - then) / 1000)
  if (diffSec < 45) return 'только что'
  if (diffSec < 90) return 'минуту назад'

  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin} мин назад`

  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return `${diffHour} ч назад`

  const diffDay = Math.round(diffHour / 24)
  if (diffDay < 7) return `${diffDay} дн назад`

  return formatShortDate(dateString)
}
