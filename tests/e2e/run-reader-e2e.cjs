'use strict'

// Standalone infrastructure runner, deliberately outside offline Vitest discovery.
// No session inspection, raw error output, screenshots, traces, video or HAR.
const { randomBytes, randomUUID } = require('node:crypto')
const { setTimeout: delay } = require('node:timers/promises')

class SafeFailure extends Error {
  constructor(code) { super('Reader check failed'); this.code = code }
}
function check(value, code = 'assertion') {
  if (!value) throw new SafeFailure(code)
}

function guard(env) {
  check(env.NODE_ENV === 'test' && env.TEST_READER_E2E === '1', 'opt_in')
  check(/^libnode-reader-e2e-[a-f0-9]{24}$/.test(env.TEST_READER_PROJECT ?? ''), 'project')
  for (const [key, expected] of [
    ['TEST_READER_WEB_URL', 'http://reader-e2e-web:3000'],
    ['TEST_READER_API_URL', 'http://reader-e2e-api:8080'],
  ]) {
    // Exact strings reject userinfo, query/fragment, path, trailing slash and aliases.
    check(env[key] === expected, 'endpoint')
  }
  check(env.TEST_READER_INGEST_KEY === 'placeholder-reader-e2e-ingest-key', 'fixture_key')
  const mode = env.READER_E2E_MODE ?? 'integration'
  check(['integration', 'failure-check'].includes(mode), 'mode')
  return { web: env.TEST_READER_WEB_URL, api: env.TEST_READER_API_URL, key: env.TEST_READER_INGEST_KEY, mode }
}

function selfCheck() {
  const valid = {
    NODE_ENV: 'test', TEST_READER_E2E: '1',
    TEST_READER_PROJECT: `libnode-reader-e2e-${'a'.repeat(24)}`,
    TEST_READER_WEB_URL: 'http://reader-e2e-web:3000',
    TEST_READER_API_URL: 'http://reader-e2e-api:8080',
    TEST_READER_INGEST_KEY: 'placeholder-reader-e2e-ingest-key',
  }
  guard(valid)
  guard({ ...valid, READER_E2E_MODE: 'failure-check' })
  const vectors = []
  for (const key of Object.keys(valid)) vectors.push({ ...valid, [key]: undefined })
  for (const [key, value] of [
    ['NODE_ENV', 'production'], ['TEST_READER_E2E', 'true'],
    ['TEST_READER_PROJECT', 'libnode-reader-e2e-short'], ['TEST_READER_PROJECT', 'live'],
    ['TEST_READER_INGEST_KEY', 'other'], ['READER_E2E_MODE', 'checks'], ['READER_E2E_MODE', 'arbitrary'],
  ]) vectors.push({ ...valid, [key]: value })
  for (const key of ['TEST_READER_WEB_URL', 'TEST_READER_API_URL']) {
    for (const value of ['https://wrong:3000', 'http://localhost:3000', 'http://api:8080',
      `${valid[key]}/`, `${valid[key]}/api`, `${valid[key]}?`, `${valid[key]}#`,
      `${valid[key]}?redirect=live`, `${valid[key]}#live`, valid[key].replace('http://', 'http://user:password@'),
      valid[key].replace(/:\d+$/, ':9999'), valid[key].replace(/:\d+$/, ''), 'not-a-url']) {
      vectors.push({ ...valid, [key]: value })
    }
  }
  for (const vector of vectors) {
    let rejected = false
    try { guard(vector) } catch (error) { rejected = error instanceof SafeFailure }
    check(rejected, 'guard_self_check')
  }
  console.log(`READER SUMMARY guard_positive=2 guard_negative=${vectors.length} network_calls=0 browser_launches=0`)
}

const inventory = {
  readiness: 'infra', fixtures: 'infra', anonymous_denial: 'api',
  registration_validation: 'ui', invalid_registration: 'api', primary_registration: 'ui',
  registration_conflicts: 'ui', wrong_password: 'ui', secondary_registration: 'ui',
  profile_conflict: 'ui', profile_ssr: 'ui', profile_renewal: 'ui', logout_denial: 'ui',
  relogin_persistence: 'ui', collection_create: 'ui', secondary_membership: 'ui',
  collection_add: 'ui', repeat_add_idempotency: 'api', foreign_ownership: 'api',
  collection_move: 'ui', collection_rename: 'ui', collection_remove: 'ui',
  collection_delete: 'ui', invalid_missing_collection: 'api', runtime_clean: 'ui',
}
const completed = new Set()
let active = 'guard'
let kind = 'infra'
let point = 'start'
async function scenario(id, action) {
  check(Object.hasOwn(inventory, id) && !completed.has(id), 'inventory')
  active = id
  kind = inventory[id]
  point = 'start'
  await action()
  completed.add(id)
  console.log(`READER PASS ${id} kind=${kind}`)
}

async function run(settings) {
  let browser
  const contexts = []
  let pageErrors = 0
  const tag = randomBytes(6).toString('hex')
  const a = { username: `reader_a_${tag}`, email: `a_${tag}@example.test`, password: `Fixture_${tag}!` }
  const b = { username: `reader_b_${tag}`, email: `b_${tag}@example.test`, password: `Fixture_${tag}!` }
  const renamed = `reader_updated_${tag}`
  const names = { a: `Folder A ${tag}`, b: `Folder B ${tag}`, renamed: `Renamed ${tag}`, other: `Other ${tag}` }
  const bookTitle = `Reader fixture ${tag}`
  let bookId, collectionA, collectionB, otherCollection

  const userKeys = ['email', 'id', 'role', 'username']
  const profileKeys = [...userKeys, 'avatarUrl', 'avatarThumbUrl', 'bio', 'createdAt'].sort()
  async function keysOnly(response, expected) {
    check(JSON.stringify(Object.keys(await response.json()).sort()) === JSON.stringify([...expected].sort()), 'response_keys')
  }
  async function api(context, path, method = 'GET', data, status = 200) {
    const response = await context.request.fetch(`${settings.web}${path}`, {
      method, ...(data === undefined ? {} : { data }), timeout: 15000,
    })
    check(response.status() === status, 'http_status')
    return response
  }
  async function visible(locator) { await locator.waitFor({ state: 'visible' }) }
  async function hydrated(page) {
    await page.waitForFunction(() => {
      const app = document.getElementById('__nuxt')?.__vue_app__
      return app?.config?.globalProperties?.$nuxt?.isHydrating === false
    }, null, { timeout: 30000 })
  }
  async function goto(page, path) {
    const response = await page.goto(`${settings.web}${path}`, { waitUntil: 'domcontentloaded' })
    check(response?.status() === 200, 'document_status')
    await hydrated(page)
    return response
  }
  async function fresh() {
    const context = await browser.newContext({ baseURL: settings.web, viewport: { width: 1280, height: 900 } })
    context.setDefaultTimeout(15000)
    const page = await context.newPage()
    page.on('pageerror', () => { pageErrors += 1 })
    contexts.push(context)
    return { context, page }
  }
  async function authForm(page, user, register) {
    await goto(page, register ? '/register' : '/login')
    const dialog = page.getByRole('dialog')
    await visible(dialog)
    if (register) {
      await dialog.getByLabel('Имя пользователя', { exact: true }).fill(user.username)
      await dialog.getByLabel('Повторите пароль', { exact: true }).fill(user.confirm ?? user.password)
    }
    await dialog.getByLabel('Email', { exact: true }).fill(user.email)
    await dialog.getByLabel('Пароль', { exact: true }).fill(user.password)
    return dialog
  }
  async function submitAuth(page, user, register, expected = 200) {
    const dialog = await authForm(page, user, register)
    const path = register ? '/api/auth/register' : '/api/auth/login'
    const pending = page.waitForResponse(r => new URL(r.url()).pathname === path && r.request().method() === 'POST')
    await dialog.getByRole('button', { name: register ? 'Зарегистрироваться' : 'Войти', exact: true }).click()
    const response = await pending
    check(response.status() === expected, 'auth_status')
    if (expected === 200) {
      await keysOnly(response, userKeys)
      await page.waitForURL(`${settings.web}/`)
      await hydrated(page)
      await keysOnly(await api(page.context(), '/api/me'), profileKeys)
    } else {
      await visible(dialog.getByRole('alert'))
      const message = await dialog.getByRole('alert').textContent()
      check(typeof message === 'string' && /Пользователь с таким email или именем уже существует|Не удалось создать аккаунт|Не удалось войти|Неверный email или пароль/.test(message), 'auth_error_feedback')
    }
  }
  async function profile(page, name) {
    const response = await goto(page, '/profile')
    const html = await response.text()
    const headings = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/g) ?? []
    check(headings.some(h => h.replace(/<[^>]*>/g, '').trim() === name), 'ssr_heading')
    await visible(page.getByRole('heading', { name, exact: true, level: 1 }))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await hydrated(page)
    await visible(page.getByRole('heading', { name, exact: true, level: 1 }))
  }
  async function updateProfile(page, name, status = 200) {
    point = 'profile_document'
    await goto(page, '/profile?tab=settings')
    point = 'profile_form'
    const form = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Профиль', exact: true }) })
    // Existing profile labels have no for/id. Scope to the actual profile form.
    await form.locator('input[type="text"]').fill(name)
    point = 'profile_submit'
    const pending = page.waitForResponse(r => new URL(r.url()).pathname === '/api/me' && r.request().method() === 'PUT')
    await form.getByRole('button', { name: 'Сохранить', exact: true }).click()
    point = 'profile_response'
    const response = await pending
    check(response.status() === status, 'profile_status')
    if (status === 200) {
      await keysOnly(response, userKeys)
      await visible(page.getByRole('heading', { name, exact: true, level: 1 }))
    } else {
      point = 'profile_feedback'
      await visible(page.locator('[data-sonner-toast]').filter({ hasText: /Не удалось сохранить профиль|Пользователь с таким email или именем уже существует/ }).first())
    }
  }
  async function createCollection(page, name) {
    await goto(page, '/profile/collections')
    await page.getByPlaceholder('Новая папка…', { exact: true }).fill(name)
    const pending = page.waitForResponse(r => new URL(r.url()).pathname === '/api/collections' && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Создать', exact: true }).click()
    const response = await pending
    check(response.status() === 201, 'collection_create_status')
    const id = (await response.json()).id
    check(typeof id === 'string', 'fixture_identity')
    await visible(page.locator(`a[href="/profile/collections/${id}"]`).filter({ hasText: name }))
    return id
  }
  async function bookMembership(page, current, target) {
    await goto(page, `/books/${bookId}`)
    await visible(page.getByRole('heading', { name: bookTitle, level: 1, exact: true }))
    await page.getByRole('button', { name: current ?? 'В закладки', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Закладки', exact: true })
    await visible(dialog)
    const row = dialog.getByRole('button').filter({ hasText: target })
    const pending = page.waitForResponse(r => new URL(r.url()).pathname.endsWith('/collection-status'))
    await row.click()
    check((await pending).status() === (current === target ? 204 : 200), 'collection_status')
    await row.waitFor({ state: 'visible' })
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    await visible(page.getByRole('button', { name: current === target ? 'В закладки' : target, exact: true }))
  }
  async function membership(context, id, name, expected) {
    const detail = await (await api(context, `/api/collections/${id}`)).json()
    check(detail.name === name && detail.bookCount === expected && detail.books.length === expected, 'membership_count')
    check(detail.books.every(book => book.id === bookId), 'membership_book')
    const ids = await (await api(context, `/api/collections/containing-book/${bookId}`)).json()
    check(ids.length === expected && (expected === 0 || ids[0] === id), 'membership_exclusive')
    const status = await api(context, `/api/books/${bookId}/collection-status`, 'GET', undefined, expected ? 200 : 204)
    if (expected) {
      const value = await status.json()
      check(value.collectionId === id && value.collectionName === name, 'membership_name')
    }
  }
  async function primaryState(context, target, targetName) {
    const list = await (await api(context, '/api/collections')).json()
    check(list.length === 2, 'collection_list_count')
    check(list.find(c => c.id === collectionA)?.bookCount === (target === collectionA ? 1 : 0), 'source_count')
    check(list.find(c => c.id === collectionB)?.bookCount === (target === collectionB ? 1 : 0), 'target_count')
    if (target) await membership(context, target, targetName, 1)
    else await membership(context, collectionA, names.a, 0)
  }
  async function detailSsr(page, id, name, count) {
    const response = await goto(page, `/profile/collections/${id}`)
    const html = await response.text()
    check((html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/g) ?? []).some(h => h.replace(/<[^>]*>/g, '').trim() === name), 'collection_ssr')
    check(html.replace(/<[^>]*>/g, '').includes(`Книг: ${count}`), 'collection_ssr_count')
    await visible(page.getByRole('heading', { name, level: 1, exact: true }))
    check(await page.locator(`a[href="/books/${bookId}"]`).count() === count, 'collection_ui_books')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await hydrated(page)
    await visible(page.getByRole('heading', { name, level: 1, exact: true }))
    check(await page.locator(`a[href="/books/${bookId}"]`).count() === count, 'collection_reload_books')
  }
  async function bookSsr(page, name) {
    const response = await goto(page, `/books/${bookId}`)
    const html = await response.text()
    const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? []
    check(buttons.some(button => button.replace(/<[^>]*>/g, '').trim() === name), 'book_status_ssr')
    await visible(page.getByRole('button', { name, exact: true }))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await hydrated(page)
    await visible(page.getByRole('button', { name, exact: true }))
  }
  async function listUi(page, aCount, bName, bCount) {
    await goto(page, '/profile/collections')
    const source = page.locator(`a[href="/profile/collections/${collectionA}"]`)
    await visible(source)
    check((await source.textContent()).includes(`${aCount} книг`), 'list_ui_count')
    const target = page.locator(`a[href="/profile/collections/${collectionB}"]`)
    if (bName === null) check(await target.count() === 0, 'list_ui_deleted')
    else {
      await visible(target)
      const text = await target.textContent()
      check(text.includes(bName) && text.includes(`${bCount} книг`), 'list_ui_count')
    }
  }

  try {
    await scenario('readiness', async () => {
      const deadline = Date.now() + 60000
      for (;;) {
        try {
          const [backend, web] = await Promise.all([
            fetch(`${settings.api}/api/books?limit=1`, { signal: AbortSignal.timeout(5000) }),
            fetch(`${settings.web}/api/books?limit=1`, { signal: AbortSignal.timeout(5000) }),
          ])
          if (backend.status === 200 && web.status === 200) break
        } catch { /* bounded readiness, not assertion retries */ }
        check(Date.now() < deadline, 'readiness_timeout')
        await delay(500)
      }
    })
    await scenario('fixtures', async () => {
      const payload = await fetch(`${settings.api}/api/reader/titles`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': settings.key },
        body: JSON.stringify({ title: bookTitle, slug: `reader-fixture-${tag}`, description: 'Synthetic fixture.', language: 'en' }),
        signal: AbortSignal.timeout(15000),
      })
      check(payload.status === 201, 'fixture_title')
      bookId = (await payload.json()).id
      const chapter = await fetch(`${settings.api}/api/reader/chapters`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': settings.key },
        body: JSON.stringify({ readerTitleId: bookId, chapterNumber: 1, title: 'Fixture chapter', body: 'Synthetic chapter text.' }),
        signal: AbortSignal.timeout(15000),
      })
      check(chapter.status === 201, 'fixture_chapter')
      const catalog = await fetch(`${settings.api}/api/books?limit=10`, { signal: AbortSignal.timeout(15000) })
      check(catalog.status === 200 && (await catalog.json()).items.some(book => book.id === bookId), 'fixture_catalog')
    })
    if (settings.mode === 'failure-check') {
      console.log('READER EXPECTED_FAILURE post_fixture_exit=42')
      return 42
    }

    // Import/launch only after all environment guards; no translator app imports.
    const { chromium } = require('playwright')
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    const primary = await fresh()
    const secondary = await fresh()
    const anonymous = await fresh()
    const control = await fresh()
    const { page: pageA, context: ctxA } = primary
    const { page: pageB, context: ctxB } = secondary
    await scenario('anonymous_denial', async () => {
      await api(anonymous.context, '/api/me', 'GET', undefined, 401)
      await api(anonymous.context, '/api/collections', 'GET', undefined, 401)
      await goto(anonymous.page, '/profile/collections')
      check(new URL(anonymous.page.url()).pathname === '/login', 'protected_redirect')
    })
    await scenario('registration_validation', async () => {
      for (const [password, confirm, message] of [
        [a.password, 'mismatch', 'Пароли не совпадают'], ['short', 'short', 'Пароль должен быть не менее 6 символов'],
      ]) {
        const dialog = await authForm(anonymous.page, { ...a, password, confirm }, true)
        await dialog.getByRole('button', { name: 'Зарегистрироваться', exact: true }).click()
        await visible(dialog.getByRole('alert').filter({ hasText: message }))
        await api(anonymous.context, '/api/me', 'GET', undefined, 401)
      }
    })
    await scenario('invalid_registration', async () => {
      await api(anonymous.context, '/api/auth/register', 'POST', { username: '', email: 'invalid', password: 'x' }, 400)
    })
    await scenario('primary_registration', () => submitAuth(pageA, a, true))
    await scenario('registration_conflicts', async () => {
      await submitAuth(anonymous.page, { ...b, username: a.username }, true, 409)
      await submitAuth(anonymous.page, { ...b, email: a.email }, true, 409)
      await api(anonymous.context, '/api/me', 'GET', undefined, 401)
    })
    await scenario('wrong_password', async () => {
      await submitAuth(anonymous.page, { ...a, password: 'WrongFixturePassword!' }, false, 401)
      await api(anonymous.context, '/api/me', 'GET', undefined, 401)
    })
    await scenario('secondary_registration', () => submitAuth(pageB, b, true))
    await scenario('profile_conflict', async () => {
      await updateProfile(pageB, a.username, 409)
      check((await (await api(ctxB, '/api/me')).json()).username === b.username, 'profile_unchanged')
    })
    await scenario('profile_ssr', async () => {
      await profile(pageA, a.username)
      const extra = await ctxA.newPage()
      extra.on('pageerror', () => { pageErrors += 1 })
      await profile(extra, a.username)
      await extra.close()
    })
    await scenario('profile_renewal', async () => {
      await submitAuth(control.page, a, false)
      const t0 = performance.now()
      await submitAuth(pageA, a, false)
      await delay(Math.max(0, 40000 - (performance.now() - t0)))
      check(performance.now() - t0 < 50000, 'renewal_time_budget')
      await updateProfile(pageA, renamed)
      check((await (await api(ctxA, '/api/me')).json()).username === renamed, 'profile_persisted')
      await profile(pageA, renamed)
      await delay(Math.max(0, 65000 - (performance.now() - t0)))
      await api(control.context, '/api/me', 'GET', undefined, 401)
      await api(ctxA, '/api/me')
      await profile(pageA, renamed)
    })
    await scenario('logout_denial', async () => {
      const pending = pageA.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/logout')
      await pageA.getByRole('button', { name: 'Выйти', exact: true }).click()
      check((await pending).status() === 200, 'logout_status')
      await pageA.waitForURL(`${settings.web}/`)
      for (const [path, method, data] of [
        ['/api/me', 'GET'], ['/api/collections', 'GET'],
        ['/api/me', 'PUT', { username: renamed, email: a.email }],
        ['/api/collections', 'POST', { name: 'Denied' }],
      ]) await api(ctxA, path, method, data, 401)
      await goto(pageA, '/profile')
      check(new URL(pageA.url()).pathname === '/login', 'protected_redirect')
    })
    await scenario('relogin_persistence', async () => {
      await submitAuth(pageA, a, false)
      await profile(pageA, renamed)
      // Deterministic boundary for collection cases, not inside renewal assertions.
      await submitAuth(pageB, b, false)
    })
    await scenario('collection_create', async () => {
      collectionA = await createCollection(pageA, names.a)
      collectionB = await createCollection(pageA, names.b)
      await primaryState(ctxA, null)
      await listUi(pageA, 0, names.b, 0)
    })
    await scenario('secondary_membership', async () => {
      otherCollection = await createCollection(pageB, names.other)
      await bookMembership(pageB, null, names.other)
      await membership(ctxB, otherCollection, names.other, 1)
    })
    await scenario('collection_add', async () => {
      await bookMembership(pageA, null, names.a)
      await primaryState(ctxA, collectionA, names.a)
      await membership(ctxB, otherCollection, names.other, 1)
    })
    await scenario('repeat_add_idempotency', async () => {
      for (let i = 0; i < 2; i += 1) await api(ctxA, `/api/collections/${collectionA}/books`, 'POST', { bookId })
      await primaryState(ctxA, collectionA, names.a)
    })
    await scenario('foreign_ownership', async () => {
      await api(ctxB, `/api/collections/${collectionA}`, 'GET', undefined, 404)
      await api(ctxB, `/api/collections/${collectionA}/books`, 'POST', { bookId }, 403)
      await api(ctxB, `/api/collections/${collectionA}/books/${bookId}`, 'DELETE', undefined, 403)
      await api(ctxB, `/api/collections/${collectionA}`, 'PUT', { name: 'Denied' }, 403)
      await api(ctxB, `/api/collections/${collectionA}`, 'DELETE', undefined, 403)
      const own = await (await api(ctxB, '/api/collections')).json()
      check(own.length === 1 && own[0].id === otherCollection, 'foreign_list')
      await goto(pageB, '/profile/collections')
      check(await pageB.locator(`a[href="/profile/collections/${collectionA}"]`).count() === 0, 'foreign_ui')
      await primaryState(ctxA, collectionA, names.a)
    })
    await scenario('collection_move', async () => {
      await bookMembership(pageA, names.a, names.b)
      await primaryState(ctxA, collectionB, names.b)
      await listUi(pageA, 0, names.b, 1)
      await detailSsr(pageA, collectionA, names.a, 0)
      await detailSsr(pageA, collectionB, names.b, 1)
      await bookSsr(pageA, names.b)
      await membership(ctxB, otherCollection, names.other, 1)
    })
    await scenario('collection_rename', async () => {
      await goto(pageA, `/profile/collections/${collectionB}`)
      await visible(pageA.getByLabel('Название папки', { exact: true }))
      await pageA.setViewportSize({ width: 390, height: 844 })
      await pageA.getByLabel('Название папки', { exact: true }).fill(names.renamed)
      const pending = pageA.waitForResponse(r => new URL(r.url()).pathname === `/api/collections/${collectionB}` && r.request().method() === 'PUT')
      await pageA.getByRole('button', { name: 'Сохранить название', exact: true }).click()
      check((await pending).status() === 200, 'rename_status')
      await visible(pageA.getByRole('heading', { name: names.renamed, exact: true, level: 1 }))
      check(await pageA.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'mobile_overflow')
      await primaryState(ctxA, collectionB, names.renamed)
      await detailSsr(pageA, collectionB, names.renamed, 1)
      await pageA.setViewportSize({ width: 1280, height: 900 })
      await bookSsr(pageA, names.renamed)
      await membership(ctxB, otherCollection, names.other, 1)
    })
    await scenario('collection_remove', async () => {
      await bookMembership(pageA, names.renamed, names.renamed)
      await primaryState(ctxA, null)
      await detailSsr(pageA, collectionB, names.renamed, 0)
      await bookSsr(pageA, 'В закладки')
      await listUi(pageA, 0, names.renamed, 0)
      await membership(ctxB, otherCollection, names.other, 1)
    })
    await scenario('collection_delete', async () => {
      await bookMembership(pageA, null, names.renamed)
      await goto(pageA, `/profile/collections/${collectionB}`)
      await pageA.setViewportSize({ width: 390, height: 844 })
      await pageA.getByRole('button', { name: 'Удалить папку', exact: true }).click()
      const dialog = pageA.getByRole('dialog', { name: 'Удалить папку?', exact: true })
      await visible(dialog)
      const pending = pageA.waitForResponse(r => new URL(r.url()).pathname === `/api/collections/${collectionB}` && r.request().method() === 'DELETE')
      await dialog.getByRole('button', { name: 'Удалить', exact: true }).click()
      check((await pending).status() === 204, 'delete_status')
      await pageA.waitForURL(`${settings.web}/profile/collections`)
      await hydrated(pageA)
      await api(ctxA, `/api/collections/${collectionB}`, 'GET', undefined, 404)
      await membership(ctxA, collectionA, names.a, 0)
      const remaining = await (await api(ctxA, '/api/collections')).json()
      check(remaining.length === 1 && remaining[0].id === collectionA, 'delete_scope')
      await listUi(pageA, 0, null, 0)
      await api(ctxA, `/api/books/${bookId}`)
      await membership(ctxB, otherCollection, names.other, 1)
      await detailSsr(pageB, otherCollection, names.other, 1)
    })
    await scenario('invalid_missing_collection', async () => {
      for (const name of ['', '   ', 'x'.repeat(151)]) await api(ctxA, `/api/collections/${collectionA}`, 'PUT', { name }, 400)
      const missing = randomUUID()
      await api(ctxA, `/api/collections/${missing}`, 'PUT', { name: 'Missing' }, 404)
      await api(ctxA, `/api/collections/${missing}`, 'DELETE', undefined, 404)
      await membership(ctxA, collectionA, names.a, 0)
      await membership(ctxB, otherCollection, names.other, 1)
    })
    await scenario('runtime_clean', async () => {
      check(pageErrors === 0, 'browser_runtime')
    })
    check(completed.size === Object.keys(inventory).length, 'inventory')
    const counts = { ui: 0, api: 0, infra: 0 }
    for (const id of completed) counts[inventory[id]] += 1
    console.log(`READER SUMMARY ui=${counts.ui} api=${counts.api} infra=${counts.infra} skipped=0 page_errors=${pageErrors}`)
    return 0
  } finally {
    const results = await Promise.allSettled(contexts.map(context => context.close()))
    if (browser) await browser.close()
    check(results.every(result => result.status === 'fulfilled'), 'browser_cleanup')
  }
}

async function main() {
  try {
    check(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--self-check'), 'arguments')
    if (process.argv[2] === '--self-check') { selfCheck(); return 0 }
    return await run(guard(process.env))
  } catch (error) {
    // Codes are developer-authored static literals, never Playwright/API messages.
    const classification = error instanceof SafeFailure ? error.code : error?.name === 'TimeoutError' ? 'timeout' : 'unexpected'
    console.log(`READER FAIL ${active} kind=${kind} class=${classification} point=${point}`)
    console.log(`READER SUMMARY completed=${completed.size} failed=1`)
    return 1
  }
}

if (require.main === module) main().then(code => { process.exitCode = code })
module.exports = { guard, selfCheck }
