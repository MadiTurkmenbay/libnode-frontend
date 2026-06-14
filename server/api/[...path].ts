import { getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const target = new URL(requestUrl.pathname + requestUrl.search, config.public.apiBase as string)

  return proxyRequest(event, target.toString())
})
