/**
 * Middleware для защиты admin-маршрутов.
 *
 * Использование: definePageMeta({ middleware: ['auth', 'admin'] })
 */
export default defineNuxtRouteMiddleware(() => {
  const token = useCookie<string | null>('auth_token')

  if (!token.value) {
    return navigateTo('/login')
  }

  const role = getRoleFromToken(token.value)

  if (role !== 'Admin') {
    return navigateTo('/')
  }
})

function getRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - normalizedPayload.length % 4) % 4),
      '='
    )
    const json = typeof atob !== 'undefined'
      ? atob(paddedPayload)
      : Buffer.from(paddedPayload, 'base64').toString('utf-8')

    const parsed = JSON.parse(json)
    return parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null
  } catch {
    return null
  }
}
