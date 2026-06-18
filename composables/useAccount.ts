import type {
  UserProfileDto,
  UpdateProfileDto,
  ChangePasswordDto,
  AuthResponse,
} from '~/types'

/**
 * Личный кабинет: профиль, редактирование, смена пароля.
 * `me` — общий реактивный профиль (для аватара в шапке и форм настроек).
 */
export function useAccount() {
  const me = useState<UserProfileDto | null>('account-me', () => null)

  async function fetchMe(force = false) {
    if (me.value && !force) return me.value
    const res = await executeApiRequest<UserProfileDto>('/api/me', { key: 'account-me' })
    if (res) me.value = res
    return res
  }

  async function updateProfile(dto: UpdateProfileDto): Promise<AuthResponse | null> {
    const res = await executeApiRequest<AuthResponse>('/api/me', { method: 'PUT', body: dto })
    if (res) {
      // BFF: токен ротируется backend'ом, но HttpOnly cookie здесь не обновляется
      // (старый токен валиден до истечения). Обновляем только кэш пользователя.
      useAuth().setUser(res.user)
      // Обновляем кэш профиля свежими полями.
      await fetchMe(true)
    }
    return res
  }

  async function changePassword(dto: ChangePasswordDto): Promise<void> {
    await executeApiRequest<void>('/api/me/password', { method: 'POST', body: dto })
  }

  /** Загрузка аватара (multipart) в MinIO через API. Возвращает новый URL. */
  async function uploadAvatar(file: File): Promise<string | null> {
    const form = new FormData()
    form.append('file', file)
    const res = await executeApiRequest<{ avatarUrl: string, avatarThumbUrl: string | null }>('/api/me/avatar', {
      method: 'POST',
      body: form,
    })
    if (res?.avatarUrl && me.value) {
      // Заменяем объект целиком, чтобы гарантированно обновить все места (шапка, кабинет).
      me.value = { ...me.value, avatarUrl: res.avatarUrl, avatarThumbUrl: res.avatarThumbUrl ?? null }
    }
    return res?.avatarUrl ?? null
  }

  return { me, fetchMe, updateProfile, changePassword, uploadAvatar }
}
