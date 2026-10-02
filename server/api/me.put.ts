import { getCookie, readBody } from 'h3'
import type { AuthResponse, UpdateProfileDto } from '~/types'

/**
 * BFF profile update route.
 *
 * Backend rotates the JWT when profile data changes and returns `{ token, user }`.
 * Browser code must never receive the raw token, so this server route stores the
 * rotated token in the HttpOnly cookie and returns only `user` to the client.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<UpdateProfileDto>(event)
  const token = getCookie(event, AUTH_COOKIE_NAME)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const target = new URL('/api/me', config.public.apiBase as string)

  let upstream: AuthResponse
  try {
    upstream = await $fetch<AuthResponse>(target.toString(), {
      method: 'PUT',
      body,
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
