import type { H3Event } from 'h3'
import { setCookie, deleteCookie, getRequestHeader, getRequestProtocol } from 'h3'

export const AUTH_COOKIE_NAME = 'auth_token'

const MAX_AGE_SECONDS = 60 * 60 * 24 // 24 часа

/**
 * Признак того, что браузер общается с Nuxt по HTTPS.
 * В production за TLS-proxy заголовок x-forwarded-proto = https → Secure ставится.
 * На localhost HTTP dev Secure остаётся false, иначе cookie не сохранится.
 */
function isSecureRequest(event: H3Event): boolean {
  const xfProto = getRequestHeader(event, 'x-forwarded-proto')
  if (xfProto) {
    return xfProto.split(',')[0]?.trim().toLowerCase() === 'https'
  }
  return getRequestProtocol(event) === 'https'
}

/**
 * Устанавливает HttpOnly cookie с JWT. Браузер не может прочитать токен из JS,
 * поэтому XSS не может его украсть. Сервер читает его через getCookie.
 */
export function setAuthCookie(event: H3Event, token: string): void {
  setCookie(event, AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(event),
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

/** Полностью удаляет cookie с JWT (logout / 401). */
export function clearAuthCookie(event: H3Event): void {
  deleteCookie(event, AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(event),
    path: '/',
  })
}
