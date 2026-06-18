<script setup lang="ts">
import { Tag, FolderTree, Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-vue-next'
import AdminShell from '~/components/admin/AdminShell.vue'
import { Button } from '@/components/ui/button'
import type { TagDto, CategoryDto } from '~/types'

definePageMeta({ middleware: ['admin'] })
useHead({ title: 'Теги и категории — Админка — LibNode' })

type Kind = 'tags' | 'categories'
const activeKind = ref<Kind>('tags')

interface Item { id: string, name: string, slug: string }
const items = ref<Item[]>([])
const loading = ref(false)
const editing = ref<string | null>(null)
const editForm = reactive({ name: '', slug: '' })
const creating = reactive({ name: '', slug: '' })
const saving = ref(false)
const { toast } = useToast()

const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30'

async function load() {
  loading.value = true
  try {
    const data = await executeApiRequest<Item[]>(`/api/${activeKind.value}`, { key: `admin-${activeKind.value}` })
    items.value = data ?? []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(activeKind, () => { editing.value = null; load() }, { immediate: true })

async function create() {
  if (!creating.name.trim() || !creating.slug.trim()) return
  saving.value = true
  try {
    await executeApiRequest(`/api/${activeKind.value}`, {
      method: 'POST',
      body: { name: creating.name.trim(), slug: creating.slug.trim() },
    })
    toast({ title: 'Создано', description: `${creating.name}` })
    creating.name = ''
    creating.slug = ''
    await load()
  } catch (e: any) {
    toast({ title: 'Ошибка', description: e?.data?.error || 'Не удалось создать', variant: 'error' })
  } finally {
    saving.value = false
  }
}

function startEdit(item: Item) {
  editing.value = item.id
  editForm.name = item.name
  editForm.slug = item.slug
}

function cancelEdit() {
  editing.value = null
}

async function saveEdit(id: string) {
  saving.value = true
  try {
    await executeApiRequest(`/api/${activeKind.value}/${id}`, {
      method: 'PUT',
      body: { name: editForm.name.trim(), slug: editForm.slug.trim() },
    })
    toast({ title: 'Обновлено' })
    editing.value = null
    await load()
  } catch (e: any) {
    toast({ title: 'Ошибка', description: e?.data?.error || 'Не удалось обновить', variant: 'error' })
  } finally {
    saving.value = false
  }
}

async function remove(id: string, name: string) {
  if (!confirm(`Удалить «${name}»?`)) return
  try {
    await executeApiRequest(`/api/${activeKind.value}/${id}`, { method: 'DELETE' })
    toast({ title: 'Удалено', description: name })
    await load()
  } catch (e: any) {
    toast({ title: 'Ошибка', description: e?.data?.error || 'Не удалось удалить', variant: 'error' })
  }
}
</script>

<template>
  <AdminShell title="Теги и категории">
    <NuxtLink to="/admin" class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      ← Назад к дашборду
    </NuxtLink>

    <!-- Kind tabs -->
    <div class="mb-6 flex gap-2">
      <button
        v-for="k in [{ key: 'tags', label: 'Теги', icon: Tag }, { key: 'categories', label: 'Категории', icon: FolderTree }] as const"
        :key="k.key"
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        :class="activeKind === k.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent/10'"
        @click="activeKind = k.key"
      >
        <component :is="k.icon" class="h-4 w-4" />
        {{ k.label }}
      </button>
    </div>

    <!-- Create form -->
    <div class="mb-6 rounded-xl border border-border bg-card p-5">
      <h3 class="mb-3 flex items-center gap-2 font-semibold">
        <Plus class="h-4 w-4 text-primary" /> Создать
      </h3>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="flex-1">
          <label class="mb-1 block text-xs font-medium text-muted-foreground">Название</label>
          <input v-model="creating.name" :class="inputClass" type="text" maxlength="100" placeholder="Напр. Фэнтези" />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-xs font-medium text-muted-foreground">Slug</label>
          <input v-model="creating.slug" :class="inputClass" type="text" maxlength="100" placeholder="fantasy" />
        </div>
        <Button :disabled="saving || !creating.name.trim() || !creating.slug.trim()" @click="create">
          <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
          <Plus v-else class="h-4 w-4" />
          Добавить
        </Button>
      </div>
    </div>

    <!-- List -->
    <div class="rounded-xl border border-border bg-card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
      <table v-else-if="items.length" class="w-full">
        <thead class="border-b border-border bg-muted/30">
          <tr>
            <th class="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Название</th>
            <th class="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Slug</th>
            <th class="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            class="border-b border-border/60 transition-colors hover:bg-accent/5"
          >
            <td class="px-4 py-2.5">
              <template v-if="editing === item.id">
                <input v-model="editForm.name" :class="inputClass" type="text" />
              </template>
              <template v-else>
                <NuxtLink :to="`/${activeKind}/${item.slug}`" class="font-medium hover:text-primary">{{ item.name }}</NuxtLink>
              </template>
            </td>
            <td class="px-4 py-2.5">
              <template v-if="editing === item.id">
                <input v-model="editForm.slug" :class="inputClass" type="text" />
              </template>
              <template v-else>
                <code class="text-sm text-muted-foreground">{{ item.slug }}</code>
              </template>
            </td>
            <td class="px-4 py-2.5">
              <div class="flex items-center justify-end gap-1">
                <template v-if="editing === item.id">
                  <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-500/10" :disabled="saving" @click="saveEdit(item.id)">
                    <Check class="h-4 w-4" />
                  </button>
                  <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" @click="cancelEdit">
                    <X class="h-4 w-4" />
                  </button>
                </template>
                <template v-else>
                  <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" @click="startEdit(item)">
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10" @click="remove(item.id, item.name)">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="py-12 text-center text-sm text-muted-foreground">
        Нет элементов
      </div>
    </div>
  </AdminShell>
</template>
