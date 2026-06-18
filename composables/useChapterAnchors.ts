import type { Ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export interface ChapterAnchor {
  id: string
  label: string
  scrollY: number
  createdAt: number
}

/**
 * Внутриглавные закладки (якоря позиции прокрутки), хранятся в localStorage,
 * сгруппированы по chapterId. Полностью клиентские.
 */
export function useChapterAnchors(chapterId: Ref<string> | string) {
  const cid = computed(() => unref(chapterId))
  const all = useLocalStorage<Record<string, ChapterAnchor[]>>('libnode-anchors', {})

  const anchors = computed<ChapterAnchor[]>(() => all.value[cid.value] ?? [])

  function add(label?: string) {
    if (typeof window === 'undefined') return
    const y = Math.round(window.scrollY)
    const anchor: ChapterAnchor = {
      id: `${Date.now().toString(36)}-${Math.round(Math.random() * 1e6).toString(36)}`,
      label: (label || '').trim() || `Позиция ${y}px`,
      scrollY: y,
      createdAt: Date.now(),
    }
    const list = [anchor, ...(all.value[cid.value] ?? [])]
    all.value = { ...all.value, [cid.value]: list }
  }

  function remove(id: string) {
    all.value = { ...all.value, [cid.value]: anchors.value.filter((a) => a.id !== id) }
  }

  function jump(a: ChapterAnchor) {
    if (typeof window !== 'undefined') window.scrollTo({ top: a.scrollY, behavior: 'smooth' })
  }

  return { anchors, add, remove, jump }
}
