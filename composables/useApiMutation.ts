import type { UseFetchOptions } from 'nuxt/app'

export function useApiMutation() {
  return async <T>(endpoint: string, options: UseFetchOptions<T> = {}) => {
    return executeApiRequest<T>(endpoint, options)
  }
}
