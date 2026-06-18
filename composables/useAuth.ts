import type { UserDto, UserProfileDto, CreateUserDto, LoginDto } from '~/types'

/**
 * Composable для управления аутентификацией (BFF-модель).
 *
 * JWT хранится ТОЛЬКО в HttpOnly cookie `auth_token`, которую ставит Nuxt-сервер
 * (server/api/auth/login|register). Браузер не имеет доступа к токену из JS,
 * поэтому XSS не может его украсть. Authorization-заголовок к backend добавляет
 * серверный прокси (server/api/[...path].ts).
 *
 * Клиент знает только `user` (useState 'auth_user'). На первой загрузке/SSR
 * состояние авторизации восстанавливается запросом к `/api/me` через прокси
 * (наличие валидной cookie). Источник истины об авторизации — backend.
 */
export function useAuth() {
  const user = useState<UserDto | null>('auth_user', () => null)
  // Флаг, что первичная проверка сессии (`/api/me`) уже выполнена.
  const initialized = useState<boolean>('auth_initialized', () => false)

  // ── Computed ───────────────────────────────────────────────────────────────

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'Admin')

  // ── Methods ───────────────────────────────────────────────────────────────

  /**
   * Восстановить состояние пользователя из активной HttpOnly-сессии.
   * Дёргает `/api/me` через прокси: если cookie валидна — backend вернёт профиль,
   * иначе 401 → пользователь не аутентифицирован. Безопасно вызывать многократно.
   */
  async function fetchSession(force = false): Promise<UserDto | null> {
    if (initialized.value && !force) return user.value

    try {
      const profile = await executeApiRequest<UserProfileDto>('/api/me', { key: 'auth-me' })
      user.value = profile
        ? { id: profile.id, username: profile.username, email: profile.email, role: profile.role as UserDto['role'] }
        : null
    } catch {
      // 401/любая ошибка → считаем неаутентифицированным.
      user.value = null
    } finally {
      initialized.value = true
    }

    return user.value
  }

  async function login(dto: LoginDto): Promise<UserDto> {
    // Прокси ставит HttpOnly cookie и возвращает только user.
    const result = await $fetch<UserDto>('/api/auth/login', { method: 'POST', body: dto })
    user.value = result
    initialized.value = true
    return result
  }

  async function register(dto: CreateUserDto): Promise<UserDto> {
    const result = await $fetch<UserDto>('/api/auth/register', { method: 'POST', body: dto })
    user.value = result
    initialized.value = true
    return result
  }

  async function logout(): Promise<void> {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Даже если запрос упал — локально считаем разлогиненным.
    }
    user.value = null
    initialized.value = true
    await navigateTo('/')
  }

  /**
   * Сбросить состояние пользователя локально (например, при 401 от прокси).
   * Cookie уже невалидна/истекла на стороне сервера — здесь только UX-состояние.
   */
  function clearAuth() {
    user.value = null
    initialized.value = true
  }

  /** Обновить кэшированного пользователя (после редактирования профиля). */
  function setUser(next: UserDto) {
    user.value = next
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isAdmin,
    fetchSession,
    login,
    register,
    logout,
    clearAuth,
    setUser,
  }
}
