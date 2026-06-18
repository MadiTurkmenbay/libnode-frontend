<script setup lang="ts">
import { Volume2, Play, Pause, Square, Settings2 } from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { useReaderTts } from '~/composables/useReaderTts'

const props = defineProps<{
  paragraphs: string[]
  surfaceClass?: string
  nextHref?: string | null
}>()
const emit = defineEmits<{ active: [index: number] }>()

const { supported, voices, voiceURI, rate, speaking, paused, activeIndex, play, pause, resume, stop, setVoice, setRate } = useReaderTts()

const autoAdvance = useReaderTtsAutoAdvance()

watch(activeIndex, (i) => emit('active', i))

function start() {
  play(props.paragraphs, {
    onEnd: () => {
      emit('active', -1)
      if (autoAdvance.value && props.nextHref) {
        // Продолжить озвучку на следующей главе.
        sessionStorage.setItem('libnode-tts-autoplay', '1')
        navigateTo(props.nextHref)
      }
    },
  })
}

function toggle() {
  if (!speaking.value) start()
  else if (paused.value) resume()
  else pause()
}

onMounted(() => {
  // Авто-старт при переходе по авто-проигрыванию между главами.
  if (supported.value && sessionStorage.getItem('libnode-tts-autoplay') === '1' && props.paragraphs.length) {
    sessionStorage.removeItem('libnode-tts-autoplay')
    nextTick(() => start())
  }
})

// Останавливаем при смене главы (paragraphs меняются).
watch(() => props.paragraphs, () => stop())
</script>

<template>
  <div v-if="supported" class="inline-flex items-center">
    <button
      type="button"
      class="inline-flex h-9 items-center gap-1.5 rounded-l-md border px-2.5 text-xs font-medium opacity-80 transition-opacity hover:opacity-100"
      :class="surfaceClass"
      :title="speaking ? (paused ? 'Продолжить' : 'Пауза') : 'Озвучить'"
      @click="toggle"
    >
      <Play v-if="!speaking || paused" class="h-4 w-4" />
      <Pause v-else class="h-4 w-4" />
      <Volume2 class="hidden h-4 w-4 sm:block" />
    </button>
    <button
      v-if="speaking"
      type="button"
      class="inline-flex h-9 items-center justify-center border-y border-r px-2 opacity-80 transition-opacity hover:opacity-100"
      :class="surfaceClass"
      title="Остановить"
      @click="stop"
    >
      <Square class="h-3.5 w-3.5" />
    </button>
    <Popover>
      <PopoverTrigger as-child>
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center rounded-r-md border-y border-r px-2 opacity-80 transition-opacity hover:opacity-100"
          :class="[surfaceClass, speaking ? '' : 'rounded-r-md']"
          title="Настройки озвучки"
        >
          <Settings2 class="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" :side-offset="8" class="w-72 space-y-3 p-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-muted-foreground">Голос</label>
          <select
            class="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            :value="voiceURI"
            @change="(e) => setVoice((e.target as HTMLSelectElement).value)"
          >
            <option value="">Авто (по языку)</option>
            <option v-for="v in voices" :key="v.voiceURI" :value="v.voiceURI">{{ v.name }} ({{ v.lang }})</option>
          </select>
        </div>
        <div>
          <label class="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Скорость</span><span>{{ rate.toFixed(1) }}×</span>
          </label>
          <input type="range" min="0.5" max="2" step="0.1" :value="rate" class="w-full accent-primary" @input="(e) => setRate(Number((e.target as HTMLInputElement).value))" />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" :checked="autoAdvance" class="accent-primary" @change="(e) => (autoAdvance = (e.target as HTMLInputElement).checked)" />
          Авто-переход к след. главе
        </label>
      </PopoverContent>
    </Popover>
  </div>
</template>
