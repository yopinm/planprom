import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const isDevelopment = process.env.NODE_ENV === 'development'
const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  'https://browser.sentry-cdn.com',
  'https://js.sentry-cdn.com',
]

// Security headers — TASK 3.13
// Applied to all routes. Cloudflare sits in front and passes these through.
const SECURITY_HEADERS = [
  // Prevent clickjacking
  { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
  // Block MIME-type sniffing
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  // Referrer policy — send origin only on cross-origin requests
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  // Disable DNS prefetch leaking browsing habits
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  // Restrict browser features not used by the site
  {
    key:   'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // Content Security Policy — tightened for coupon/affiliate site
  // script-src: self + Sentry CDN; dev adds unsafe-eval for React debug tooling only.
  {
    key:   'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src ${scriptSources.join(' ')}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.sentry.io https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'down-th.img.susercontent.com' },
      { protocol: 'https', hostname: 'cf.shopee.co.th' },
      // Lazada uses multiple slatic.net subdomains (th-live-01, sg-test-11, lzd-img-global, etc.)
      { protocol: 'https', hostname: '*.slatic.net' },
      { protocol: 'https', hostname: 'img.lazcdn.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only in CI (SENTRY_AUTH_TOKEN must be set)
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  disableLogger: true,
  automaticVercelMonitors: false,
  // Disable auto-instrumentation of middleware — Sentry looks for
  // middleware.js.nft.json before it exists, causing build to fail.
  autoInstrumentMiddleware: false,
})
