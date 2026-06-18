import type { ChapterDetailDto } from '~/types'

const DB_NAME = 'libnode-offline'
const STORE = 'chapters'
const MAX_ENTRIES = 50
const DB_VERSION = 1

interface CachedChapter extends ChapterDetailDto {
  cachedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('cachedAt', 'cachedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export function useOfflineCache() {
  const isClient = typeof indexedDB !== 'undefined'

  async function cacheChapter(chapter: ChapterDetailDto): Promise<void> {
    if (!isClient) return
    try {
      const db = await openDb()
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const record: CachedChapter = { ...chapter, cachedAt: Date.now() }
      store.put(record)
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
      evictOldEntries()
    } catch {
      // best-effort
    }
  }

  async function evictOldEntries(): Promise<void> {
    if (!isClient) return
    try {
      const db = await openDb()
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const countReq = store.count()
      await new Promise<void>((resolve, reject) => {
        countReq.onsuccess = () => resolve()
        countReq.onerror = () => reject(countReq.error)
      })
      const count = countReq.result
      if (count <= MAX_ENTRIES) return
      const idx = store.index('cachedAt')
      const cursorReq = idx.openCursor()
      let toDelete = count - MAX_ENTRIES
      await new Promise<void>((resolve, reject) => {
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result
          if (cursor && toDelete > 0) {
            store.delete(cursor.primaryKey)
            toDelete--
            cursor.continue()
          } else {
            resolve()
          }
        }
        cursorReq.onerror = () => reject(cursorReq.error)
      })
    } catch {
      // best-effort
    }
  }

  async function getCachedChapter(chapterId: string): Promise<ChapterDetailDto | null> {
    if (!isClient) return null
    try {
      const db = await openDb()
      const tx = db.transaction(STORE, 'readonly')
      const store = tx.objectStore(STORE)
      const req = store.get(chapterId)
      const result = await new Promise<CachedChapter | undefined>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result as CachedChapter | undefined)
        req.onerror = () => reject(req.error)
      })
      if (!result) return null
      const { cachedAt: _cachedAt, ...chapter } = result
      return chapter as ChapterDetailDto
    } catch {
      return null
    }
  }

  async function clearCache(): Promise<void> {
    if (!isClient) return
    try {
      const db = await openDb()
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // best-effort
    }
  }

  return { cacheChapter, getCachedChapter, clearCache }
}
