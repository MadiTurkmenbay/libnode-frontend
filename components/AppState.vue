<script setup lang="ts">
import { Loader2, RefreshCw } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'

withDefaults(defineProps<{
  variant?: 'empty' | 'error' | 'loading'
  badge?: string
  title?: string
  description?: string
  loadingText?: string
}>(), {
  variant: 'empty',
  title: '',
  description: '',
  loadingText: 'Загрузка...',
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <Card
    class="text-center"
    :class="variant === 'error'
      ? 'border-destructive/30 bg-destructive/5'
      : variant === 'loading'
        ? 'border-transparent bg-transparent shadow-none'
        : 'border-dashed'"
  >
    <CardHeader class="items-center gap-3 pb-2">
      <Badge
        v-if="badge"
        variant="secondary"
        class="rounded-full px-3 py-1"
      >
        {{ badge }}
      </Badge>

      <div
        v-if="variant === 'loading'"
        class="flex items-center justify-center py-4"
      >
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
      </div>
      <div
        v-else
        class="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40"
      >
        <slot name="icon" />
      </div>

      <CardTitle
        v-if="title"
        :class="variant === 'error' ? 'text-destructive' : 'text-foreground'"
      >
        {{ title }}
      </CardTitle>
    </CardHeader>

    <CardContent v-if="description || variant === 'loading'">
      <p class="text-sm text-muted-foreground">
        <template v-if="variant === 'loading'">{{ loadingText }}</template>
        <template v-else>{{ description }}</template>
      </p>
    </CardContent>

    <CardFooter v-if="$slots.actions || variant === 'error'" class="flex justify-center gap-2">
      <slot name="actions" />
      <Button
        v-if="variant === 'error'"
        variant="outline"
        @click="emit('retry')"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        Повторить
      </Button>
    </CardFooter>
  </Card>
</template>
