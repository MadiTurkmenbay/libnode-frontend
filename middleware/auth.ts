/**
 * Middleware для защиты маршрутов, требующих авторизации.
 *
 * Использование: definePageMeta({ middleware: ['auth'] })
 */
export default defineNuxtRouteMiddleware(() => {
  const token = useCookie<string | null>('auth_token')

  if (!token.value) {
    return navigateTo('/login')
  }
})
