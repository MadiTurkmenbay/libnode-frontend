# AI_INSTRUCTIONS — libnode frontend

## Контекст
Этот репозиторий — Nuxt 3 frontend LibNode. В текущем workspace он физически расположен в папке `libnode-frontend`. Архитектура построена вокруг SSR, cookie-based auth, единого API-слоя, Pinia для глобального доменного состояния и UI-примитивов `shadcn-nuxt`/`reka-ui`/`radix-vue`.

## Workspace Guardrails

- Read `/home/qustust/projects/libnodeProject/AGENTS.md` before this file.
- The frontend repo path is `/home/qustust/projects/libnodeProject/libnode-frontend`; never create or use a misspelled duplicate frontend path.
- Before editing or committing on user request, run `git status --short`, `git diff`, and `git diff --staged` from `libnode-frontend/`.
- Use Docker-first acceptance through `../libnode-deployer/` for cross-service verification. Frontend host commands are iteration aids only.
- Do not read, print, or commit real `.env*`, `.nuxt/`, `.output/`, `node_modules/`, Playwright auth state, browser profiles, test results, coverage, or logs.
- Do not change auth cookie behavior, route guards, catalog cursor behavior, reader navigation, or DTO contracts as part of Phase 1 workspace guidance.

## Базовая архитектура

### Распределение ответственности

- [CRITICAL] `pages/` отвечают за маршруты, SSR-загрузку данных, SEO/head и композицию экранов. Не превращай page-компоненты в свалку повторно используемой доменной логики.
- [CRITICAL] `components/` содержат доменные переиспользуемые компоненты (`BookCard`, `CollectionModal`, `ReaderSettings`, `SiteHeader`). Если блок повторяется или перегружает страницу — вынеси его.
- [CRITICAL] `components/ui/` — только базовые UI-примитивы и thin wrappers над `shadcn`/`reka-ui`/`radix-vue`. Бизнес-логике там не место.
- [CRITICAL] `composables/` — место для общего клиентского поведения: API, auth, toast, reader preferences.
- [CRITICAL] `stores/` — место для глобального кэшируемого доменного состояния, которое живёт между страницами.
- [MANDATORY] `middleware/` — единственный нормальный способ защиты маршрутов на уровне frontend.
- [MANDATORY] `types/index.ts` — зеркало backend DTO. Никаких "упрощённых локальных версий" контрактов.

## API-слой

### useApiFetch — обязательный единый вход

- [CRITICAL] Все запросы к backend выполняются только через `useApiFetch`, `executeApiRequest` или тонкие обёртки над ними вроде `useApiMutation`.
- [FORBIDDEN] Использовать в pages/components/stores сырой `useFetch`, `$fetch`, `fetch`, `axios` или любой другой параллельный HTTP-клиент для backend API.
- [MANDATORY] Для SSR-совместимой первичной загрузки данных используй `await useApiFetch(...)`.
- [MANDATORY] Для императивных мутаций, optimistic updates, `load more` и ручного запуска используй `executeApiRequest(...)`.
- [MANDATORY] Заголовок `Authorization` НЕ добавляется на клиенте. Браузер ходит на same-origin Nuxt-прокси (`/api/...`), а серверный catch-all подставляет `Authorization: Bearer` из HttpOnly cookie. На SSR `useApiFetch` форвардит Authorization сам. Компоненты и страницы Authorization не трогают.
- [MANDATORY] Браузерные запросы идут на same-origin (пустой baseURL). Серверный базовый URL backend берётся только из `runtimeConfig.public.apiBase`. `apiBaseClient` удалён — не возвращай его.

## Управление состоянием

### Один источник истины на один тип данных

- [CRITICAL] Глобальное доменное состояние хранится в Pinia. Для коллекций источником истины является `stores/collections.ts`.
- [FORBIDDEN] Дублировать store-backed данные в нескольких страницах/компонентах отдельными несвязанными `ref`, если уже существует Pinia-store.
- [MANDATORY] Если данные нужны между маршрутами, переживают навигацию или должны кэшироваться — выноси их в store.
- [MANDATORY] `useState` разрешён для небольшого SSR-safe application/session state, как в `useAuth`.
- [MANDATORY] Локальные `ref` допустимы только для ephemeral UI-state: модалки, поля формы, pending-флаги, локальные optimistic-флаги.
- [FORBIDDEN] Вводить второй глобальный state manager, event bus или самодельные singleton-объекты для данных, которые уже решает Pinia/Nuxt state.

## SSR, auth и cookies

### BFF auth — HttpOnly cookie + Nuxt-прокси (M-4)

- [CRITICAL] JWT хранится ТОЛЬКО в HttpOnly cookie `auth_token`, которую ставит Nuxt-сервер. Браузерный JS не имеет доступа к токену — это защита от кражи токена через XSS. Не выставляй и не читай токен через `useCookie` в клиентском коде и не возвращай сырой токен в браузер.
- [CRITICAL] Cookie ставят/чистят только серверные BFF-роуты через общий хелпер `server/utils/authCookie.ts` (`setAuthCookie`/`clearAuthCookie`). `login.post.ts`, `register.post.ts` и `me.put.ts` могут получить `{ token, user }` от backend, но клиенту возвращают только `user`; `me.get.ts` явно проксирует профиль, потому что concrete Nitro route `/api/me` перекрывает catch-all; `logout.post.ts` удаляет cookie.
- [CRITICAL] Браузер обращается к backend только через same-origin Nuxt-прокси (относительный `/api/...`). Catch-all `server/api/[...path].ts` читает HttpOnly cookie через `getCookie` и подставляет `Authorization: Bearer`. Никогда не добавляй Authorization на клиенте и не используй `apiBaseClient` в браузере.
- [CRITICAL] Флаги cookie: `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`, `secure` — условный на HTTPS (через `x-forwarded-proto`/протокол запроса), чтобы localhost HTTP dev не ломался.
- [MANDATORY] `useApiFetch` для SSR ходит напрямую в backend (`apiBase`) и форвардит Authorization из `useCookie('auth_token')` (HttpOnly cookie читается на сервере). Для браузера baseURL пустой → same-origin прокси.
- [FORBIDDEN] Хранить auth token, user session, роли или серверные доменные данные в `localStorage`/`sessionStorage`.
- [MANDATORY] Route guard'ы строятся через `definePageMeta({ middleware: [...] })` и middleware-файлы `auth.ts` / `admin.ts`.
- [MANDATORY] Узкое исключение для `localStorage` допустимо только для чисто клиентских необязательных preferences без security и SSR-критичности, как `useReaderSettings`. Это исключение нельзя расширять на auth, кэш API, роли, bookmarks, профили и другую доменную модель.

### Auth state и JWT UX

- [CRITICAL] Клиент знает только `user` в `useState('auth_user')`. Никакого клиентского парсинга JWT — токен недоступен из JS. `isAuthenticated`/`isAdmin` строятся на `user`/`user.role`.
- [CRITICAL] Состояние авторизации восстанавливается на SSR плагином `plugins/auth-session.server.ts`, который вызывает `useAuth().fetchSession()` → запрос `/api/me` через прокси (валидность HttpOnly cookie). Не воссоздавай auth-state из токена на клиенте.
- [MANDATORY] `middleware/auth.ts`/`admin.ts` опираются на `auth_user` (UX-граница). Backend остаётся источником истины и сам проверяет авторизацию/роль на каждом API-запросе. Не вводи signature-less доверие к роли как security-границу.
- [MANDATORY] При 401 от прокси клиент должен сбросить пользователя (`useAuth().clearAuth()`) и редиректить на `/login`, чтобы не показывать сломанный авторизованный UI.
- [MANDATORY] Исключение допускается только для фоновых best-effort запросов, которые не являются источником auth-state (например, notification polling fallback): они могут передавать `handleUnauthorized: false` и обязаны локально игнорировать ошибку, не меняя session state.
- [MANDATORY] `logout()` дёргает `/api/auth/logout`, который полностью удаляет cookie с тем же `path: '/'`.

## Компоненты и UI

### Никаких God Components

- [CRITICAL] Если компонент одновременно грузит данные, хранит глобальное состояние, рисует большой layout и содержит сложную доменную логику, он уже слишком большой. Делить обязательно.
- [MANDATORY] Используй паттерн существующего кода: page-компонент собирает экран, доменные компоненты инкапсулируют повторяющиеся куски интерфейса.
- [MANDATORY] Для диалогов, поповеров, кнопок, input и прочих базовых примитивов переиспользуй `components/ui/*`.
- [FORBIDDEN] Встраивать самодельные модалки/поповеры/контролы, если в `components/ui` уже есть подходящий primitive.
- [FORBIDDEN] Смешивать доменную бизнес-логику с `components/ui`.

## Пагинация и загрузка данных

### Cursor Pagination — стандарт UI-списков

- [CRITICAL] Списки глав потребляют cursor-based backend API с контрактом `CursorPagedResult<T, TCursor>`.
- [CRITICAL] Каталог книг потребляет `CursorStringPagedResult<T>` с курсором `sortValue|id`. Каталоговая пагинация основана только на `items`, `nextCursor`, `hasMore`.
- [MANDATORY] Бесконечная подгрузка строится вокруг `items`, `nextCursor`, `hasMore` и `IntersectionObserver`. Курсор хранится в component-local state, не в URL, и сбрасывается при изменении фильтров или сортировки.
- [CRITICAL] Каталоговая загрузка и состояние курсора инкапсулированы в `composables/useCatalogCursor.ts`. Страница `catalog.vue` использует этот composable и не дублирует логику URL/cursor/пагинации.
- [FORBIDDEN] Возвращаться к `pageNumber/pageSize` в новых экранах только потому, что "так проще".
- [MANDATORY] Для ручных пагинируемых запросов задавай осмысленный `key`, чтобы не плодить коллизии и случайное повторное использование fetch-state.

## Типы и синхронизация с backend

- [CRITICAL] `types/index.ts` обязан повторять backend DTO один в один: имена полей, nullable, generic-модели пагинации, auth response.
- [MANDATORY] Backend-перечисления (`BookType`, `TranslationStatus`, `OriginalStatus`) зеркалируются как TypeScript `enum` в `types/index.ts` с идентичными числовыми значениями.
- [MANDATORY] Маппинг enum-значений в русский текст централизован в `lib/enums.ts` через `Record<EnumType, string>`. Не дублируй label-маппинг по компонентам.
- [MANDATORY] Любое изменение DTO на backend требует немедленного изменения frontend типов и мест потребления.
- [FORBIDDEN] "Временно" обходить несоответствие типов через `any`, ручные касты или локальные интерфейсы-дубликаты.

## Читалка и навигация по главам

- [CRITICAL] `ChapterDetailDto` содержит `previousChapterId` и `nextChapterId`, вычисленные на backend по `ChapterNumber`. Страница читалки использует эти поля для навигации, не загружая весь список глав.
- [FORBIDDEN] Загружать `limit=1000` или иной большой список глав в читалке только ради кнопок "Предыдущая"/"Следующая".
- [MANDATORY] Навигация по главам строится на одном запросе `/api/chapters/{id}` с последующим переходом по `previousChapterId`/`nextChapterId`.

## Quotes / User Highlights

- [CRITICAL] User quotes are managed through `composables/useQuotes.ts` and consumed by the reader page (`pages/books/[bookId]/read/[chapterId].vue`) and the profile page (`pages/profile/quotes/index.vue`).
- [MANDATORY] `types/index.ts` mirrors backend `QuoteDto`, `CreateQuoteDto`, and `UpdateQuoteDto` exactly.
- [MANDATORY] Text selection in the reader is client-only and must be guarded with `import.meta.client` or equivalent browser checks; never run `window.getSelection()` during SSR.
- [MANDATORY] Quote popup is positioned relative to the selection range and is only shown when the user is authenticated and the selection is inside `.reader-content`.
- [MANDATORY] Profile quotes page is protected by the `auth` middleware and groups quotes by book.

## Что нельзя ломать

- [FORBIDDEN] Удалять или обходить `useApiFetch` как единый API-слой.
- [FORBIDDEN] Тащить auth-логику в случайные компоненты вместо `useAuth` + middleware.
- [FORBIDDEN] Дублировать коллекции одновременно в Pinia и в локальных массивах разных страниц как независимые источники истины.
- [FORBIDDEN] Подменять `useCookie` для токенов браузерными storage-механизмами.
- [FORBIDDEN] Превращать страницы в монолиты вместо композиции из компонентов.

## Тестирование

- [MANDATORY] Фронтенд-юнит-тесты запускаются через `npm run test` (Vitest + happy-dom). Предпочтительно тестировать чистые функции и composable-логику, не завязанную на Nuxt runtime.
- [MANDATORY] Тесты курсорной пагинации и reader-навигации должны покрывать формирование URL, сброс курсора при смене фильтров и обработку `previousChapterId`/`nextChapterId`.
- [MANDATORY] Каталоговая загрузка и состояние курсора инкапсулированы в `composables/useCatalogCursor.ts`; страница `pages/catalog.vue` использует этот composable и не дублирует логику URL/cursor/пагинации.
- [FORBIDDEN] Добавлять новые тестовые зависимости без явной необходимости; использовать уже выбранный стек (Vitest, @vue/test-utils, happy-dom).

## Обновление документации

- [MANDATORY] Добавил новый глобальный store, новый composable-стандарт, новый middleware-слой, новый UI foundation или новый способ хранения состояния — обнови этот файл в том же изменении.

## Phase 08 — Frontend UX Polish

### Auth modal pattern

- [CRITICAL] `components/auth/AuthModal.vue` is the canonical login/register modal shell. It uses the existing `Dialog` primitive and contains `LoginForm`/`RegisterForm` tabs. `SiteHeader.vue` opens this modal instead of navigating to `/login` or `/register`.
- [MANDATORY] `pages/login.vue` and `pages/register.vue` remain as route fallbacks that render `AuthModal` with `open=true` and `initial-tab` set appropriately.
- [MANDATORY] `components/auth/LoginForm.vue` and `components/auth/RegisterForm.vue` are pure form components that delegate to `useAuth` and emit `success`/`error`. They are reused inside the modal and by the fallback pages.
- [MANDATORY] `components/auth/index.ts` exports `AuthModal`, `LoginForm`, and `RegisterForm` for clean imports.

### Reader settings

- [CRITICAL] `composables/useReaderSettings.ts` owns reader UI preferences. It exposes `settings`, `isReady`, `setTheme`, `setFontFamily`, `setLineHeight`, `increaseFontSize`, `decreaseFontSize`, and `resetDefaults`.
- [MANDATORY] `ReaderSettings.vue` uses preset chips for line-height and theme, exposes quick font-size controls, and resets to `DEFAULT_READER_SETTINGS`.
- [MANDATORY] Reader settings remain in `localStorage` only and must not store auth, API cache, or domain data. SSR/hydration safety is preserved through `isReady`.

### UX micro-improvements

- [MANDATORY] `app.vue` includes `<NuxtLoadingIndicator>` for page-level loading feedback.
- [MANDATORY] `SiteHeader.vue` provides toast feedback on logout via `useToast`.
- [MANDATORY] Auth form inputs use `autofocus` for better keyboard flow inside the modal.

## Phase 07 — Catalog UI Consolidation

### Components

- [CRITICAL] `components/AppState.vue` is the canonical reusable empty/error/loading state component. Use it for list empty states, error retry surfaces, and centered loading placeholders. Do not recreate one-off empty/error blocks in pages.
- [CRITICAL] Dead Nuxt UI-based components were removed: `components/app/*`, `components/auth/AuthCardShell.vue`, `components/catalog/CatalogFiltersPanel.vue`. Do not reintroduce `UBadge`, `UButton`, `UIcon`, `UInput`, `UCard`, or one-off `surface-*` classes.

### Catalog filters and pagination

- [CRITICAL] `composables/useCatalogFilters.ts` is the canonical source for catalog filter state, URL parsing, route query building, active chips, and filter sections. `pages/catalog.vue` must consume this composable and must not duplicate URL parsing, query building, or filter section logic.
- [MANDATORY] `useCatalogFilters` no longer performs async API calls; it accepts optional `availableTags`/`availableCategories` refs and returns reactive state and actions. Pages fetch tags/categories separately and pass them in.
- [MANDATORY] `useCatalogCursor.ts` remains the canonical source for catalog cursor pagination and `buildCatalogUrl`. The page awaits `loadFirstPage()` and `loadMore()` from the composable.

### Design tokens

- [CRITICAL] Reader theme colors are defined in `assets/css/globals.css` as semantic tokens (`--reader-light-*`, `--reader-sepia-*`, `--reader-dark-*`). Use the provided utility classes (`bg-reader-*`, `text-reader-*`, `border-reader-*`) instead of hardcoded hex values in reader pages and `ReaderSettings.vue`.
- [MANDATORY] Use the `success` Tailwind token for positive banners (e.g., registration success) instead of hardcoded green utilities.

### SSR / hydration

- [CRITICAL] `useReaderSettings` exposes `isReady` which becomes `true` only after client hydration. Reader theme/font classes must render the default value on the server and initial client paint, then switch to the stored preference after `isReady` is true to avoid hydration mismatches.
- [CRITICAL] SSR/client hydration request identity must not depend on transport or `baseURL`. The initial book-detail `useApiFetch` in `pages/books/[id].vue` uses the explicit, book-specific key `book:${bookId}:detail` on both server and client so the browser reuses the SSR payload. Keep the existing SSR backend / browser BFF transports and chapter fetching unchanged.
- [MANDATORY] `tests/book-detail-identity.test.ts` is a static source-level request-identity guard, not a Nuxt SSR/hydration test. Actual acceptance requires the direct-load/reload, chapter-link, and anonymous reader checks in `tests/book-detail-hydration-smoke.md` against a coordinated rebuilt Docker stack; a green unit suite or an old-image browser pass is not deployed verification.
