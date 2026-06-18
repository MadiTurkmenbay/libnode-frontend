/**
 * Доступность медиа-хранилища (MinIO). По умолчанию `true`, чтобы UI не мигал
 * до ответа; после fetch отражает реальное состояние сервера.
 */
export function useMediaConfig() {
  const configured = useState<boolean>('media-configured', () => true)
  const loaded = useState<boolean>('media-configured-loaded', () => false)

  async function fetchConfig(force = false) {
    if (loaded.value && !force) return configured.value
    try {
      const res = await executeApiRequest<{ configured: boolean }>('/api/media/config', { key: 'media-config' })
      if (res) configured.value = res.configured
    }
    catch {
      // оставляем текущее значение
    }
    loaded.value = true
    return configured.value
  }

  return { configured, fetchConfig }
}
