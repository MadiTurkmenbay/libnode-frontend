<script setup lang="ts">
import { UserPlus, UserCheck, Loader2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { FollowTargetType } from '~/types'
import { useFollow } from '~/composables/useFollow'

const props = defineProps<{
  targetType: FollowTargetType
  targetId: string
  showCount?: boolean
}>()

const { status, follow, unfollow } = useFollow()
const { isAuthenticated } = useAuth()
const { toast } = useToast()

const isFollowing = ref(false)
const followerCount = ref(0)
const loading = ref(false)

async function load() {
  const res = await status(props.targetType, props.targetId).catch(() => null)
  if (res) { isFollowing.value = res.isFollowing; followerCount.value = res.followerCount }
}
watch(() => [props.targetType, props.targetId], load, { immediate: true })

async function toggle() {
  if (!isAuthenticated.value) {
    toast({ description: 'Войдите, чтобы подписаться', variant: 'destructive' })
    return
  }
  loading.value = true
  try {
    const res = isFollowing.value
      ? await unfollow(props.targetType, props.targetId)
      : await follow(props.targetType, props.targetId)
    if (res) { isFollowing.value = res.isFollowing; followerCount.value = res.followerCount }
  }
  catch (e: any) {
    toast({ description: e?.data?.error || 'Не удалось изменить подписку', variant: 'destructive' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <Button
    :variant="isFollowing ? 'outline' : 'default'"
    class="gap-1.5"
    :disabled="loading"
    @click="toggle"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
    <UserCheck v-else-if="isFollowing" class="h-4 w-4" />
    <UserPlus v-else class="h-4 w-4" />
    <span>{{ isFollowing ? 'Вы подписаны' : 'Подписаться' }}</span>
    <span v-if="showCount" class="rounded-full bg-foreground/10 px-1.5 text-xs tabular-nums">{{ followerCount }}</span>
  </Button>
</template>
