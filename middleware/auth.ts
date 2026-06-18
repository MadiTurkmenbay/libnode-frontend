/**
 * Middleware для защиты маршрутов, требующих авторизации.
 *
 * Опирается на состояние `auth_user` (useAuth), которое гидрируется на SSR из
 * HttpOnly cookie через `/api/me`. Токен в JS недоступен. Это UX-граница:
 * реальную авторизацию backend проверяет на каждом API-запросе (401 → редирект).
 *
 * Использование: definePageMeta({ middleware: ['auth'] })
 */
export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, fetchSession } = useAuth()

  // На первом заходе убеждаемся, что сессия проверена (на случай прямого перехода).
  if (!isAuthenticated.value) {
    await fetchSession()
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
