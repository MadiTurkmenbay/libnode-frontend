<script setup lang="ts">
import { Upload, Loader2, ImagePlus } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  /** Список MIME-типов через запятую. */
  accept?: string
  maxBytes?: number
  uploading?: boolean
  disabled?: boolean
  previewUrl?: string | null
  /** Форма превью: square (аватар) или cover (обложка). */
  shape?: 'square' | 'cover'
  label?: string
  hint?: string
}>(), {
  accept: 'image/png,image/jpeg,image/webp,image/gif',
  maxBytes: 5 * 1024 * 1024,
  uploading: false,
  disabled: false,
  previewUrl: null,
  shape: 'square',
  label: 'Перетащите, вставьте или выберите файл',
  hint: 'PNG, JPG, WEBP, GIF · до 5 МБ',
})

const emit = defineEmits<{
  file: [file: File]
  invalid: [message: string]
}>()

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)

const acceptList = computed(() => props.accept.split(',').map((s) => s.trim()).filter(Boolean))

function validateAndEmit(file: File | undefined | null) {
  if (!file) return
  if (acceptList.value.length && !acceptList.value.includes(file.type)) {
    emit('invalid', 'Поддерживаются только изображения JPG, PNG, WEBP, GIF.')
    return
  }
  if (file.size > props.maxBytes) {
    emit('invalid', `Файл слишком большой (макс. ${Math.round(props.maxBytes / 1024 / 1024)} МБ).`)
    return
  }
  emit('file', file)
}

function openPicker() {
  if (props.disabled || props.uploading) return
  input.value?.click()
}

function onInputChange(e: Event) {
  validateAndEmit((e.target as HTMLInputElement).files?.[0])
  if (input.value) input.value.value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  if (props.disabled || props.uploading) return
  validateAndEmit(e.dataTransfer?.files?.[0])
}

function onPaste(e: ClipboardEvent) {
  if (props.disabled || props.uploading) return
  const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
  const file = item?.getAsFile()
  if (file) {
    e.preventDefault()
    validateAndEmit(file)
  }
}
</script>

<template>
  <div
    class="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    :class="[
      dragging ? 'border-primary bg-primary/[0.06]' : 'border-border hover:border-primary/40 hover:bg-accent/5',
      (disabled || uploading) ? 'pointer-events-none opacity-60' : '',
    ]"
    tabindex="0"
    role="button"
    :aria-label="label"
    @click="openPicker"
    @keydown.enter.prevent="openPicker"
    @keydown.space.prevent="openPicker"
    @dragover.prevent="dragging = true"
    @dragenter.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
    @paste="onPaste"
  >
    <input
      ref="input"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onInputChange"
    />

    <div
      v-if="previewUrl"
      class="overflow-hidden rounded-lg border border-border bg-muted/40"
      :class="shape === 'square' ? 'h-20 w-20 rounded-full' : 'h-28 w-20'"
    >
      <img :src="previewUrl" alt="" class="h-full w-full object-cover" />
    </div>
    <span
      v-else
      class="flex items-center justify-center rounded-lg bg-primary/10 text-primary"
      :class="shape === 'square' ? 'h-14 w-14 rounded-full' : 'h-16 w-12'"
    >
      <ImagePlus class="h-6 w-6" />
    </span>

    <div class="flex items-center gap-1.5 text-sm font-medium">
      <Loader2 v-if="uploading" class="h-4 w-4 animate-spin" />
      <Upload v-else class="h-4 w-4" />
      <span>{{ uploading ? 'Загрузка…' : label }}</span>
    </div>
    <p class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
