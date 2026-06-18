<script setup lang="ts">
import { X, Check, ZoomIn } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

const props = withDefaults(defineProps<{
  modelValue: boolean
  src: string | null
  outputSize?: number
  filename?: string
}>(), {
  outputSize: 512,
  filename: 'avatar',
})

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  cropped: [file: File]
}>()

const VIEWPORT = 280 // px квадратного окна предпросмотра

const img = ref<HTMLImageElement | null>(null)
const imgW = ref(0)
const imgH = ref(0)
const baseSide = computed(() => Math.min(imgW.value, imgH.value) || 1)

const zoom = ref(1) // 1..4
const cropX = ref(0)
const cropY = ref(0)

const cropSide = computed(() => baseSide.value / zoom.value)
// Коэффициент перевода исходных px → экранные px окна.
const displayScale = computed(() => VIEWPORT / cropSide.value)

const imgStyle = computed(() => ({
  width: `${imgW.value * displayScale.value}px`,
  height: `${imgH.value * displayScale.value}px`,
  transform: `translate(${-cropX.value * displayScale.value}px, ${-cropY.value * displayScale.value}px)`,
}))

function clampOffsets() {
  cropX.value = Math.max(0, Math.min(cropX.value, imgW.value - cropSide.value))
  cropY.value = Math.max(0, Math.min(cropY.value, imgH.value - cropSide.value))
}

function load() {
  if (!props.src) return
  const image = new Image()
  image.onload = () => {
    img.value = image
    imgW.value = image.naturalWidth
    imgH.value = image.naturalHeight
    zoom.value = 1
    cropX.value = (imgW.value - cropSide.value) / 2
    cropY.value = (imgH.value - cropSide.value) / 2
    clampOffsets()
  }
  image.src = props.src
}

watch(() => [props.modelValue, props.src], ([open]) => { if (open) load() }, { immediate: true })

function onZoom(e: Event) {
  const next = Number((e.target as HTMLInputElement).value)
  const centerX = cropX.value + cropSide.value / 2
  const centerY = cropY.value + cropSide.value / 2
  zoom.value = next
  cropX.value = centerX - cropSide.value / 2
  cropY.value = centerY - cropSide.value / 2
  clampOffsets()
}

// Перетаскивание окна предпросмотра.
let dragging = false
let lastX = 0
let lastY = 0
function onPointerDown(e: PointerEvent) {
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const dx = (e.clientX - lastX) / displayScale.value
  const dy = (e.clientY - lastY) / displayScale.value
  lastX = e.clientX
  lastY = e.clientY
  cropX.value -= dx
  cropY.value -= dy
  clampOffsets()
}
function onPointerUp() { dragging = false }

function close() { emit('update:modelValue', false) }

function apply() {
  if (!img.value) return
  const canvas = document.createElement('canvas')
  canvas.width = props.outputSize
  canvas.height = props.outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(
    img.value,
    cropX.value, cropY.value, cropSide.value, cropSide.value,
    0, 0, props.outputSize, props.outputSize,
  )
  canvas.toBlob((blob) => {
    if (!blob) return
    const file = new File([blob], `${props.filename}.webp`, { type: 'image/webp' })
    emit('cropped', file)
    close()
  }, 'image/webp', 0.9)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      @click.self="close"
    >
      <div class="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-semibold">Кадрирование</h3>
          <button class="rounded-md p-1 text-muted-foreground hover:text-foreground" @click="close">
            <X class="h-4 w-4" />
          </button>
        </div>

        <div
          class="relative mx-auto overflow-hidden rounded-full border border-border bg-muted touch-none select-none"
          :style="{ width: `${VIEWPORT}px`, height: `${VIEWPORT}px` }"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <img
            v-if="src"
            :src="src"
            alt=""
            class="max-w-none cursor-grab active:cursor-grabbing"
            :style="imgStyle"
            draggable="false"
          />
        </div>

        <div class="mt-4 flex items-center gap-2">
          <ZoomIn class="h-4 w-4 text-muted-foreground" />
          <input type="range" min="1" max="4" step="0.01" :value="zoom" class="flex-1 accent-primary" @input="onZoom" />
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <Button variant="ghost" @click="close">Отмена</Button>
          <Button class="gap-1.5" @click="apply">
            <Check class="h-4 w-4" /> Применить
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
