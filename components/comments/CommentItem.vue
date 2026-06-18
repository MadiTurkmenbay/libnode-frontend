<script setup lang="ts">
import { ArrowBigUp, ArrowBigDown, Trash2, ShieldCheck, Reply, Pin, EyeOff, Loader2, Flag } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import CommentContent from '~/components/comments/CommentContent.vue'
import type { CommentDto } from '~/types'
import { getCommentRank } from '~/lib/commentRank'
import { formatRelativeTime } from '~/lib/formatters'

const props = withDefaults(defineProps<{
  comment: CommentDto
  canModerate?: boolean
  canPin?: boolean
  isReply?: boolean
}>(), {
  isReply: false,
})

const emit = defineEmits<{
  vote: [comment: CommentDto, value: -1 | 0 | 1]
  delete: [comment: CommentDto]
  pin: [comment: CommentDto]
  reply: [parent: CommentDto, content: string]
  report: [comment: CommentDto]
}>()

const { isAuthenticated } = useAuth()

const rank = computed(() => getCommentRank(props.comment.score))
const initial = computed(() => props.comment.username?.charAt(0).toUpperCase() || '?')
const canDelete = computed(() => props.comment.isOwn || props.canModerate)

function onVote(value: -1 | 1) {
  // Toggle off if already in that state.
  emit('vote', props.comment, props.comment.myVote === value ? 0 : value)
}

const replying = ref(false)
const replyDraft = ref('')
const replySubmitting = ref(false)

function insertSpoiler(target: 'reply') {
  void target
  replyDraft.value += '[spoiler]текст[/spoiler]'
}

async function submitReply() {
  const content = replyDraft.value.trim()
  if (!content || replySubmitting.value) return
  replySubmitting.value = true
  try {
    emit('reply', props.comment, content)
    replyDraft.value = ''
    replying.value = false
  }
  finally {
    replySubmitting.value = false
  }
}
</script>

<template>
  <div
    class="rounded-2xl border bg-card p-4 transition-shadow"
    :class="[
      comment.isPinned ? 'border-primary/40' : 'border-border',
      rank?.ringClass,
    ]"
  >
    <div class="flex gap-3">
      <!-- Vote column -->
      <div class="flex shrink-0 flex-col items-center pt-0.5">
        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          :class="comment.myVote === 1 ? 'text-primary' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'"
          :disabled="!isAuthenticated"
          title="Лайк"
          @click="onVote(1)"
        >
          <ArrowBigUp class="h-5 w-5" :class="{ 'fill-current': comment.myVote === 1 }" />
        </button>
        <span
          class="text-sm font-semibold tabular-nums"
          :class="comment.score > 0 ? 'text-primary' : comment.score < 0 ? 'text-destructive' : 'text-muted-foreground'"
        >{{ comment.score }}</span>
        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          :class="comment.myVote === -1 ? 'text-destructive' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'"
          :disabled="!isAuthenticated"
          title="Дизлайк"
          @click="onVote(-1)"
        >
          <ArrowBigDown class="h-5 w-5" :class="{ 'fill-current': comment.myVote === -1 }" />
        </button>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            v-if="comment.isPinned"
            class="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary"
          >
            <Pin class="h-3 w-3" /> Закреп
          </span>
          <UserAvatar :username="comment.username" :avatar-url="comment.avatarUrl" :avatar-thumb-url="comment.avatarThumbUrl" size="sm" />
          <span class="text-sm font-semibold text-foreground">{{ comment.username }}</span>
          <span
            v-if="rank"
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            :class="rank.badgeClass"
          >
            <ShieldCheck class="h-3 w-3" />
            {{ rank.label }}
          </span>
          <span class="text-xs text-muted-foreground">· {{ formatRelativeTime(comment.createdAt) }}</span>
        </div>

        <div class="mt-1.5">
          <CommentContent :content="comment.content" />
        </div>

        <!-- Actions -->
        <div class="mt-2 flex items-center gap-3 text-xs">
          <button
            v-if="!isReply && isAuthenticated"
            type="button"
            class="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
            @click="replying = !replying"
          >
            <Reply class="h-3.5 w-3.5" /> Ответить
            <span v-if="comment.replyCount" class="text-muted-foreground/70">· {{ comment.replyCount }}</span>
          </button>
          <button
            v-if="!isReply && canPin"
            type="button"
            class="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-primary"
            @click="emit('pin', comment)"
          >
            <Pin class="h-3.5 w-3.5" /> {{ comment.isPinned ? 'Открепить' : 'Закрепить' }}
          </button>
          <button
            v-if="!comment.isOwn && isAuthenticated"
            type="button"
            class="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-destructive"
            @click="emit('report', comment)"
          >
            <Flag class="h-3.5 w-3.5" /> Пожаловаться
          </button>
          <button
            v-if="canDelete"
            type="button"
            class="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-destructive"
            @click="emit('delete', comment)"
          >
            <Trash2 class="h-3.5 w-3.5" /> Удалить
          </button>
        </div>

        <!-- Reply form -->
        <div v-if="replying" class="mt-3">
          <textarea
            v-model="replyDraft"
            rows="2"
            maxlength="2000"
            placeholder="Ваш ответ… (поддерживается [spoiler]…[/spoiler])"
            class="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          ></textarea>
          <div class="mt-2 flex items-center justify-between">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg border border-input px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              title="Вставить спойлер"
              @click="insertSpoiler('reply')"
            >
              <EyeOff class="h-3.5 w-3.5" /> Спойлер
            </button>
            <div class="flex gap-2">
              <Button size="sm" variant="ghost" @click="replying = false">Отмена</Button>
              <Button size="sm" :disabled="!replyDraft.trim() || replySubmitting" @click="submitReply">
                <Loader2 v-if="replySubmitting" class="mr-1 h-3.5 w-3.5 animate-spin" />
                Ответить
              </Button>
            </div>
          </div>
        </div>

        <!-- Replies -->
        <div v-if="comment.replies && comment.replies.length" class="mt-3 space-y-2 border-l-2 border-border/60 pl-3">
          <CommentItem
            v-for="reply in comment.replies"
            :key="reply.id"
            :comment="reply"
            :can-moderate="canModerate"
            is-reply
            @vote="(c, v) => emit('vote', c, v)"
            @delete="(c) => emit('delete', c)"
            @report="(c) => emit('report', c)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
