/**
 * Middleware для защиты admin-маршрутов.
 * 
 * Проверяет наличие JWT токена и роль пользователя.
 * Если пользователь не авторизован или не имеет роли Admin,
 * а маршрут начинается с /admin — редиректит на главную.
 * 
 * Использование: в страницах добавить definePageMeta({ middleware: 'auth' })
 */
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('auth_token')

  // Если маршрут не начинается с /admin, пропускаем
  if (!to.path.startsWith('/admin')) {
    return
  }

  // Нет токена — редирект на главную
  if (!token.value) {
    return navigateTo('/')
  }

  // Парсим роль из JWT payload
  const role = getRoleFromToken(token.value)

  if (role !== 'Admin') {
    return navigateTo('/')
  }
})

/**
 * Извлечь роль из JWT payload (без верификации подписи).
 */
function getRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr = typeof atob !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8')

    const parsed = JSON.parse(jsonStr)
    // .NET использует длинные claim URIs для ролей
    return parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null
  } catch {
    return null
  }
}
