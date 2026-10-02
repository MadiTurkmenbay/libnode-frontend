import type { UseFetchOptions } from 'nuxt/app'

type ApiFetchOptions<T> = UseFetchOptions<T> & {
  handleUnauthorized?: boolean
}

let requestKeySeed = 0

function nextRequestKey(prefix: string) {
  requestKeySeed += 1
  return `${prefix}:${requestKeySeed}`
}

/**
 * Единый вход для запросов к backend API (BFF-модель).
 *
 * Браузер всегда обращается к same-origin Nuxt-прокси (относительный `/api/...`),
 * без явного baseURL. Серверный catch-all (`server/api/[...path].ts`) читает
 * HttpOnly cookie `auth_token` и сам добавляет заголовок `Authorization`.
 * Поэтому на клиенте Authorization НЕ выставляется — токен недоступен из JS.
 *
 * При SSR Nuxt-сервер ходит напрямую в backend (`apiBase`). Cookie из входящего
 * запроса браузера здесь не передаётся автоматически, поэтому для SSR мы читаем
 * `auth_token` из входящих заголовков и форвардим Authorization вручную.
 */
export function useApiFetch<T>(url: string | (() => string), options: ApiFetchOptions<T> = {}) {
  const config = useRuntimeConfig()
  const { handleUnauthorized = true, ...fetchOptions } = options

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> ?? {}),
  }

  // На клиенте baseURL пустой → запрос идёт на same-origin Nuxt-прокси.
  // На сервере (SSR) ходим напрямую в backend и сами форвардим Authorization.
  let baseURL = ''
  if (import.meta.server) {
    baseURL = config.public.apiBase as string

    const token = useCookie('auth_token').value
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return useFetch(url, {
    baseURL,
    ...fetchOptions,
    headers,
    onResponseError(ctx) {
      // 401 от прокси/backend → сессия невалидна. Сбрасываем пользователя и
      // (на клиенте) уводим на /login, чтобы не показывать сломанный auth-UI.
      if (handleUnauthorized && ctx.response?.status === 401 && import.meta.client) {
        useAuth().clearAuth()
        const route = useRoute()
        if (route.path !== '/login') {
          navigateTo('/login')
        }
      }
      // Пробрасываем пользовательский onResponseError, если он был.
      const userHandler = fetchOptions.onResponseError
      if (typeof userHandler === 'function') {
        return userHandler(ctx)
      }
    },
  })
}

export async function executeApiRequest<T>(
  url: string | (() => string),
  options: ApiFetchOptions<T> = {},
) {
  const nuxtApp = useNuxtApp()

  const { data, error, execute } = await nuxtApp.runWithContext(() => useApiFetch<T>(url, {
    immediate: false,
    watch: false,
    key: options.key ?? nextRequestKey(String(options.method ?? 'GET')),
    ...options,
  }))

  await execute()

  if (error.value) {
    throw error.value
  }

  return data.value ?? null
}
