/**
 * Middleware для защиты admin-маршрутов.
 *
 * UX-граница на основе состояния `auth_user.role`. Это НЕ замена серверной
 * проверки: backend на каждом admin-эндпоинте сам требует роль Admin.
 *
 * Использование: definePageMeta({ middleware: ['auth', 'admin'] })
 */
export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, isAdmin, fetchSession } = useAuth()

  if (!isAuthenticated.value) {
    await fetchSession()
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }

  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
