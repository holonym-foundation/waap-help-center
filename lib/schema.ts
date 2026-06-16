import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Build schema.org JSON-LD from the MDX at build time, so structured data stays
// in sync with the prose instead of being hand-duplicated. Applied only to pages
// that genuinely model FAQs or step-by-step guides (see page.tsx).

const CONTENT = join(process.cwd(), 'content')

function read(relFile: string): string {
  return readFileSync(join(CONTENT, relFile), 'utf8').replace(/^---[\s\S]*?---/, '')
}

function stripMd(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Split into { heading, body } sections at H2/H3 boundaries.
function parseSections(relFile: string): { heading: string; body: string }[] {
  const out: { heading: string; body: string[] }[] = []
  let cur: { heading: string; body: string[] } | null = null
  for (const line of read(relFile).split('\n')) {
    const m = line.match(/^#{2,3}\s+(.*)$/)
    if (m) {
      if (cur) out.push(cur)
      cur = { heading: m[1].trim(), body: [] }
    } else if (cur && line.trim()) {
      cur.body.push(line.trim())
    }
  }
  if (cur) out.push(cur)
  return out.map((s) => ({ heading: s.heading, body: s.body.join(' ') }))
}

// Navigational closers that end in '?' but aren't real Q&As.
const FAQ_CLOSER = /need (more )?help|more help|still.*(help|question)|contact (us|support)|get in touch/i

export function buildFaqSchema(relFile: string, url: string) {
  const qa = parseSections(relFile)
    .filter((s) => s.heading.includes('?') && s.body.length > 30 && !FAQ_CLOSER.test(s.heading))
    .map((s) => ({
      '@type': 'Question',
      name: stripMd(s.heading),
      acceptedAnswer: { '@type': 'Answer', text: stripMd(s.body).slice(0, 1200) },
    }))
  if (qa.length < 2) return null
  return { '@context': 'https://schema.org', '@type': 'FAQPage', url, mainEntity: qa }
}

export function buildHowToSchema(relFile: string, url: string, name: string) {
  // Prefer "Step N:" headings; fall back to the first ordered list in the doc.
  let steps = parseSections(relFile)
    .filter((s) => /^step\s*\d+/i.test(s.heading) && s.body)
    .map((s) => ({
      '@type': 'HowToStep',
      name: stripMd(s.heading.replace(/^step\s*\d+:?\s*/i, '')),
      text: stripMd(s.body).slice(0, 1000),
    }))
  if (!steps.length) {
    steps = read(relFile)
      .split('\n')
      .filter((l) => /^\d+\.\s+/.test(l))
      .map((l) => {
        const t = stripMd(l.replace(/^\d+\.\s+/, '')).slice(0, 200)
        return { '@type': 'HowToStep', name: t, text: t }
      })
  }
  if (steps.length < 2) return null
  return { '@context': 'https://schema.org', '@type': 'HowTo', name, url, step: steps }
}
