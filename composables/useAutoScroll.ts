import { useLocalStorage } from '@vueuse/core'

/**
 * Плавный авто-скролл страницы (requestAnimationFrame). Скорость в px/сек, сохраняется.
 * Останавливается внизу страницы и при ручном скролле вверх / тач-взаимодействии.
 */
export function useAutoScroll() {
  const active = ref(false)
  const speed = useLocalStorage<number>('libnode-autoscroll-speed', 40) // px/сек

  let raf = 0
  let last = 0
  let acc = 0

  function atBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
  }

  function step(ts: number) {
    if (!active.value) return
    if (!last) last = ts
    acc += speed.value * ((ts - last) / 1000)
    last = ts
    const px = Math.floor(acc)
    if (px > 0) {
      acc -= px
      window.scrollBy(0, px)
      if (atBottom()) { stop(); return }
    }
    raf = requestAnimationFrame(step)
  }

  // Ручное взаимодействие → пауза (только реальные жесты, не программный scroll).
  function onWheel(e: WheelEvent) { if (e.deltaY < 0) stop() }
  function onTouch() { stop() }
  function onKey(e: KeyboardEvent) {
    if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) stop()
  }

  function start() {
    if (active.value || typeof window === 'undefined') return
    active.value = true
    last = 0
    acc = 0
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('keydown', onKey)
    raf = requestAnimationFrame(step)
  }

  function stop() {
    active.value = false
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    if (typeof window !== 'undefined') {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('keydown', onKey)
    }
  }

  function toggle() { active.value ? stop() : start() }
  function setSpeed(v: number) { speed.value = Math.max(10, Math.min(200, Math.round(v))) }

  onBeforeUnmount(stop)

  return { active, speed, start, stop, toggle, setSpeed }
}
