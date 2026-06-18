import { defineEventHandler, getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = getHeader(event, 'x-forwarded-proto')
    ? `${getHeader(event, 'x-forwarded-proto')}://${getHeader(event, 'host')}`
    : 'http://localhost:3001'

  const staticRoutes = [
    '',
    'catalog',
    'rankings',
    'leaderboard',
    'login',
    'register',
  ]

  let books: { id: string, updatedAt: string }[] = []
  let tags: { slug: string }[] = []
  let categories: { slug: string }[] = []

  try {
    const apiBase = config.public.apiBase as string
    const bookRes = await fetch(`${apiBase}/api/books?limit=200`, {
      headers: { Host: 'api' },
    })
    if (bookRes.ok) {
      const data = await bookRes.json() as { items: { id: string, updatedAt: string }[] }
      books = data.items ?? []
    }

    const tagRes = await fetch(`${apiBase}/api/tags`)
    if (tagRes.ok) tags = (await tagRes.json() as { slug: string }[]).filter((t) => t.slug)

    const catRes = await fetch(`${apiBase}/api/categories`)
    if (catRes.ok) categories = (await catRes.json() as { slug: string }[]).filter((c) => c.slug)
  } catch {
    // best-effort
  }

  const urls: string[] = []

  for (const r of staticRoutes) {
    urls.push(`  <url><loc>${baseUrl}/${r}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`)
  }

  for (const b of books) {
    urls.push(`  <url><loc>${baseUrl}/books/${b.id}</loc><lastmod>${b.updatedAt}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`)
  }

  for (const t of tags) {
    urls.push(`  <url><loc>${baseUrl}/tags/${t.slug}</loc><changefreq>weekly</changefreq><priority>0.4</priority></url>`)
  }

  for (const c of categories) {
    urls.push(`  <url><loc>${baseUrl}/categories/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.4</priority></url>`)
  }

  setHeader(event, 'Content-Type', 'application/xml')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
})
