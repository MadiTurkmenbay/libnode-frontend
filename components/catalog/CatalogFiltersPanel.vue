<script setup lang="ts">
import type { CatalogSortBy, SortDirection } from '~/types'
import type { SortOption } from '~/lib/enums'

defineProps<{
  search: string
  sortOptions: SortOption[]
  selectedSortBy: CatalogSortBy
  selectedSortDirection: SortDirection
  hasActiveFilters: boolean
  activeFilterChips: Array<{
    key: string
    label: string
    remove: () => Promise<void> | void
  }>
  sections: Array<{
    id: string
    title: string
    items: Array<{
      key: string | number
      label: string
      selected: boolean
      toggle: () => Promise<void> | void
    }>
  }>
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  clear: []
  selectSort: [sortBy: CatalogSortBy, sortDirection: SortDirection]
}>()
</script>

<template>
  <div class="space-y-4 lg:sticky lg:top-28">
    <section class="surface-panel p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-white">Фильтры и поиск</p>
          <p class="mt-1 text-xs leading-5 text-slate-400">Настройте выдачу по типам, статусам, тегам и категориям.</p>
        </div>
        <UButton v-if="hasActiveFilters" color="gray" variant="ghost" size="xs" @click="emit('clear')">
          Сбросить
        </UButton>
      </div>

      <div class="mt-4">
        <UInput
          :model-value="search"
          icon="i-heroicons-magnifying-glass-20-solid"
          size="lg"
          placeholder="Название, slug или описание"
          @update:model-value="emit('update:search', String($event))"
        />
      </div>

      <div class="mt-4 space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Сортировка</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in sortOptions"
            :key="`${option.sortBy}-${option.sortDirection}`"
            type="button"
            class="rounded-full border px-3 py-2 text-xs font-medium transition"
            :class="option.sortBy === selectedSortBy && option.sortDirection === selectedSortDirection
              ? 'border-violet-400/40 bg-violet-500/15 text-white'
              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'"
            @click="emit('selectSort', option.sortBy, option.sortDirection)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div v-if="activeFilterChips.length" class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="chip in activeFilterChips"
          :key="chip.key"
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-500/15"
          @click="chip.remove()"
        >
          <span>{{ chip.label }}</span>
          <UIcon name="i-heroicons-x-mark-20-solid" class="h-4 w-4" />
        </button>
      </div>
    </section>

    <section
      v-for="section in sections"
      :key="section.id"
      class="surface-card p-5"
    >
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {{ section.title }}
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="item in section.items"
          :key="String(item.key)"
          type="button"
          class="rounded-full border px-3 py-2 text-xs font-medium transition"
          :class="item.selected
            ? 'border-cyan-400/40 bg-cyan-400/15 text-white'
            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'"
          @click="item.toggle()"
        >
          {{ item.label }}
        </button>
      </div>
    </section>
  </div>
</template>
