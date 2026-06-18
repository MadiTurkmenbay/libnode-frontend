import { READER_SETTINGS_STORAGE_KEY, DEFAULT_READER_SETTINGS } from '~/composables/useReaderSettings'
import { UI_PREFS_STORAGE_KEY, DEFAULT_UI_PREFS } from '~/composables/useUiPrefs'

interface SettingsExport {
  version: 1
  exportedAt: string
  readerSettings: Record<string, unknown>
  readerOverrides: Record<string, unknown>
  readerOverrideEnabled: Record<string, unknown>
  uiPrefs: Record<string, unknown>
}

/**
 * Экспорт/импорт всех пользовательских настроек (reader + UI prefs) в JSON.
 */
export function useSettingsExport() {
  function exportSettings(): string {
    const data: SettingsExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      readerSettings: readJson(READER_SETTINGS_STORAGE_KEY),
      readerOverrides: readJson('libnode-reader-overrides'),
      readerOverrideEnabled: readJson('libnode-reader-override-enabled'),
      uiPrefs: readJson(UI_PREFS_STORAGE_KEY),
    }
    return JSON.stringify(data, null, 2)
  }

  function downloadSettings() {
    const json = exportSettings()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `libnode-settings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importSettings(json: string): boolean {
    try {
      const data = JSON.parse(json) as SettingsExport
      if (data.version !== 1) return false
      if (data.readerSettings) writeJson(READER_SETTINGS_STORAGE_KEY, data.readerSettings)
      if (data.readerOverrides) writeJson('libnode-reader-overrides', data.readerOverrides)
      if (data.readerOverrideEnabled) writeJson('libnode-reader-override-enabled', data.readerOverrideEnabled)
      if (data.uiPrefs) writeJson(UI_PREFS_STORAGE_KEY, data.uiPrefs)
      return true
    } catch {
      return false
    }
  }

  function importFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(importSettings(result))
      }
      reader.onerror = () => resolve(false)
      reader.readAsText(file)
    })
  }

  function resetAllDefaults() {
    writeJson(READER_SETTINGS_STORAGE_KEY, DEFAULT_READER_SETTINGS)
    writeJson(UI_PREFS_STORAGE_KEY, DEFAULT_UI_PREFS)
    localStorage.removeItem('libnode-reader-overrides')
    localStorage.removeItem('libnode-reader-override-enabled')
  }

  return { exportSettings, downloadSettings, importSettings, importFromFile, resetAllDefaults }
}

function readJson(key: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}
