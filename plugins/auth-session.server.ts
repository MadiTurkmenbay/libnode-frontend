/**
 * Восстанавливает состояние пользователя на SSR из HttpOnly cookie `auth_token`.
 *
 * Прокси (server/api/[...path].ts) подставит Authorization из cookie; `/api/me`
 * вернёт профиль для валидной сессии. Результат попадает в useState('auth_user')
 * и переносится в гидрацию, поэтому первый клиентский рендер уже знает auth-состояние
 * без раскрытия токена в браузер.
 */
export default defineNuxtPlugin(async () => {
  const { fetchSession } = useAuth()
  await fetchSession()
})
