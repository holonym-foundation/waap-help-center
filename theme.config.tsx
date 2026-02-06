import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 700 }}>WaaP Help Center</span>,
  project: {
    link: 'https://github.com/holonym-foundation/silk',
  },
  docsRepositoryBase: 'https://github.com/holonym-foundation/silk/tree/main/help-center',
  footer: {
    text: '© human.tech',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – WaaP Help'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="WaaP Help Center" />
      <meta property="og:description" content="Support and documentation for WaaP" />
    </>
  ),
  primaryHue: 40, // Gold/amber tone to match WaaP branding
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
}

export default config
