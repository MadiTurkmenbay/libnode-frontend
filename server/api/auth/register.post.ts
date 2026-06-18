import { readBody } from 'h3'
import type { AuthResponse } from '~/types'

/**
 * BFF register route.
 *
 * Проксирует данные регистрации на backend (`apiBase`), получает `{ token, user }`,
 * кладёт JWT в HttpOnly cookie `auth_token` и возвращает клиенту ТОЛЬКО `user`.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const target = new URL('/api/auth/register', config.public.apiBase as string)

  let upstream: AuthResponse
  try {
    upstream = await $fetch<AuthResponse>(target.toString(), {
      method: 'POST',
      body,
    })
  } catch (err: any) {
    throw createError({
      statusCode: err?.response?.status ?? err?.statusCode ?? 502,
      statusMessage: err?.response?.statusText ?? err?.statusMessage ?? 'Bad Gateway',
      data: err?.data ?? err?.response?._data,
    })
  }

  setAuthCookie(event, upstream.token)

  return upstream.user
})
