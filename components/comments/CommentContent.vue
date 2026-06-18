<script setup lang="ts">
/**
 * Рендер текста комментария: спойлеры [spoiler]…[/spoiler] и @упоминания.
 * Спойлер показывается как «Спойлер», клик раскрывает/скрывает.
 * @username подсвечивается отдельным цветом.
 */
const props = defineProps<{ content: string }>()

interface Segment {
  type: 'text' | 'spoiler' | 'mention'
  value: string
  key: number
}

const segments = computed<Segment[]>(() => {
  const re = /\[spoiler\]([\s\S]*?)\[\/?spoiler\]|@([A-Za-z0-9_]{2,50})/gi
  const out: Segment[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(props.content)) !== null) {
    if (m.index > last) {
      out.push({ type: 'text', value: props.content.slice(last, m.index), key: key++ })
    }
    if (m[1] !== undefined) {
      out.push({ type: 'spoiler', value: m[1], key: key++ })
    }
    else if (m[2] !== undefined) {
      out.push({ type: 'mention', value: m[2], key: key++ })
    }
    last = m.index + m[0].length
  }
  if (last < props.content.length) {
    out.push({ type: 'text', value: props.content.slice(last), key: key++ })
  }
  return out
})

const revealed = ref<Set<number>>(new Set())
function toggle(key: number) {
  const next = new Set(revealed.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  revealed.value = next
}
</script>

<template>
  <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
    <template v-for="seg in segments" :key="seg.key">
      <span v-if="seg.type === 'text'">{{ seg.value }}</span>
      <span v-else-if="seg.type === 'mention'" class="font-medium text-primary">@{{ seg.value }}</span>
      <button
        v-else
        type="button"
        class="mx-0.5 inline rounded px-1 align-baseline font-medium transition-colors"
        :class="revealed.has(seg.key)
          ? 'bg-fuchsia-500/10 text-fuchsia-500'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer select-none'"
        :title="revealed.has(seg.key) ? 'Скрыть спойлер' : 'Показать спойлер'"
        @click="toggle(seg.key)"
      >{{ revealed.has(seg.key) ? seg.value : 'Спойлер' }}</button>
    </template>
  </p>
</template>
