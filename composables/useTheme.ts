export type SiteTheme = 'light' | 'dark'

export const SITE_THEME_STORAGE_KEY = 'libnode-theme'

/**
 * Site-wide light/dark theme.
 *
 * The actual `dark` class on <html> is set before paint by the inline
 * no-flash script in `nuxt.config.ts`. This composable mirrors that class
 * into reactive state after hydration and persists user toggles.
 *
 * `isReady` is false during SSR / before mount so UI can avoid rendering a
 * toggle in the wrong state (which would cause a hydration mismatch).
 */
export function useTheme() {
  const theme = useState<SiteTheme>('site-theme', () => 'dark')
  const isReady = useState<boolean>('site-theme-ready', () => false)

  function applyClass(value: SiteTheme) {
    if (!import.meta.client) return
    const root = document.documentElement
    root.classList.toggle('dark', value === 'dark')
  }

  function setTheme(value: SiteTheme) {
    theme.value = value
    applyClass(value)
    if (import.meta.client) {
      try {
        localStorage.setItem(SITE_THEME_STORAGE_KEY, value)
      }
      catch {
        // Ignore storage failures (private mode, etc.).
      }
    }
  }

  function toggle() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  onMounted(() => {
    // Trust the class the no-flash script already applied.
    theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    isReady.value = true
  })

  return { theme, isReady, setTheme, toggle }
}
