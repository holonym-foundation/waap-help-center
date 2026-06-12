import type { MetadataRoute } from 'next'
import { statSync } from 'node:fs'
import { join } from 'node:path'

const SITE_URL = 'https://support.waap.xyz'

// route → content file, so <lastmod> tracks real content change where the
// filesystem preserves mtimes (falls back to build time otherwise).
const PAGES: { route: string; file: string; priority: number }[] = [
  { route: '', file: 'index.mdx', priority: 1 },
  { route: 'getting-started', file: 'getting-started.mdx', priority: 0.8 },
  { route: 'wallet', file: 'wallet.mdx', priority: 0.8 },
  { route: 'security', file: 'security.mdx', priority: 0.8 },
  { route: 'troubleshooting', file: 'troubleshooting.mdx', priority: 0.7 },
  { route: 'faq', file: 'faq.mdx', priority: 0.7 },
  { route: 'agents', file: 'agents.mdx', priority: 0.8 },
  { route: 'privileges', file: 'privileges.mdx', priority: 0.7 },
  { route: 'agent-control', file: 'agent-control.mdx', priority: 0.7 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ route, file, priority }) => {
    let lastModified: Date
    try {
      lastModified = statSync(join(process.cwd(), 'content', file)).mtime
    } catch {
      lastModified = new Date()
    }
    return {
      url: route ? `${SITE_URL}/${route}` : SITE_URL,
      lastModified,
      changeFrequency: 'monthly',
      priority,
    }
  })
}
