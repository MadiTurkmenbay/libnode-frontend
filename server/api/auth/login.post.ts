import { readBody } from 'h3'
import type { AuthResponse } from '~/types'

/**
 * BFF login route.
 *
 * Проксирует учётные данные на backend (`apiBase`), получает `{ token, user }`,
 * кладёт JWT в HttpOnly + SameSite=lax + (conditional) Secure cookie `auth_token`,
 * и возвращает клиенту ТОЛЬКО `user` — сырой токен в браузер не уходит.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const target = new URL('/api/auth/login', config.public.apiBase as string)

  let upstream: AuthResponse
  try {
    upstream = await $fetch<AuthResponse>(target.toString(), {
      method: 'POST',
      body,
    })
  } catch (err: any) {
    // Пробрасываем статус и тело ошибки backend (ProblemDetails / { error }).
    throw createError({
      statusCode: err?.response?.status ?? err?.statusCode ?? 502,
      statusMessage: err?.response?.statusText ?? err?.statusMessage ?? 'Bad Gateway',
      data: err?.data ?? err?.response?._data,
    })
  }

  setAuthCookie(event, upstream.token)

  // Возвращаем только пользователя, без токена.
  return upstream.user
})
