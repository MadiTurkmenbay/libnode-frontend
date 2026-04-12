import type { UseFetchOptions } from 'nuxt/app'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { CollectionDto } from '~/types'

let requestKeySeed = 0

function nextRequestKey(prefix: string) {
  requestKeySeed += 1
  return `${prefix}:${requestKeySeed}`
}

export const useCollectionsStore = defineStore('collections', () => {
  const { isAuthenticated } = useAuth()
  const nuxtApp = useNuxtApp()

  const collections = ref<CollectionDto[]>([])
  const isPending = ref(false)
  const isCreating = ref(false)
  const isUpdating = ref(false)

  watch(isAuthenticated, (authenticated) => {
    if (!authenticated) {
      collections.value = []
    }
  }, { immediate: true })

  async function executeRequest<T>(url: string, options: UseFetchOptions<T> = {}) {
    const { data, error, execute } = await nuxtApp.runWithContext(() => useApiFetch<T>(url, {
      immediate: false,
      watch: false,
      key: options.key ?? nextRequestKey(String(options.method ?? 'GET')),
      ...options,
    }))

    await execute()

    if (error.value) {
      throw error.value
    }

    return data.value ?? null
  }

  async function fetchCollections(force = false) {
    if (!isAuthenticated.value) {
      collections.value = []
      return collections.value
    }

    if (isPending.value || (!force && collections.value.length > 0)) {
      return collections.value
    }

    isPending.value = true

    try {
      const response = await executeRequest<CollectionDto[]>('/api/collections', {
        key: 'collections:list',
      })

      collections.value = response ?? []
      return collections.value
    }
    finally {
      isPending.value = false
    }
  }

  async function createCollection(name: string) {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return null
    }

    isCreating.value = true

    try {
      const response = await executeRequest<CollectionDto>('/api/collections', {
        method: 'POST',
        body: { name: trimmedName },
      })

      if (!response) {
        return null
      }

      collections.value = [
        response,
        ...collections.value.filter(collection => collection.id !== response.id),
      ]

      return response
    }
    finally {
      isCreating.value = false
    }
  }

  async function addBookToCollection(collectionId: string, bookId: string) {
    isUpdating.value = true

    try {
      await executeRequest(`/api/collections/${collectionId}/books`, {
        method: 'POST',
        body: { bookId },
      })

      const target = collections.value.find(collection => collection.id === collectionId)

      if (target) {
        target.bookCount += 1
      }
    }
    finally {
      isUpdating.value = false
    }
  }

  async function removeBookFromCollection(collectionId: string, bookId: string) {
    isUpdating.value = true

    try {
      await executeRequest(`/api/collections/${collectionId}/books/${bookId}`, {
        method: 'DELETE',
      })

      const target = collections.value.find(collection => collection.id === collectionId)

      if (target && target.bookCount > 0) {
        target.bookCount -= 1
      }
    }
    finally {
      isUpdating.value = false
    }
  }

  return {
    collections,
    isPending,
    isCreating,
    isUpdating,
    fetchCollections,
    createCollection,
    addBookToCollection,
    removeBookFromCollection,
  }
})
