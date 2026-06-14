/**
 * Middleware для защиты маршрутов, требующих авторизации.
 *
 * Проверяет наличие токена и срок его действия (exp claim).
 * Истёкшие токены перенаправляют на /login — пользователь
 * видит форму входа вместо "сломанного" интерфейса.
 *
 * Использование: definePageMeta({ middleware: ['auth'] })
 */
export default defineNuxtRouteMiddleware(() => {
  const token = useCookie<string | null>('auth_token')

  if (!token.value) {
    return navigateTo('/login')
  }

  // Check token expiry via JWT exp claim.
  // Parse without verification (backend verifies on each API call).
  try {
    const parts = token.value.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(
        typeof atob !== 'undefined'
          ? atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
          : Buffer.from(parts[1], 'base64').toString('utf-8')
      )
      if (
        payload &&
        typeof payload.exp === 'number' &&
        payload.exp < Math.floor(Date.now() / 1000)
      ) {
        // Token expired — clear cookie and redirect to login.
        token.value = null
        return navigateTo('/login')
      }
    }
  } catch {
    // Malformed token — clear and redirect.
    token.value = null
    return navigateTo('/login')
  }
})
