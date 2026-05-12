'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

type GroupKey = 'template' | 'report' | 'promo'

interface NavLink {
  label: string
  path: string
  pattern: RegExp
}

interface NavGroup {
  label: string
  sublabel: string
  color: string
  links: NavLink[]
}

const GROUPS: Record<GroupKey, NavGroup> = {
  template: {
    label: 'Template',
    sublabel: 'Store · Orders',
    color: 'bg-amber-600',
    links: [
      { label: '+ New Template', path: '/admin/templates/new',      pattern: /^\/admin\/templates\/new/ },
      { label: '📋 Templates',   path: '/admin/templates',          pattern: /^\/admin\/templates(?!\/new)/ },
      { label: '🗂 Catalog',     path: '/admin/catalogs',           pattern: /^\/admin\/catalogs/ },
      { label: '📊 Analytics',   path: '/admin/template-analytics', pattern: /^\/admin\/template-analytics/ },
      { label: '📝 Blog SEO',    path: '/admin/seo',                pattern: /^\/admin\/seo/ },
    ],
  },
  promo: {
    label: 'Promo',
    sublabel: 'Codes · Campaign',
    color: 'bg-rose-600',
    links: [
      { label: '🏷 Promo Codes', path: '/admin/promo-codes', pattern: /^\/admin\/promo-codes/ },
    ],
  },
  report: {
    label: 'Report',
    sublabel: 'Analytics · Logs',
    color: 'bg-indigo-600',
    links: [
      { label: '📈 ยอดขาย',        path: '/admin/report/sales',         pattern: /^\/admin\/report\/sales/ },
      { label: '👁️ Pageviews',     path: '/admin/report/pageviews',     pattern: /^\/admin\/report\/pageviews/ },
      { label: '💳 Payment Log',   path: '/admin/report/payments',      pattern: /^\/admin\/report\/payments/ },
      { label: '📥 Download Log',  path: '/admin/report/downloads',     pattern: /^\/admin\/report\/downloads/ },
      { label: '🖥 PM2 Log',       path: '/admin/report/log/pm2',       pattern: /^\/admin\/report\/log\/pm2/ },
      { label: '🌐 Nginx Access',  path: '/admin/report/log/nginx-access', pattern: /^\/admin\/report\/log\/nginx-access/ },
      { label: '⚠️ Nginx Error',   path: '/admin/report/log/nginx-error',  pattern: /^\/admin\/report\/log\/nginx-error/ },
      { label: '📋 Error Digest',  path: '/admin/report/log/errors',    pattern: /^\/admin\/report\/log\/errors/ },
    ],
  },
}

const GROUP_KEYS = Object.keys(GROUPS) as GroupKey[]

function detectGroup(pathname: string): GroupKey {
  for (const key of GROUP_KEYS) {
    if (GROUPS[key].links.some(l => l.pattern.test(pathname))) return key
  }
  return 'template'
}

export function AdminNav() {
  const pathname = usePathname()
  const detected = detectGroup(pathname)
  const [active, setActive] = useState<GroupKey>(detected)

  useEffect(() => { setActive(detected) }, [detected])

  const isDashboard = pathname === '/admin'
  const group = GROUPS[active]

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur shadow-sm">

      {/* ── Row 1: Logo · Group tabs · Home ── */}
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-2.5 pb-1.5">

        <Link href="/admin" className="flex shrink-0 items-center gap-2 mr-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-white text-[10px] transition ${isDashboard ? 'bg-amber-600' : 'bg-black'}`}>
            ADM
          </div>
          <span className="hidden text-sm font-black tracking-tight text-black sm:block">
            แพลนพร้อม
          </span>
        </Link>

        {/* Group tabs */}
        <div className="flex items-center gap-1">
          {GROUP_KEYS.map(key => {
            const g = GROUPS[key]
            const isActive = active === key && !isDashboard
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`flex flex-col items-start rounded-xl px-3 py-1.5 text-left transition ${
                  isActive ? `${g.color} text-white shadow` : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                <span className="text-[11px] font-black uppercase tracking-wider leading-none">{g.label}</span>
                <span className={`text-[9px] font-semibold leading-none mt-0.5 ${isActive ? 'text-white/70' : 'text-neutral-400'}`}>
                  {g.sublabel}
                </span>
              </button>
            )
          })}
        </div>

        <div className="ml-auto shrink-0">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-amber-600 transition">
            ← Home
          </Link>
        </div>
      </div>

      {/* ── Row 2: Links of active group ── */}
      <div className="mx-auto max-w-6xl px-4 pb-2">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {group.links.map(link => {
            const isActive = link.pattern.test(pathname)
            const isNew = link.path === '/admin/templates/new'
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  isNew
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : isActive
                      ? 'bg-black text-white'
                      : 'text-neutral-400 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

    </header>
  )
}
