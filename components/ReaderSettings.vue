<script setup lang="ts">
import {
  Settings,
  Minus,
  Plus,
  RotateCcw,
  Sun,
  Moon,
  Type,
  BookOpen,
  PanelLeft,
  PanelRight,
  PanelRightOpen,
  AlignJustify,
  AlignLeft,
} from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { useReaderSettings } from '~/composables/useReaderSettings'

const props = defineProps<{ bookId?: string }>()

const {
  settings,
  usingOverride,
  enableOverride,
  increaseFontSize,
  decreaseFontSize,
  setLineHeight,
  setTheme,
  setFontFamily,
  setContainerWidth,
  setLetterSpacing,
  setParagraphSpacing,
  setTextAlign,
  setDropCap,
  resetDefaults,
} = useReaderSettings(() => props.bookId ?? null)

const lineHeightPresets = [
  { label: 'Компакт', value: 1.4 },
  { label: 'Удобно', value: 1.6 },
  { label: 'Просторно', value: 1.8 },
  { label: 'Широко', value: 2.0 },
]

const letterSpacingPresets = [
  { label: '0', value: 0 },
  { label: 'S', value: 0.01 },
  { label: 'M', value: 0.025 },
  { label: 'L', value: 0.05 },
]

const paragraphSpacingPresets = [
  { label: 'Плотно', value: 0.4 },
  { label: 'Норма', value: 1 },
  { label: 'Свободно', value: 1.6 },
]

const themePresets = [
  { key: 'light', label: 'Светлая', icon: Sun },
  { key: 'dark', label: 'Тёмная', icon: Moon },
  { key: 'sepia', label: 'Сепия', icon: BookOpen },
] as const

const containerWidthPresets = [
  { value: 'narrow', label: 'Узкая', icon: PanelLeft },
  { value: 'medium', label: 'Средняя', icon: PanelRight },
  { value: 'wide', label: 'Широкая', icon: PanelRightOpen },
] as const

const sectionLabel = 'text-xs font-medium uppercase tracking-wider text-muted-foreground'
const segmentBase
  = 'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const segmentActive = 'border-primary bg-primary text-primary-foreground'
const segmentIdle = 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        class="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        title="Настройки чтения"
        aria-label="Настройки чтения"
      >
        <Settings class="h-4 w-4" />
      </button>
    </PopoverTrigger>

    <PopoverContent :side-offset="8" align="end" class="max-h-[80vh] w-80 overflow-y-auto p-0">
      <div class="space-y-6 p-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold">Настройки чтения</h4>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            @click="resetDefaults"
          >
            <RotateCcw class="h-3 w-3" />
            Сбросить
          </button>
        </div>

        <!-- Per-book override -->
        <label v-if="bookId" class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-2.5">
          <span class="min-w-0">
            <span class="block text-sm font-medium">Свои настройки для этой книги</span>
            <span class="block text-xs text-muted-foreground">Отдельные от глобальных</span>
          </span>
          <span
            class="relative h-5 w-9 shrink-0 rounded-full transition-colors"
            :class="usingOverride ? 'bg-primary' : 'bg-muted'"
          >
            <input type="checkbox" class="sr-only" :checked="usingOverride" @change="(e) => enableOverride((e.target as HTMLInputElement).checked)" />
            <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" :class="usingOverride ? 'left-[18px]' : 'left-0.5'"></span>
          </span>
        </label>

        <!-- Font size -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label :class="sectionLabel">Размер шрифта</label>
            <span class="text-xs font-medium tabular-nums">{{ settings.fontSize }}px</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Уменьшить шрифт"
              @click="decreaseFontSize"
            >
              <Minus class="h-3.5 w-3.5" />
            </button>
            <div class="flex h-8 flex-1 items-center justify-center rounded-md border bg-muted/50 text-xs font-medium tabular-nums">
              Aa
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Увеличить шрифт"
              @click="increaseFontSize"
            >
              <Plus class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Line height -->
        <div class="space-y-3">
          <label :class="sectionLabel">Межстрочный интервал</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="preset in lineHeightPresets"
              :key="preset.value"
              type="button"
              :class="[segmentBase, settings.lineHeight === preset.value ? segmentActive : segmentIdle]"
              @click="setLineHeight(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Paragraph spacing -->
        <div class="space-y-3">
          <label :class="sectionLabel">Интервал абзацев</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="preset in paragraphSpacingPresets"
              :key="preset.value"
              type="button"
              :class="[segmentBase, settings.paragraphSpacing === preset.value ? segmentActive : segmentIdle]"
              @click="setParagraphSpacing(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Letter spacing -->
        <div class="space-y-3">
          <label :class="sectionLabel">Межбуквенный интервал</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="preset in letterSpacingPresets"
              :key="preset.value"
              type="button"
              :class="[segmentBase, settings.letterSpacing === preset.value ? segmentActive : segmentIdle]"
              @click="setLetterSpacing(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Text align -->
        <div class="space-y-3">
          <label :class="sectionLabel">Выравнивание</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.textAlign === 'justify' ? segmentActive : segmentIdle"
              @click="setTextAlign('justify')"
            >
              <AlignJustify class="h-3.5 w-3.5" />
              По ширине
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.textAlign === 'left' ? segmentActive : segmentIdle"
              @click="setTextAlign('left')"
            >
              <AlignLeft class="h-3.5 w-3.5" />
              По левому
            </button>
          </div>
        </div>

        <!-- Drop cap -->
        <div class="flex items-center justify-between">
          <label :class="sectionLabel">Буквица</label>
          <button
            type="button"
            role="switch"
            :aria-checked="settings.dropCap"
            class="relative h-6 w-11 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="settings.dropCap ? 'border-primary bg-primary' : 'border-border bg-muted'"
            @click="setDropCap(!settings.dropCap)"
          >
            <span
              class="absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform"
              :class="settings.dropCap ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Font family -->
        <div class="space-y-3">
          <label :class="sectionLabel">Шрифт</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.fontFamily === 'sans' ? segmentActive : segmentIdle"
              @click="setFontFamily('sans')"
            >
              <Type class="h-3.5 w-3.5" />
              Sans
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 font-serif text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.fontFamily === 'serif' ? segmentActive : segmentIdle"
              @click="setFontFamily('serif')"
            >
              <Type class="h-3.5 w-3.5" />
              Serif
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div class="space-y-3">
          <label :class="sectionLabel">Тема</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="preset in themePresets"
              :key="preset.key"
              type="button"
              class="flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.theme === preset.key ? segmentActive : segmentIdle"
              @click="setTheme(preset.key)"
            >
              <component :is="preset.icon" class="h-4 w-4" />
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Container width -->
        <div class="space-y-3">
          <label :class="sectionLabel">Ширина контейнера</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="preset in containerWidthPresets"
              :key="preset.value"
              type="button"
              class="flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.containerWidth === preset.value ? segmentActive : segmentIdle"
              @click="setContainerWidth(preset.value)"
            >
              <component :is="preset.icon" class="h-4 w-4" />
              {{ preset.label }}
            </button>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
