import { useLocalStorage } from '@vueuse/core'

export interface ReaderSettingsState {
  fontSize: number
  theme: 'dark' | 'light' | 'sepia'
  fontFamily: 'sans' | 'serif'
  lineHeight: number
}

const DEFAULTS: ReaderSettingsState = {
  fontSize: 18,
  theme: 'dark',
  fontFamily: 'sans',
  lineHeight: 1.6,
}

/**
 * Композитбл для настроек читалки.
 * Состояние автоматически синхронизируется с LocalStorage.
 */
export function useReaderSettings() {
  const settings = useLocalStorage<ReaderSettingsState>('libnode-reader-settings', { ...DEFAULTS })

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

  function increaseLineHeight() {
    if (settings.value.lineHeight < 2.4) {
      settings.value.lineHeight = Math.round((settings.value.lineHeight + 0.2) * 10) / 10
    }
  }

  function decreaseLineHeight() {
    if (settings.value.lineHeight > 1.0) {
      settings.value.lineHeight = Math.round((settings.value.lineHeight - 0.2) * 10) / 10
    }
  }

  function setTheme(theme: ReaderSettingsState['theme']) {
    settings.value.theme = theme
  }

  function setFontFamily(font: ReaderSettingsState['fontFamily']) {
    settings.value.fontFamily = font
  }

  function resetDefaults() {
    settings.value = { ...DEFAULTS }
  }

  return {
    settings,
    increaseFontSize,
    decreaseFontSize,
    increaseLineHeight,
    decreaseLineHeight,
    setTheme,
    setFontFamily,
    resetDefaults,
  }
}
