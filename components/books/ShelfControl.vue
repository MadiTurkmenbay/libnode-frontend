<script setup lang="ts">
import { Library, Check, X, ChevronDown } from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover'
import { ShelfStatus } from '~/types'
import { useShelves, SHELF_LABELS } from '~/composables/useShelves'

const props = defineProps<{ bookId: string }>()

const { getStatus, setShelf, removeShelf } = useShelves()
const { isAuthenticated } = useAuth()
const { toast } = useToast()

const current = ref<ShelfStatus | null>(null)
const open = ref(false)
const busy = ref(false)

const options: ShelfStatus[] = [ShelfStatus.Reading, ShelfStatus.Completed, ShelfStatus.PlanToRead, ShelfStatus.Dropped]

async function load() {
  if (!isAuthenticated.value) return
  const res = await getStatus(props.bookId).catch(() => null)
  current.value = res?.status ?? null
}
watch(() => props.bookId, load, { immediate: true })

async function pick(status: ShelfStatus) {
  busy.value = true
  try {
    await setShelf(props.bookId, status)
    current.value = status
    open.value = false
    toast(`Добавлено: ${SHELF_LABELS[status]}`)
  }
  catch { toast({ description: 'Не удалось обновить полку', variant: 'destructive' }) }
  finally { busy.value = false }
}

async function clear() {
  busy.value = true
  try {
    await removeShelf(props.bookId)
    current.value = null
    open.value = false
    toast('Убрано с полки')
  }
  catch { toast({ description: 'Не удалось убрать с полки', variant: 'destructive' }) }
  finally { busy.value = false }
}
</script>

<template>
  <Popover v-if="isAuthenticated" v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent/10"
        :class="current ? 'text-foreground' : 'text-muted-foreground'"
      >
        <Library class="h-4 w-4" />
        <span>{{ current ? SHELF_LABELS[current] : 'На полку' }}</span>
        <ChevronDown class="h-4 w-4 opacity-60" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" :side-offset="6" class="w-52 p-1.5">
      <button
        v-for="o in options"
        :key="o"
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent/10"
        :disabled="busy"
        @click="pick(o)"
      >
        <span class="flex-1">{{ SHELF_LABELS[o] }}</span>
        <Check v-if="current === o" class="h-4 w-4 text-primary" />
      </button>
      <button
        v-if="current"
        type="button"
        class="mt-1 flex w-full items-center gap-2 rounded-lg border-t px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
        :disabled="busy"
        @click="clear"
      >
        <X class="h-4 w-4" /> Убрать с полки
      </button>
    </PopoverContent>
  </Popover>
</template>
