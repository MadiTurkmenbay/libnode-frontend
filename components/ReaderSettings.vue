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
} from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { useReaderSettings } from '~/composables/useReaderSettings'

const {
  settings,
  increaseFontSize,
  decreaseFontSize,
  setLineHeight,
  setTheme,
  setFontFamily,
  setContainerWidth,
  resetDefaults,
} = useReaderSettings()

const lineHeightPresets = [
  { label: 'Compact', value: 1.4 },
  { label: 'Comfortable', value: 1.6 },
  { label: 'Spacious', value: 1.8 },
  { label: 'Wide', value: 2.0 },
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

    <PopoverContent :side-offset="8" align="end" class="w-80 p-0">
      <div class="p-4 space-y-6">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold">Настройки чтения</h4>
          <button
            type="button"
            class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5"
            @click="resetDefaults"
          >
            <RotateCcw class="h-3 w-3" />
            Сбросить
          </button>
        </div>

        <!-- Font size -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Размер шрифта
            </label>
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
            <div class="flex-1 h-8 flex items-center justify-center rounded-md border bg-muted/50 text-xs font-medium tabular-nums">
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
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Межстрочный интервал
          </label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="preset in lineHeightPresets"
              :key="preset.value"
              type="button"
              class="rounded-md border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.lineHeight === preset.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground'"
              @click="setLineHeight(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Font family -->
        <div class="space-y-3">
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Шрифт
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.fontFamily === 'sans' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'"
              @click="setFontFamily('sans')"
            >
              <Type class="h-3.5 w-3.5" />
              Sans
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors font-serif focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.fontFamily === 'serif' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'"
              @click="setFontFamily('serif')"
            >
              <Type class="h-3.5 w-3.5" />
              Serif
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div class="space-y-3">
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Тема
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="preset in themePresets"
              :key="preset.key"
              type="button"
              class="flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.theme === preset.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground'"
              @click="setTheme(preset.key)"
            >
              <component :is="preset.icon" class="h-4 w-4" />
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Container width -->
        <div class="space-y-3">
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Ширина контейнера
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="preset in containerWidthPresets"
              :key="preset.value"
              type="button"
              class="flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="settings.containerWidth === preset.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground'"
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
