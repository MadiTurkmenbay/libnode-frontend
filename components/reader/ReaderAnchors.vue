<script setup lang="ts">
import { BookmarkPlus, Trash2, CornerDownRight } from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { useChapterAnchors } from '~/composables/useChapterAnchors'

const props = defineProps<{ chapterId: string; surfaceClass?: string }>()

const chapterId = toRef(props, 'chapterId')
const { anchors, add, remove, jump } = useChapterAnchors(chapterId)

const label = ref('')
function save() {
  add(label.value)
  label.value = ''
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        type="button"
        class="relative inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium opacity-80 transition-opacity hover:opacity-100"
        :class="surfaceClass"
        title="Закладки в главе"
      >
        <BookmarkPlus class="h-4 w-4" />
        <span v-if="anchors.length" class="rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">{{ anchors.length }}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" :side-offset="8" class="w-72 p-2">
      <div class="flex items-center gap-1.5 p-1">
        <input
          v-model="label"
          placeholder="Метка (необязательно)"
          class="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary"
          @keydown.enter="save"
        />
        <button
          type="button"
          class="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          @click="save"
        >
          <BookmarkPlus class="h-3.5 w-3.5" /> Сохранить
        </button>
      </div>

      <div class="mt-1 max-h-64 overflow-y-auto">
        <p v-if="!anchors.length" class="px-2 py-4 text-center text-xs text-muted-foreground">
          Сохраните текущую позицию, чтобы быстро к ней вернуться.
        </p>
        <div
          v-for="a in anchors"
          :key="a.id"
          class="group flex items-center gap-1 rounded-lg px-1 py-1 transition-colors hover:bg-accent/10"
        >
          <button type="button" class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm" @click="jump(a)">
            <CornerDownRight class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span class="min-w-0 flex-1 truncate">{{ a.label }}</span>
          </button>
          <button type="button" class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive" title="Удалить" @click="remove(a.id)">
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
