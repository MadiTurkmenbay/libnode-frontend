/** Extract developer-authored API feedback, never arbitrary exception messages. */
function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const source = object(error)
  const response = object(source?.response)
  for (const body of [object(source?.data), object(response?._data)]) {
    // H3 wraps upstream feedback in `data` and uses a boolean `error` marker.
    for (const payload of [object(body?.data), body]) {
      for (const message of [payload?.error, payload?.detail]) {
        if (typeof message === 'string' && message.trim()) return message
      }
    }
  }
  return fallback
}
