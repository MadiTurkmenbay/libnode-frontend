/**
 * SEO-помощник: единообразные meta/OG-теги для публичных страниц.
 */
export function useSeo(options: {
  title: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'book'
  jsonLd?: Record<string, unknown>
}) {
  const siteName = 'LibNode'
  const fullTitle = options.title.includes(siteName)
    ? options.title
    : `${options.title} — ${siteName}`

  useHead({
    title: fullTitle,
    meta: [
      { name: 'description', content: options.description ?? '' },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: options.description ?? '' },
      { property: 'og:site_name', content: siteName },
      { property: 'og:type', content: options.type ?? 'website' },
      ...(options.image ? [{ property: 'og:image', content: options.image }] : []),
      ...(options.url ? [{ property: 'og:url', content: options.url }] : []),
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: options.description ?? '' },
      ...(options.image ? [{ name: 'twitter:image', content: options.image }] : []),
    ],
    ...(options.jsonLd
      ? { script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(options.jsonLd) }] }
      : {}),
  })
}
