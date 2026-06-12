import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents } from '../../mdx-components'

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
        absolute: 'WaaP Help Center: Self-Custodial Wallet for People and Agents',
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
  return (
    <Wrapper {...rest}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
