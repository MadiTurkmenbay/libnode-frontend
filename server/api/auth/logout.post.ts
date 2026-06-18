/**
 * BFF logout route. Полностью удаляет HttpOnly cookie `auth_token`.
 */
export default defineEventHandler((event) => {
  clearAuthCookie(event)
  return { ok: true }
})
