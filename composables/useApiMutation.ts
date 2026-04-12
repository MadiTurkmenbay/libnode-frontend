export function useApiMutation() {
  const config = useRuntimeConfig()
  
  const baseURL = import.meta.client && config.public.apiBaseClient
    ? config.public.apiBaseClient as string
    : config.public.apiBase as string

  return async <T>(endpoint: string, options: any = {}) => {
    const token = useCookie('auth_token')
    const headers: Record<string, string> = { ...(options.headers || {}) }
    
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    return $fetch<T>(endpoint, {
      baseURL,
      ...options,
      headers
    })
  }
}
