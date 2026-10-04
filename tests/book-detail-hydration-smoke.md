# Book-detail hydration browser smoke

## Coverage boundary

Run `npm run test -- tests/book-detail-identity.test.ts` from the frontend repo root.
That test reads the page source and guards the explicit initial book-fetch key.
It does **not** execute the page, transfer a Nuxt SSR payload, or hydrate browser DOM.
There is no automated full Nuxt hydration harness in the current unit suite;
this procedure is required runtime acceptance, not an already-passed browser test.

## Preconditions

- The stack operator must coordinate a current-source Docker rebuild through the deployer after concurrent work finishes. Do not restart a shared stack from this smoke procedure or accept results from an old image.
- Use a fresh anonymous browser context with JavaScript enabled and no diagnostic response/payload rewriting. Use the deployment origin supplied by the operator (`WEB_ORIGIN`), not a host or book ID baked into a fixture.
- Choose an existing public book with at least one published chapter. Only browse public routes; do not log in, create data, like chapters, or change progress/collections. Do not inspect/export cookies, storage, profiles, env files, generated bundles, payloads, or raw operational/console logs.

## Procedure

1. Open the catalog at `WEB_ORIGIN` and obtain the chosen book's `/books/<book-id>` path. Open that path directly in a fresh context/address-bar navigation so it is a document load, not just a client-side route change.
2. Wait for Vue hydration **and** the chapter list to finish (use a bounded wait, e.g. 30 seconds). `networkidle`, title metadata, or SSR markup alone is not proof. A browser-tool evaluation can return only these safe counts/flags:

   ```js
   (() => {
     const app = document.getElementById('__nuxt')?.__vue_app__
     const nuxt = app?.config?.globalProperties?.$nuxt
     const main = document.querySelector('#main-content main')
     return {
       vueMounted: Boolean(app),
       hydrationComplete: Boolean(nuxt) && nuxt.isHydrating === false,
       headingCount: main?.querySelectorAll('h1').length ?? 0,
       readerLinkCount: main?.querySelectorAll('a[href*="/read/"]').length ?? 0,
       mainElementCount: main?.querySelectorAll('*').length ?? 0,
       mainHasText: Boolean(main?.textContent?.trim()),
     }
   })()
   ```

3. Require `vueMounted` and `hydrationComplete`, one visible book heading, nonempty main content, and the start-reading link plus published chapter links (`readerLinkCount >= 2` for the chosen book). Repeat a hard reload three times; the same checks must continue to pass. If instrumenting errors, report only classifications such as hydration mismatch or null-property/`emitsOptions`, never raw logs; these classifications must be absent.
4. Navigate catalog → book normally and wait for the old catalog subtree to be replaced. Recheck heading/reader links, then toggle chapter ordering and confirm the published chapter links remain usable.
5. Follow an actual published chapter link anonymously. Confirm visible, nonempty `.reader-content`, then follow previous/next navigation where available. Do not perform authenticated or mutating actions.

## Record acceptance

Record only the rebuilt image/revision identifier, direct-load/reload DOM counts and flags, SPA/chapter-sort/reader results, and error classifications. A redundant browser `GET /api/books/<book-id>` during initial hydration is a useful additional request-identity check; do not collect its headers or body. Leave deployed verification pending until the unmodified rebuilt stack passes this procedure; source/static-test success is a separate result.
