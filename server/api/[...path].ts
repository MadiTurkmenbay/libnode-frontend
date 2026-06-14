import { getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const target = new URL(requestUrl.pathname + requestUrl.search, config.public.apiBase as string)

  // Примечание: при проксировании во внутреннюю Docker-сеть (api:8080) fetch
  // подменяет Host на api:8080. В production reverse proxy должен маршрутизировать
  // /api/* напрямую на backend, минуя этот Nitro proxy. Локально либо используйте
  // apiBaseClient, либо AllowedHosts=*.
  return proxyRequest(event, target.toString())
})
