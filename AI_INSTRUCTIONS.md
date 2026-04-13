# AI_INSTRUCTIONS — libnode frontend

## Контекст
Этот репозиторий — Nuxt 3 frontend LibNode. В текущем workspace он физически расположен в папке `libnode-fronted`. Архитектура построена вокруг SSR, cookie-based auth, единого API-слоя, Pinia для глобального доменного состояния и UI-примитивов `shadcn-nuxt`/`reka-ui`/`radix-vue`.

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
- [MANDATORY] Заголовок `Authorization` формируется централизованно внутри API composable через cookie `auth_token`. Компоненты и страницы не добавляют его вручную.
- [MANDATORY] Базовые URL API берутся только из `runtimeConfig.public.apiBase` / `apiBaseClient`. Не хардкодь новые backend-адреса по файлам.

## Управление состоянием

### Один источник истины на один тип данных

- [CRITICAL] Глобальное доменное состояние хранится в Pinia. Для коллекций источником истины является `stores/collections.ts`.
- [FORBIDDEN] Дублировать store-backed данные в нескольких страницах/компонентах отдельными несвязанными `ref`, если уже существует Pinia-store.
- [MANDATORY] Если данные нужны между маршрутами, переживают навигацию или должны кэшироваться — выноси их в store.
- [MANDATORY] `useState` разрешён для небольшого SSR-safe application/session state, как в `useAuth`.
- [MANDATORY] Локальные `ref` допустимы только для ephemeral UI-state: модалки, поля формы, pending-флаги, локальные optimistic-флаги.
- [FORBIDDEN] Вводить второй глобальный state manager, event bus или самодельные singleton-объекты для данных, которые уже решает Pinia/Nuxt state.

## SSR, auth и cookies

### useCookie — стандарт для сессии

- [CRITICAL] Токен аутентификации живёт только в cookie `auth_token`, читается через `useCookie` и используется и в middleware, и в API-composable.
- [FORBIDDEN] Хранить auth token, user session, роли или серверные доменные данные в `localStorage`/`sessionStorage`.
- [MANDATORY] Route guard'ы строятся через `definePageMeta({ middleware: [...] })` и middleware-файлы `auth.ts` / `admin.ts`.
- [MANDATORY] Клиентский парсинг JWT разрешён только для UX и отображения. Источником истины для реальной авторизации остаётся backend.
- [MANDATORY] Всё, что должно корректно переживать SSR, обязано быть cookie/state-safe. Любой код, завязанный на browser-only API, должен быть осознанно изолирован.
- [MANDATORY] Узкое исключение для `localStorage` допустимо только для чисто клиентских необязательных preferences без security и SSR-критичности, как `useReaderSettings`. Это исключение нельзя расширять на auth, кэш API, роли, bookmarks, профили и другую доменную модель.

## Компоненты и UI

### Никаких God Components

- [CRITICAL] Если компонент одновременно грузит данные, хранит глобальное состояние, рисует большой layout и содержит сложную доменную логику, он уже слишком большой. Делить обязательно.
- [MANDATORY] Используй паттерн существующего кода: page-компонент собирает экран, доменные компоненты инкапсулируют повторяющиеся куски интерфейса.
- [MANDATORY] Для диалогов, поповеров, кнопок, input и прочих базовых примитивов переиспользуй `components/ui/*`.
- [FORBIDDEN] Встраивать самодельные модалки/поповеры/контролы, если в `components/ui` уже есть подходящий primitive.
- [FORBIDDEN] Смешивать доменную бизнес-логику с `components/ui`.

## Пагинация и загрузка данных

### Cursor Pagination — стандарт UI-списков

- [CRITICAL] Каталог и списки глав должны потреблять cursor-based backend API с контрактом `CursorPagedResult<T, TCursor>`.
- [MANDATORY] Бесконечная подгрузка строится вокруг `items`, `nextCursor`, `hasMore` и `IntersectionObserver`.
- [FORBIDDEN] Возвращаться к `pageNumber/pageSize` в новых экранах только потому, что "так проще".
- [MANDATORY] Для ручных пагинируемых запросов задавай осмысленный `key`, чтобы не плодить коллизии и случайное повторное использование fetch-state.

## Типы и синхронизация с backend

- [CRITICAL] `types/index.ts` обязан повторять backend DTO один в один: имена полей, nullable, generic-модели пагинации, auth response.
- [MANDATORY] Backend-перечисления (`BookType`, `TranslationStatus`, `OriginalStatus`) зеркалируются как TypeScript `enum` в `types/index.ts` с идентичными числовыми значениями.
- [MANDATORY] Маппинг enum-значений в русский текст централизован в `lib/enums.ts` через `Record<EnumType, string>`. Не дублируй label-маппинг по компонентам.
- [MANDATORY] Любое изменение DTO на backend требует немедленного изменения frontend типов и мест потребления.
- [FORBIDDEN] "Временно" обходить несоответствие типов через `any`, ручные касты или локальные интерфейсы-дубликаты.

## Что нельзя ломать

- [FORBIDDEN] Удалять или обходить `useApiFetch` как единый API-слой.
- [FORBIDDEN] Тащить auth-логику в случайные компоненты вместо `useAuth` + middleware.
- [FORBIDDEN] Дублировать коллекции одновременно в Pinia и в локальных массивах разных страниц как независимые источники истины.
- [FORBIDDEN] Подменять `useCookie` для токенов браузерными storage-механизмами.
- [FORBIDDEN] Превращать страницы в монолиты вместо композиции из компонентов.

## Обновление документации

- [MANDATORY] Добавил новый глобальный store, новый composable-стандарт, новый middleware-слой, новый UI foundation или новый способ хранения состояния — обнови этот файл в том же изменении.
