import type { ReactElement } from 'react'
import Link from 'next/link'

const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? null
const lineUrl     = '/wallet'
const emailHref    = 'mailto:partner@couponkum.com'

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
<Link
            href={lineUrl}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold text-neutral-600 transition hover:border-green-300 hover:text-green-700"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            LINE OA
          </Link>
          <a
            href={emailHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold text-neutral-600 transition hover:border-orange-300 hover:text-orange-700"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            partner@couponkum.com
          </a>
        </div>

        <p className="mt-4">
          ราคาอาจมีการเปลี่ยนแปลงตามเงื่อนไขของแพลตฟอร์ม
        </p>
        <p>
          เราอาจได้รับค่าคอมมิชชันเมื่อท่านซื้อผ่านลิงก์นี้ ·{' '}
          <Link href="/disclosure" className="underline underline-offset-2 hover:text-orange-600">Affiliate Disclosure</Link>
          {' '}·{' '}
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
