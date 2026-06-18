import type { MaybeRefOrGetter } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export type ReaderTheme = 'dark' | 'light' | 'sepia'
export type ReaderFontFamily = 'sans' | 'serif'
export type ReaderContainerWidth = 'narrow' | 'medium' | 'wide'
export type ReaderTextAlign = 'justify' | 'left'

export interface ReaderSettingsState {
  fontSize: number
  theme: ReaderTheme
  fontFamily: ReaderFontFamily
  lineHeight: number
  containerWidth: ReaderContainerWidth
  /** Extra letter spacing in em. */
  letterSpacing: number
  /** Space between paragraphs in em. */
  paragraphSpacing: number
  textAlign: ReaderTextAlign
  /** Буквица: увеличенная первая буква первого абзаца. */
  dropCap: boolean
}

export const DEFAULT_READER_SETTINGS: ReaderSettingsState = {
  fontSize: 18,
  theme: 'dark',
  fontFamily: 'sans',
  lineHeight: 1.6,
  containerWidth: 'medium',
  letterSpacing: 0,
  paragraphSpacing: 1,
  textAlign: 'justify',
  dropCap: false,
}

export const READER_SETTINGS_STORAGE_KEY = 'libnode-reader-settings'
const OVERRIDES_KEY = 'libnode-reader-overrides'
const OVERRIDE_ENABLED_KEY = 'libnode-reader-override-enabled'

/**
 * Настройки читалки. Глобальные по умолчанию; если передан `bookId` и для этой книги
 * включён персональный режим, читалка использует отдельный набор настроек (override),
 * сохранённый по bookId. Без bookId поведение идентично прежнему (только глобальные).
 *
 * `isReady` становится true только после клиентского hydration — чтобы SSR применял дефолты.
 */
export function useReaderSettings(bookId?: MaybeRefOrGetter<string | null | undefined>) {
  const global = useLocalStorage<ReaderSettingsState>(
    READER_SETTINGS_STORAGE_KEY,
    { ...DEFAULT_READER_SETTINGS },
    { mergeDefaults: true },
  )
  const overrides = useLocalStorage<Record<string, ReaderSettingsState>>(OVERRIDES_KEY, {})
  const overrideEnabled = useLocalStorage<Record<string, boolean>>(OVERRIDE_ENABLED_KEY, {})

  const bid = computed(() => toValue(bookId) || null)
  const usingOverride = computed(() => !!bid.value && !!overrideEnabled.value[bid.value] && !!overrides.value[bid.value])

  // Активный набор настроек (реактивный объект из localStorage).
  const settings = computed<ReaderSettingsState>(() =>
    usingOverride.value && bid.value ? overrides.value[bid.value] : global.value,
  )

  const isReady = ref(false)
  onMounted(() => { isReady.value = true })

  /** Включить/выключить персональные настройки для текущей книги (сидируется из глобальных). */
  function enableOverride(on: boolean) {
    if (!bid.value) return
    if (on && !overrides.value[bid.value]) {
      overrides.value = { ...overrides.value, [bid.value]: { ...global.value } }
    }
    overrideEnabled.value = { ...overrideEnabled.value, [bid.value]: on }
  }

  function increaseFontSize() {
    if (settings.value.fontSize < 32) settings.value.fontSize += 1
  }
  function decreaseFontSize() {
    if (settings.value.fontSize > 12) settings.value.fontSize -= 1
  }
  function setLineHeight(value: number) {
    settings.value.lineHeight = Math.max(1.0, Math.min(2.4, Math.round(value * 10) / 10))
  }
  function increaseLineHeight() { setLineHeight(settings.value.lineHeight + 0.2) }
  function decreaseLineHeight() { setLineHeight(settings.value.lineHeight - 0.2) }
  function setTheme(theme: ReaderTheme) { settings.value.theme = theme }
  function setFontFamily(font: ReaderFontFamily) { settings.value.fontFamily = font }
  function setContainerWidth(width: ReaderContainerWidth) { settings.value.containerWidth = width }
  function setLetterSpacing(value: number) {
    settings.value.letterSpacing = Math.max(0, Math.min(0.1, Math.round(value * 1000) / 1000))
  }
  function setParagraphSpacing(value: number) {
    settings.value.paragraphSpacing = Math.max(0, Math.min(2.5, Math.round(value * 10) / 10))
  }
  function setTextAlign(value: ReaderTextAlign) { settings.value.textAlign = value }
  function setDropCap(value: boolean) { settings.value.dropCap = value }

  function resetDefaults() {
    if (usingOverride.value && bid.value) {
      overrides.value = { ...overrides.value, [bid.value]: { ...DEFAULT_READER_SETTINGS } }
    }
    else {
      global.value = { ...DEFAULT_READER_SETTINGS }
    }
  }

  return {
    settings,
    isReady,
    usingOverride,
    enableOverride,
    increaseFontSize,
    decreaseFontSize,
    increaseLineHeight,
    decreaseLineHeight,
    setLineHeight,
    setTheme,
    setFontFamily,
    setContainerWidth,
    setLetterSpacing,
    setParagraphSpacing,
    setTextAlign,
    setDropCap,
    resetDefaults,
  }
}
