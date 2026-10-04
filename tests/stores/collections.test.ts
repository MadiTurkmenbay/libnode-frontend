import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { useCollectionsStore } from '~/stores/collections'

const request = vi.fn()
const before = { id: 'fixture', name: 'Before', bookCount: 1, createdAt: '2026-01-01T00:00:00Z' }
const after = { ...before, name: 'After' }

beforeEach(() => {
  setActivePinia(createPinia())
  request.mockReset()
  vi.stubGlobal('useAuth', () => ({ isAuthenticated: ref(true) }))
  vi.stubGlobal('executeApiRequest', request)
})
afterEach(() => vi.unstubAllGlobals())

describe('collection rename/delete authoritative state', () => {
  it('trims a rename and force-refreshes the existing cached list', async () => {
    const store = useCollectionsStore()
    store.collections = [before]
    request.mockResolvedValueOnce(after).mockResolvedValueOnce([after])
    expect(await store.renameCollection(before.id, ' After ')).toEqual(after)
    expect(request.mock.calls).toEqual([
      ['/api/collections/fixture', { method: 'PUT', body: { name: 'After' } }],
      ['/api/collections', { key: 'collections:list' }],
    ])
    expect(store.collections).toEqual([after])
    expect(store.isUpdating).toBe(false)
  })

  it('refreshes the list after delete without inventing local counts', async () => {
    const store = useCollectionsStore()
    store.collections = [before]
    request.mockResolvedValueOnce(null).mockResolvedValueOnce([])
    await store.deleteCollection(before.id)
    expect(request.mock.calls).toEqual([
      ['/api/collections/fixture', { method: 'DELETE' }],
      ['/api/collections', { key: 'collections:list' }],
    ])
    expect(store.collections).toEqual([])
    expect(store.isUpdating).toBe(false)
  })

  it('keeps authoritative cached data and clears pending on failure', async () => {
    const store = useCollectionsStore()
    store.collections = [before]
    request.mockRejectedValueOnce(new Error('Synthetic failure'))
    await expect(store.deleteCollection(before.id)).rejects.toThrow('Synthetic failure')
    expect(store.collections).toEqual([before])
    expect(store.isUpdating).toBe(false)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('does not submit an empty rename', async () => {
    expect(await useCollectionsStore().renameCollection(before.id, '  ')).toBeNull()
    expect(request).not.toHaveBeenCalled()
  })
})
