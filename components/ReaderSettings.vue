<script setup lang="ts">
import { Settings, Minus, Plus, RotateCcw, Sun, Moon, Type } from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { useReaderSettings } from '~/composables/useReaderSettings'

const {
  settings,
  increaseFontSize,
  decreaseFontSize,
  increaseLineHeight,
  decreaseLineHeight,
  setTheme,
  setFontFamily,
  resetDefaults,
} = useReaderSettings()
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        class="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        title="Настройки чтения"
      >
        <Settings class="h-4 w-4" />
      </button>
    </PopoverTrigger>

    <PopoverContent :side-offset="8" align="end" class="w-72 p-0">
      <div class="p-4 space-y-5">
        <!-- Заголовок -->
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold">Настройки чтения</h4>
          <button
            class="text-xs text-muted-foreground hover:text-foreground transition-colors"
            @click="resetDefaults"
          >
            <RotateCcw class="inline h-3 w-3 mr-1" />
            Сбросить
          </button>
        </div>

        <!-- Размер шрифта -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Размер шрифта
          </label>
          <div class="flex items-center justify-between gap-3">
            <button
              class="flex h-8 w-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent"
              @click="decreaseFontSize"
            >
              <Minus class="h-3.5 w-3.5" />
            </button>
            <span class="text-sm font-medium tabular-nums w-12 text-center">
              {{ settings.fontSize }}px
            </span>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent"
              @click="increaseFontSize"
            >
              <Plus class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Межстрочный интервал -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Межстрочный интервал
          </label>
          <div class="flex items-center justify-between gap-3">
            <button
              class="flex h-8 w-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent"
              @click="decreaseLineHeight"
            >
              <Minus class="h-3.5 w-3.5" />
            </button>
            <span class="text-sm font-medium tabular-nums w-12 text-center">
              {{ settings.lineHeight.toFixed(1) }}
            </span>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent"
              @click="increaseLineHeight"
            >
              <Plus class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Шрифт -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Шрифт
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
              :class="settings.fontFamily === 'sans' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'"
              @click="setFontFamily('sans')"
            >
              <Type class="h-3.5 w-3.5" />
              Sans
            </button>
            <button
              class="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors font-serif"
              :class="settings.fontFamily === 'serif' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'"
              @click="setFontFamily('serif')"
            >
              <Type class="h-3.5 w-3.5" />
              Serif
            </button>
          </div>
        </div>

        <!-- Тема -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Тема
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              class="flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors"
              :class="settings.theme === 'light' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'"
              @click="setTheme('light')"
            >
              <Sun class="h-4 w-4" />
              Светлая
            </button>
            <button
              class="flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors"
              :class="settings.theme === 'dark' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'"
              @click="setTheme('dark')"
            >
              <Moon class="h-4 w-4" />
              Тёмная
            </button>
            <button
              class="flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors"
              :class="settings.theme === 'sepia' ? 'ring-2 ring-primary border-primary' : 'hover:opacity-80'"
              :style="{ backgroundColor: '#f4ecd8', color: '#5b4636' }"
              @click="setTheme('sepia')"
            >
              <Type class="h-4 w-4" />
              Сепия
            </button>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
