import { useLocalStorage } from '@vueuse/core'

export interface UiPrefsState {
  /** Показывать элементы геймификации (уровни, XP, квесты, достижения). */
  showGamification: boolean
}

export const DEFAULT_UI_PREFS: UiPrefsState = {
  showGamification: true,
}

export const UI_PREFS_STORAGE_KEY = 'libnode-ui-prefs'

/**
 * Пользовательские UI-предпочтения (клиентские, в LocalStorage).
 *
 * `isReady` становится true только после клиентского mount — используйте
 * `showGamification` (computed), который во время SSR/до hydration отдаёт
 * дефолт (true), а сохранённое значение применяет уже на клиенте. Это
 * предотвращает hydration mismatch.
 */
export function useUiPrefs() {
  const prefs = useLocalStorage<UiPrefsState>(
    UI_PREFS_STORAGE_KEY,
    { ...DEFAULT_UI_PREFS },
    { mergeDefaults: true },
  )
  const isReady = ref(false)
  onMounted(() => { isReady.value = true })

  const showGamification = computed(() => (isReady.value ? prefs.value.showGamification : true))

  function setShowGamification(value: boolean) {
    prefs.value.showGamification = value
  }

  return { prefs, isReady, showGamification, setShowGamification }
}
