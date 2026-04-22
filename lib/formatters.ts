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
