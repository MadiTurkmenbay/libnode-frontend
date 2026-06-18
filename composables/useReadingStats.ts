import type { Ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'

const IDLE_MS = 60_000

/**
 * Учёт времени чтения. Таймер тикает, пока вкладка видима и была активность
 * (скролл/клавиши/мышь) за последние 60с. Накопленное время на книгу — в localStorage.
 */
export function useReadingStats(bookId: Ref<string> | string) {
  const bid = computed(() => unref(bookId))
  const totals = useLocalStorage<Record<string, number>>('libnode-reading-seconds', {})

  const sessionSeconds = ref(0)
  const totalSeconds = computed(() => totals.value[bid.value] ?? 0)

  let timer: ReturnType<typeof setInterval> | null = null
  let lastActivity = Date.now()
  const events = ['scroll', 'keydown', 'mousemove', 'touchstart', 'click']
  function bump() { lastActivity = Date.now() }

  function isActive() {
    return typeof document !== 'undefined'
      && document.visibilityState === 'visible'
      && (Date.now() - lastActivity) < IDLE_MS
  }

  function tick() {
    if (!isActive()) return
    sessionSeconds.value++
    totals.value = { ...totals.value, [bid.value]: (totals.value[bid.value] ?? 0) + 1 }
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    timer = setInterval(tick, 1000)
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }))
  })
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    events.forEach((e) => window.removeEventListener(e, bump))
  })

  return { sessionSeconds, totalSeconds }
}

/** Формат секунд → "Xч Yм" / "Yм" / "Zс". */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} ч ${m} м`
  if (m > 0) return `${m} м`
  return `${s} с`
}
