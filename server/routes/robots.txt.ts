import { defineEventHandler, getHeader } from 'h3'

export default defineEventHandler((event) => {
  const proto = getHeader(event, 'x-forwarded-proto') || 'http'
  const host = getHeader(event, 'host') || 'localhost:3001'
  const baseUrl = `${proto}://${host}`

  setHeader(event, 'Content-Type', 'text/plain')
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /profile
Sitemap: ${baseUrl}/sitemap.xml
`
})
