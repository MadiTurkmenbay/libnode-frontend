import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Static request-identity guard only; this does not mount Nuxt or test hydration.
// Real browser acceptance is documented in book-detail-hydration-smoke.md.
describe('book detail request identity (static guard)', () => {
  it('keys the initial book fetch by book ID independently of transport', () => {
    const source = readFileSync('pages/books/[id].vue', 'utf8')
    const initialBookFetch = source.match(/useApiFetch<BookDetailDto>\(([\s\S]*?)\n\)/)?.[1]

    expect(initialBookFetch).toBeDefined()
    expect(initialBookFetch).toContain('`/api/books/${bookId}`')
    expect(initialBookFetch).toContain('key: `book:${bookId}:detail`')
  })
})
