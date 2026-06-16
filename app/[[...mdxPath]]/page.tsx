import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents } from '../../mdx-components'
import { buildFaqSchema, buildHowToSchema } from '../../lib/schema'

const SITE_URL = 'https://support.waap.xyz'

// Multi-Q&A page → FAQPage.
const FAQ_PAGES: Record<string, string> = {
  faq: 'faq.mdx',
}
// Step-by-step guide → HowTo.
const HOWTO_PAGES: Record<string, { file: string; name: string }> = {
  'getting-started': { file: 'getting-started.mdx', name: 'How to create a WaaP wallet' },
}

function schemaFor(route: string) {
  const url = route ? `${SITE_URL}/${route}` : SITE_URL
  if (FAQ_PAGES[route]) return buildFaqSchema(FAQ_PAGES[route], url)
  const ht = HOWTO_PAGES[route]
  if (ht) return buildHowToSchema(ht.file, url, ht.name)
  return null
}

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: {
  params: Promise<{ mdxPath?: string[] }>
}) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  // Homepage: avoid the "WaaP Help Center – WaaP Help" doubling the title
  // template produces from the index H1; use an absolute, positioned title.
  if (!params.mdxPath?.length) {
    return {
      ...metadata,
      title: {
        absolute: 'WaaP Help Center: One-Click Wallet for Humans and Agents',
      },
    }
  }
  return metadata
}

const { wrapper: Wrapper } = useMDXComponents()

export default async function Page(props: {
  params: Promise<{ mdxPath?: string[] }>
}) {
  const params = await props.params
  const { default: MDXContent, ...rest } = await importPage(params.mdxPath)
  const schema = schemaFor((params.mdxPath ?? []).join('/'))
  return (
    <Wrapper {...rest}>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
