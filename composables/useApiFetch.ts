import type { UseFetchOptions } from 'nuxt/app'

/**
 * Кастомный композитбл для запросов к бэкенд API.
 * Автоматически подставляет baseURL из runtimeConfig.
 */
export function useApiFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  const config = useRuntimeConfig()

  return useFetch(url, {
    baseURL: config.public.apiBase as string,
    ...options,
  })
}
