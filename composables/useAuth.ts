import type { UserDto, AuthResponse, CreateUserDto, LoginDto } from '~/types'

/**
 * Composable для управления аутентификацией.
 * 
 * Хранит JWT в httpOnly-безопасной cookie (SSR-совместимо).
 * Предоставляет реактивное состояние пользователя, методы login/register/logout,
 * а также вычисляемые свойства isAuthenticated и isAdmin.
 */
export function useAuth() {
  const token = useCookie('auth_token', {
    maxAge: 60 * 60 * 24, // 24 часа
    path: '/',
    sameSite: 'lax',
  })

  const user = useState<UserDto | null>('auth_user', () => null)

  // ── Инициализация: восстановление user из JWT payload при SSR ──────────

  if (token.value && !user.value) {
    try {
      const payload = parseJwtPayload(token.value)
      if (payload) {
        user.value = {
          id: payload.sub,
          username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? '',
          email: payload.email ?? '',
          role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? 'User',
        }
      }
    } catch {
      // Токен невалидный — сбрасываем
      token.value = null
      user.value = null
    }
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'Admin')

  // ── Methods ───────────────────────────────────────────────────────────────

  async function authenticate(endpoint: string, dto: LoginDto | CreateUserDto): Promise<AuthResponse> {
    const data = await executeApiRequest<AuthResponse>(endpoint, {
      method: 'POST',
      body: dto,
    })

    if (!data) {
      throw new Error(`Empty authentication response for ${endpoint}`)
    }

    token.value = data.token
    user.value = data.user
    return data
  }

  async function login(dto: LoginDto): Promise<AuthResponse> {
    return authenticate('/api/auth/login', dto)
  }

  async function register(dto: CreateUserDto): Promise<AuthResponse> {
    return authenticate('/api/auth/register', dto)
  }

  function logout() {
    token.value = null
    user.value = null
    navigateTo('/')
  }

  return {
    token: readonly(token),
    user: readonly(user),
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Парсинг payload из JWT токена (без верификации подписи — только для отображения).
 * Верификация происходит на сервере при каждом API-запросе.
 */
function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    // Base64url → Base64 → decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr = typeof atob !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8')

    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}
