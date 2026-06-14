<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Trash2, Quote } from 'lucide-vue-next'
import type { QuoteDto } from '~/types'

definePageMeta({
  middleware: ['auth'],
})

const { toast } = useToast()
const { fetchQuotes, deleteQuote } = useQuotes()

const { data: quotes, pending, error, refresh } = await useAsyncData<QuoteDto[]>('profile-quotes', () => fetchQuotes())

const quotesByBook = computed(() => {
  if (!quotes.value) return []
  const grouped = new Map<string, { bookTitle: string; bookId: string; quotes: QuoteDto[] }>()
  for (const quote of quotes.value) {
    const existing = grouped.get(quote.bookId)
    if (existing) {
      existing.quotes.push(quote)
    }
    else {
      grouped.set(quote.bookId, {
        bookId: quote.bookId,
        bookTitle: quote.bookTitle,
        quotes: [quote],
      })
    }
  }
  return Array.from(grouped.values())
})

async function removeQuote(id: string) {
  try {
    await deleteQuote(id)
    await refresh()
    toast('Цитата удалена')
  }
  catch {
    toast({ variant: 'destructive', title: 'Не удалось удалить цитату' })
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold tracking-tight mb-6 flex items-center gap-2">
      <Quote class="h-8 w-8 text-primary" />
      Мои цитаты
    </h1>

    <div v-if="pending" class="space-y-6">
      <div v-for="i in 3" :key="i" class="space-y-3">
        <div class="h-6 w-48 rounded bg-muted"></div>
        <div class="h-24 rounded-lg bg-muted"></div>
      </div>
    </div>

    <div v-else-if="error || !quotes" class="py-20 text-center">
      <p class="text-muted-foreground">Не удалось загрузить цитаты.</p>
      <Button class="mt-4" @click="refresh()">
        Повторить
      </Button>
    </div>

    <div v-else-if="quotes.length === 0" class="py-20 text-center">
      <Quote class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">У вас пока нет цитат</h2>
      <p class="text-muted-foreground mb-6">
        Выделяйте текст в читалке и сохраняйте понравившиеся цитаты.
      </p>
      <Button as-child>
        <NuxtLink to="/">Перейти к каталогу</NuxtLink>
      </Button>
    </div>

    <div v-else class="space-y-10">
      <section v-for="group in quotesByBook" :key="group.bookId" class="space-y-4">
        <h2 class="text-xl font-semibold border-b pb-2">
          <NuxtLink :to="`/books/${group.bookId}`" class="hover:text-primary transition-colors">
            {{ group.bookTitle }}
          </NuxtLink>
        </h2>

        <div class="space-y-4">
          <article
            v-for="quote in group.quotes"
            :key="quote.id"
            class="relative rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <NuxtLink
              :to="`/books/${quote.bookId}/read/${quote.chapterId}`"
              class="block group"
            >
              <p class="text-sm text-muted-foreground mb-2">
                Глава {{ quote.chapterNumber }}: {{ quote.chapterTitle }}
              </p>
              <blockquote class="text-lg font-medium italic leading-relaxed text-foreground/90 border-l-4 border-primary pl-4">
                «{{ quote.selectedText }}»
              </blockquote>
              <p v-if="quote.contextText" class="mt-3 text-sm text-muted-foreground line-clamp-2">
                {{ quote.contextText }}
              </p>
              <p v-if="quote.note" class="mt-3 text-sm text-foreground/80">
                <span class="font-medium">Заметка:</span> {{ quote.note }}
              </p>
              <p class="mt-3 text-xs text-muted-foreground">
                {{ new Date(quote.createdAt).toLocaleDateString('ru-RU') }}
              </p>
            </NuxtLink>

            <Button
              size="sm"
              variant="ghost"
              class="absolute right-2 top-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              @click.stop="removeQuote(quote.id)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
