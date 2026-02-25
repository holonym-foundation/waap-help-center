import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { IntercomMessenger } from './intercom'

export const metadata: Metadata = {
  title: {
    default: 'WaaP Help Center',
    template: '%s – WaaP Help',
  },
  description: 'Support and documentation for WaaP',
  openGraph: {
    title: 'WaaP Help Center',
    description: 'Support and documentation for WaaP',
  },
  icons: {
    icon: '/img/wally-favicon.svg',
  },
}

const logo = (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <img
      src="/img/wally-favicon-dark.svg"
      alt="WaaP"
      width={28}
      height={28}
      className="dark:hidden"
    />
    <img
      src="/img/wally-favicon.svg"
      alt="WaaP"
      width={28}
      height={28}
      className="hidden dark:block"
    />
    <span style={{ fontWeight: 600, fontSize: '18px' }}>WaaP Help Center</span>
  </div>
)

const navbar = (
  <Navbar
    logo={logo}
    chatLink="https://discord.com/invite/zfGqjA5pxU"
  />
)

const footer = <Footer>&copy; human.tech</Footer>

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head color={{ hue: 40 }}>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body>
        <IntercomMessenger />
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          sidebar={{
            defaultMenuCollapseLevel: 1,
            toggleButton: true,
          }}
          toc={{
            backToTop: true,
          }}
          editLink={null}
          feedback={{ content: null }}
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
