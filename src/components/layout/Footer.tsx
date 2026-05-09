import type { ReactElement } from 'react'
import Link from 'next/link'

const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? null
const emailHref    = 'mailto:contact@planprom.com'

export function Footer(): ReactElement {
  return (
    <footer className="mt-auto border-t border-orange-100 bg-white py-8 text-center text-[11px] leading-6 text-neutral-400">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <p className="font-semibold text-neutral-500">
          แพลนพร้อม — เช็คทุกขั้น แพลนทุกวัน ง่ายทุกงานวางแผน
        </p>

        {/* Social contact links */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {facebookUrl && (
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold text-neutral-600 transition hover:border-blue-300 hover:text-blue-700"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              Facebook
            </a>
          )}
          <a
            href={emailHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold text-neutral-600 transition hover:border-orange-300 hover:text-orange-700"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            ติดต่อเรา
          </a>
        </div>

        <p className="mt-4">
          <Link href="/legal" className="underline underline-offset-2 hover:text-orange-600">Legal</Link>
          {' '}·{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-orange-600">Privacy</Link>
          {' '}·{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-orange-600">Terms</Link>
        </p>
        <p className="mt-4">
          © {new Date().getFullYear()} แพลนพร้อม. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
