// src/components/seo/RelatedLinks.tsx — TASK 3.10
// Renders a "ดูเพิ่มเติม" block of internal links for SEO cross-linking.

import Link from 'next/link'
import type { InternalLink } from '@/lib/internal-links'

interface Props {
  title?: string
  links:  InternalLink[]
}

export function RelatedLinks({ title = 'ดูเพิ่มเติม', links }: Props) {
  if (links.length === 0) return null

  return (
    <nav aria-label={title} className="mt-8">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-neutral-400">
        {title}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {links.map(link => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-orange-300 hover:shadow-sm"
            >
              <span className="text-sm font-bold text-black">{link.label}</span>
              {link.desc && (
                <span className="mt-0.5 text-xs text-neutral-500">{link.desc}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
