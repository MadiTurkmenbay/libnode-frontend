import { useLocalStorage } from '@vueuse/core'

/** Настройка авто-перехода к следующей главе при озвучке (localStorage). */
export function useReaderTtsAutoAdvance() {
  return useLocalStorage<boolean>('libnode-tts-autoadvance', false)
}

/**
 * Озвучка главы через Web Speech API (speechSynthesis), по абзацам, с подсветкой
 * текущего абзаца и авто-переходом к следующей главе. Полностью клиентская.
 */
export function useReaderTts() {
  const supported = ref(false)
  const voices = ref<SpeechSynthesisVoice[]>([])
  const voiceURI = useLocalStorage<string>('libnode-tts-voice', '')
  const rate = useLocalStorage<number>('libnode-tts-rate', 1)
  const speaking = ref(false)
  const paused = ref(false)
  const activeIndex = ref(-1)

  let paras: string[] = []
  let onParagraph: ((i: number) => void) | null = null
  let onEnd: (() => void) | null = null
  let stopped = false

  function loadVoices() {
    voices.value = window.speechSynthesis.getVoices()
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    supported.value = true
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  })
  onBeforeUnmount(() => stop())

  function pickVoice(): SpeechSynthesisVoice | undefined {
    if (voiceURI.value) {
      const v = voices.value.find((x) => x.voiceURI === voiceURI.value)
      if (v) return v
    }
    return voices.value.find((x) => x.lang?.toLowerCase().startsWith('ru')) ?? voices.value[0]
  }

  function speakIndex(i: number) {
    if (stopped) return
    if (i >= paras.length) {
      speaking.value = false
      activeIndex.value = -1
      onEnd?.()
      return
    }
    activeIndex.value = i
    onParagraph?.(i)
    const u = new SpeechSynthesisUtterance(paras[i])
    const v = pickVoice()
    if (v) u.voice = v
    u.rate = rate.value
    u.onend = () => { if (!stopped) speakIndex(i + 1) }
    u.onerror = () => { if (!stopped) speakIndex(i + 1) }
    window.speechSynthesis.speak(u)
  }

  function play(paragraphs: string[], handlers?: { onParagraph?: (i: number) => void, onEnd?: () => void }, startAt = 0) {
    if (!supported.value || !paragraphs.length) return
    stop()
    stopped = false
    paras = paragraphs
    onParagraph = handlers?.onParagraph ?? null
    onEnd = handlers?.onEnd ?? null
    speaking.value = true
    paused.value = false
    speakIndex(Math.max(0, Math.min(startAt, paragraphs.length - 1)))
  }

  function pause() {
    if (supported.value && speaking.value && !paused.value) {
      window.speechSynthesis.pause()
      paused.value = true
    }
  }
  function resume() {
    if (supported.value && paused.value) {
      window.speechSynthesis.resume()
      paused.value = false
    }
  }
  function stop() {
    if (!supported.value) return
    stopped = true
    window.speechSynthesis.cancel()
    speaking.value = false
    paused.value = false
    activeIndex.value = -1
  }
  function setVoice(uri: string) { voiceURI.value = uri }
  function setRate(r: number) { rate.value = Math.max(0.5, Math.min(2, Math.round(r * 10) / 10)) }

  return { supported, voices, voiceURI, rate, speaking, paused, activeIndex, play, pause, resume, stop, setVoice, setRate }
}
