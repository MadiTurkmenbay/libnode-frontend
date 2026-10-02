import { getCookie } from 'h3'
import type { UserProfileDto } from '~/types'

/**
 * BFF session/profile route.
 *
 * A concrete `/api/me` route is needed because method-specific routes such as
 * `me.put.ts` shadow the catch-all proxy for the same path in Nitro.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, AUTH_COOKIE_NAME)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const target = new URL('/api/me', config.public.apiBase as string)

  try {
    return await $fetch<UserProfileDto>(target.toString(), {
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
})
