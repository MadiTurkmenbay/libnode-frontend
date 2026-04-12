import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CollectionDto } from '~/types'

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<CollectionDto[]>([])
  const isPending = ref(false)
  const isCreating = ref(false)

  const apiFetch = async <T>(endpoint: string, options: any = {}) => {
    const config = useRuntimeConfig()
    const baseURL = import.meta.client && config.public.apiBaseClient
      ? config.public.apiBaseClient as string
      : config.public.apiBase as string
    
    const token = useCookie('auth_token')
    const headers: Record<string, string> = { ...options.headers }
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    return $fetch<T>(endpoint, {
      baseURL,
      ...options,
      headers
    })
  }

  async function fetchCollections() {
    isPending.value = true
    try {
      const response = await apiFetch<CollectionDto[]>('/api/collections')
      collections.value = response || []
    } catch (e) {
      console.error('Failed to fetch collections', e)
    } finally {
      isPending.value = false
    }
  }

  async function createCollection(name: string): Promise<CollectionDto | null> {
    isCreating.value = true
    try {
      const response = await apiFetch<CollectionDto>('/api/collections', {
        method: 'POST',
        body: { name }
      })
      collections.value.unshift(response)
      return response
    } catch (e) {
      console.error('Failed to create collection', e)
      return null
    } finally {
      isCreating.value = false
    }
  }

  async function addBookToCollection(collectionId: string, bookId: string) {
    try {
      await apiFetch(`/api/collections/${collectionId}/books`, {
        method: 'POST',
        body: { bookId }
      })
      
      const target = collections.value.find(c => c.id === collectionId)
      if (target) target.bookCount++
    } catch (e) {
      console.error('Failed to add book to collection', e)
      throw e
    }
  }

  async function removeBookFromCollection(collectionId: string, bookId: string) {
    try {
      await apiFetch(`/api/collections/${collectionId}/books/${bookId}`, {
        method: 'DELETE'
      })
      
      const target = collections.value.find(c => c.id === collectionId)
      if (target && target.bookCount > 0) target.bookCount--
    } catch (e) {
      console.error('Failed to remove book from collection', e)
      throw e
    }
  }

  return {
    collections,
    isPending,
    isCreating,
    fetchCollections,
    createCollection,
    addBookToCollection,
    removeBookFromCollection
  }
})
