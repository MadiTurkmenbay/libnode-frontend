import { useLocalStorage } from '@vueuse/core'

export interface ReaderSettingsState {
  fontSize: number
  theme: 'dark' | 'light' | 'sepia'
  fontFamily: 'sans' | 'serif'
  lineHeight: number
}

export const DEFAULT_READER_SETTINGS: ReaderSettingsState = {
  fontSize: 18,
  theme: 'dark',
  fontFamily: 'sans',
  lineHeight: 1.6,
}

export const READER_SETTINGS_STORAGE_KEY = 'libnode-reader-settings'

/**
 * Композитбл для настроек читалки.
 * Состояние автоматически синхронизируется с LocalStorage.
 *
 * `isReady` становится `true` только после клиентского hydration.
 * Используйте его, чтобы SSR-рендер применял дефолтные значения,
 * а сохранённые настройки читалки применялись уже на клиенте —
 * это предотвращает hydration mismatch для theme/fontSize.
 */
export function useReaderSettings() {
  const settings = useLocalStorage<ReaderSettingsState>(READER_SETTINGS_STORAGE_KEY, { ...DEFAULT_READER_SETTINGS })
  const isReady = ref(false)

  onMounted(() => {
    isReady.value = true
  })

  function increaseFontSize() {
    if (settings.value.fontSize < 32) {
      settings.value.fontSize += 2
    }
  }

  function decreaseFontSize() {
    if (settings.value.fontSize > 12) {
      settings.value.fontSize -= 2
    }
  }

  function setLineHeight(value: number) {
    settings.value.lineHeight = Math.max(1.0, Math.min(2.4, Math.round(value * 10) / 10))
  }

  function increaseLineHeight() {
    setLineHeight(settings.value.lineHeight + 0.2)
  }

  function decreaseLineHeight() {
    setLineHeight(settings.value.lineHeight - 0.2)
  }

  function setTheme(theme: ReaderSettingsState['theme']) {
    settings.value.theme = theme
  }

  function setFontFamily(font: ReaderSettingsState['fontFamily']) {
    settings.value.fontFamily = font
  }

  function resetDefaults() {
    settings.value = { ...DEFAULT_READER_SETTINGS }
  }

  return {
    settings,
    isReady,
    increaseFontSize,
    decreaseFontSize,
    increaseLineHeight,
    decreaseLineHeight,
    setLineHeight,
    setTheme,
    setFontFamily,
    resetDefaults,
  }
}
