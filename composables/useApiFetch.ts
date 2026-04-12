import type { UseFetchOptions } from 'nuxt/app'

let requestKeySeed = 0

function nextRequestKey(prefix: string) {
  requestKeySeed += 1
  return `${prefix}:${requestKeySeed}`
}

/**
 * Кастомный композитбл для запросов к бэкенд API.
 * 
 * В Docker-окружении SSR-запросы (с сервера Nuxt) идут через внутреннюю сеть
 * (NUXT_PUBLIC_API_BASE = http://api:8080), а клиентские запросы (из браузера) 
 * идут через внешний адрес (NUXT_PUBLIC_API_BASE_CLIENT = http://localhost:5000).
 * 
 * Если NUXT_PUBLIC_API_BASE_CLIENT не задан, используется один URL для всех запросов.
 * 
 * Автоматически добавляет JWT токен из cookie в заголовок Authorization.
 */
export function useApiFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  const config = useRuntimeConfig()
  const token = useCookie('auth_token')

  const baseURL = import.meta.client && config.public.apiBaseClient
    ? config.public.apiBaseClient as string
    : config.public.apiBase as string

  // Мержим заголовок Authorization если токен существует
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  }

  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`
  }

  return useFetch(url, {
    baseURL,
    ...options,
    headers,
  })
}

export async function executeApiRequest<T>(
  url: string | (() => string),
  options: UseFetchOptions<T> = {},
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
