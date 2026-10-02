import { getCookie, setResponseHeaders } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_COOKIE_NAME)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const target = new URL('/api/notifications/stream', config.public.apiBase as string)

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const upstream = await fetch(target.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!upstream.ok || !upstream.body) {
    throw createError({ statusCode: upstream.status || 502 })
  }

  return upstream.body
})
