'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

// Client-side PostHog init for the WaaP Help Center.
// This is a CONTENT/docs surface, so it carries the shared "content profile":
// product=waap, site=waap_help, surface_type=docs.
//
// No-op if NEXT_PUBLIC_POSTHOG_KEY is unset (e.g. local dev or preview without
// the env var), so the build and runtime never depend on the key being present.
// The key must be configured in Vercel for analytics to flow.
export function PostHogProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    if (posthog.__loaded) return

    posthog.init(key, {
      api_host: 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      enable_heatmaps: true,
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '[data-ph-mask]',
      },
    })

    posthog.register({ product: 'waap', site: 'waap_help', surface_type: 'docs' })
  }, [])

  return null
}
