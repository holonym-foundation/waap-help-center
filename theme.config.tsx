import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
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
  ),
  project: {
    link: '',
  },
  chat: {
    link: 'https://discord.com/invite/zfGqjA5pxU',
  },
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
      <link rel="icon" href="/img/wally-favicon.svg" type="image/svg+xml" />
    </>
  ),
  primaryHue: 40,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  editLink: {
    text: null,
  },
  feedback: {
    content: null,
  },
}

export default config
