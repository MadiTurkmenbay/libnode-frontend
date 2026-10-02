import { getCookie, getRequestURL, proxyRequest } from 'h3'

/**
 * Catch-all reverse proxy / BFF.
 *
 * Все запросы браузера к backend идут на этот same-origin Nuxt-эндпоинт
 * (`/api/...`). Здесь сервер читает HttpOnly cookie `auth_token` и подставляет
 * заголовок `Authorization: Bearer <token>`, который сам токен в браузер не
 * раскрывает. Backend остаётся Bearer-based и неизменным.
 *
 * Проксируются все методы (GET/POST/PUT/PATCH/DELETE) с method/query/body/headers.
 * Статус-коды и тела ошибок (ProblemDetails) пробрасываются как есть.
 *
 * Выделенные маршруты `/api/auth/login|register|logout`, `/api/me`,
 * `/api/notifications/stream` имеют приоритет над этим catch-all в роутере
 * Nitro и сюда не попадают.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const target = new URL(requestUrl.pathname + requestUrl.search, config.public.apiBase as string)

  const token = getCookie(event, AUTH_COOKIE_NAME)

  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // proxyRequest сам форвардит method, query, body и входящие заголовки,
  // прокидывает upstream-статус и тело (включая ошибки backend) обратно клиенту.
  return proxyRequest(event, target.toString(), { headers })
})
