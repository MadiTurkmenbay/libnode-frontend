<script setup lang="ts">
import { ChevronsDown, Pause, Gauge } from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { useAutoScroll } from '~/composables/useAutoScroll'

defineProps<{ surfaceClass?: string }>()

const { active, speed, toggle, setSpeed } = useAutoScroll()
</script>

<template>
  <div class="inline-flex items-center">
    <button
      type="button"
      class="inline-flex h-9 items-center gap-1.5 rounded-l-md border px-2.5 text-xs font-medium opacity-80 transition-opacity hover:opacity-100"
      :class="[surfaceClass, active ? 'text-primary opacity-100' : '']"
      :title="active ? 'Остановить авто-прокрутку' : 'Авто-прокрутка'"
      @click="toggle"
    >
      <Pause v-if="active" class="h-4 w-4" />
      <ChevronsDown v-else class="h-4 w-4" />
    </button>
    <Popover>
      <PopoverTrigger as-child>
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center rounded-r-md border-y border-r px-2 opacity-80 transition-opacity hover:opacity-100"
          :class="surfaceClass"
          title="Скорость прокрутки"
        >
          <Gauge class="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" :side-offset="8" class="w-60 p-3">
        <label class="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Скорость</span><span>{{ speed }} px/с</span>
        </label>
        <input type="range" min="10" max="200" step="5" :value="speed" class="w-full accent-primary" @input="(e) => setSpeed(Number((e.target as HTMLInputElement).value))" />
      </PopoverContent>
    </Popover>
  </div>
</template>
