import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Static guard only. The disposable browser suite checks actual raw SSR HTML.
describe('initial book collection status (static SSR guard)', () => {
  it('copies the awaited status without relying on an SSR watcher rerun', () => {
    const source = readFileSync('pages/books/[id].vue', 'utf8')
    const initialStatus = source.match(/if \(isAuthenticated\.value\) \{([\s\S]*?)\n\}/)?.[1]
    expect(initialStatus).toContain('await fetchCollectionStatus()')
    expect(initialStatus).toContain('currentCollectionStatus.value = fetchedCollectionStatus.value ?? null')
  })
})
