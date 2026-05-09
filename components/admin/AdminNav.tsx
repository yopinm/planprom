'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

// fb_manual = owner โพสต์เอง (DIST-01 Page captions + DIST-03B VIP group)
// fb_page   = auto-posting engine (queue / log / analytics / config)
type GroupKey = 'core' | 'fb_manual' | 'fb_page' | 'ops' | 'template'

interface NavLink {
  label: string
  path: string
  pattern: RegExp
}

interface NavGroup {
  label: string
  sublabel: string     // shown under tab to clarify purpose
  color: string
  links: NavLink[]
}

const GROUPS: Record<GroupKey, NavGroup> = {
  core: {
    label: 'Core',
    sublabel: 'Revenue · Products',
    color: 'bg-emerald-600',
    links: [
      { label: 'Revenue',    path: '/admin/revenue',       pattern: /^\/admin\/revenue/ },
      { label: 'Commission', path: '/admin/commission',    pattern: /^\/admin\/commission/ },
      { label: 'EPC',        path: '/admin/epc',           pattern: /^\/admin\/epc/ },
      { label: 'Funnel',     path: '/admin/funnel',        pattern: /^\/admin\/funnel/ },
      { label: 'Postbacks',  path: '/admin/postbacks',     pattern: /^\/admin\/postbacks/ },
      { label: 'Coupons',    path: '/admin/coupons',             pattern: /^\/admin\/coupons/ },
      { label: 'Stores',     path: '/admin/recommended-stores',  pattern: /^\/admin\/recommended-stores/ },
      { label: 'Deal Queue', path: '/admin/deal-queue',    pattern: /^\/admin\/deal-queue/ },
      { label: 'Shopee+',    path: '/admin/shopee-import', pattern: /^\/admin\/shopee-import/ },
      { label: 'Bookmarklet',path: '/admin/bookmarklet',   pattern: /^\/admin\/bookmarklet/ },
      { label: 'Influencer', path: '/admin/influencer',    pattern: /^\/admin\/influencer/ },
    ],
  },
  fb_manual: {
    label: 'FB Manual',
    sublabel: 'Owner โพสต์เอง',
    color: 'bg-orange-500',
    links: [
      { label: 'Caption',  path: '/admin/social/templates',   pattern: /^\/admin\/social\/templates/ },
      { label: 'Perf',     path: '/admin/social/performance', pattern: /^\/admin\/social\/performance/ },
      { label: 'VIP Group',path: '/admin/fb-vip-group',       pattern: /^\/admin\/fb-vip-group/ },
      { label: 'TikTok',   path: '/admin/tiktok-hooks',       pattern: /^\/admin\/tiktok-hooks/ },
      { label: 'UGC',      path: '/admin/ugc',                pattern: /^\/admin\/ugc/ },
      { label: 'Outreach', path: '/admin/outreach',           pattern: /^\/admin\/outreach/ },
    ],
  },
  fb_page: {
    label: 'FB Page',
    sublabel: 'Auto-post engine',
    color: 'bg-blue-600',
    links: [
      { label: 'Queue',     path: '/admin/facebook/queue',     pattern: /^\/admin\/facebook\/queue/ },
      { label: 'Log',       path: '/admin/facebook/log',       pattern: /^\/admin\/facebook\/log/ },
      { label: 'Analytics', path: '/admin/facebook/analytics', pattern: /^\/admin\/facebook\/analytics/ },
      { label: 'Config',    path: '/admin/facebook/config',    pattern: /^\/admin\/facebook\/config/ },
      { label: 'Exp',       path: '/admin/experiments',        pattern: /^\/admin\/experiments/ },
    ],
  },
  ops: {
    label: 'Ops',
    sublabel: 'Infra · Monitoring',
    color: 'bg-red-600',
    links: [
      { label: 'Control',    path: '/admin/control',      pattern: /^\/admin\/control/ },
      { label: 'Alerts',     path: '/admin/alerts',       pattern: /^\/admin\/alerts/ },
      { label: 'Deal QA',    path: '/admin/deal-quality', pattern: /^\/admin\/deal-quality/ },
      { label: 'Health',     path: '/admin/link-health',  pattern: /^\/admin\/link-health/ },
      { label: 'DB',         path: '/admin/db-monitor',   pattern: /^\/admin\/db-monitor/ },
      { label: 'Uptime',     path: '/admin/uptime',       pattern: /^\/admin\/uptime/ },
      { label: 'Sec',        path: '/admin/security',     pattern: /^\/admin\/security/ },
      { label: 'Export',     path: '/admin/export',       pattern: /^\/admin\/export/ },
      { label: 'Preflight',  path: '/admin/preflight',    pattern: /^\/admin\/preflight/ },
    ],
  },
  template: {
    label: 'Template',
    sublabel: 'Store · Orders',
    color: 'bg-amber-600',
    links: [
      { label: '+ New Template', path: '/admin/templates/new',      pattern: /^\/admin\/templates\/new/ },
      { label: '📋 Templates',   path: '/admin/templates',          pattern: /^\/admin\/templates(?!\/new)/ },
      { label: '🗂 Catalog',     path: '/admin/catalogs',           pattern: /^\/admin\/catalogs/ },
      { label: '📦 Orders',      path: '/admin/orders',             pattern: /^\/admin\/orders/ },
      { label: '📊 Analytics',   path: '/admin/template-analytics', pattern: /^\/admin\/template-analytics/ },
      { label: '📝 Blog SEO',   path: '/admin/seo',                pattern: /^\/admin\/seo/ },
    ],
  },
}

const GROUP_KEYS = Object.keys(GROUPS) as GroupKey[]

function detectGroup(pathname: string): GroupKey {
  for (const key of GROUP_KEYS) {
    if (GROUPS[key].links.some(l => l.pattern.test(pathname))) return key
  }
  return 'core'
}

export function AdminNav() {
  const pathname  = usePathname()
  const detected  = detectGroup(pathname)
  const [active, setActive] = useState<GroupKey>(detected)

  useEffect(() => { setActive(detected) }, [detected])

  const isDashboard = pathname === '/admin'
  const group       = GROUPS[active]

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur shadow-sm">

      {/* ── Row 1: Logo · Group tabs · Home ── */}
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-2.5 pb-1.5">

        <Link href="/admin" className="flex shrink-0 items-center gap-2 mr-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-white text-[10px] transition ${isDashboard ? 'bg-orange-500' : 'bg-black'}`}>
            ADM
          </div>
          <span className="hidden text-sm font-black tracking-tight text-black sm:block">
            Couponkum
          </span>
        </Link>

        {/* Group tabs */}
        <div className="flex items-center gap-1">
          {GROUP_KEYS.map(key => {
            const g        = GROUPS[key]
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
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-orange-600 transition">
            ← Home
          </Link>
        </div>
      </div>

      {/* ── Row 2: Links ของ active group ── */}
      <div className="mx-auto max-w-6xl px-4 pb-2">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {group.links.map(link => {
            const isActive = link.pattern.test(pathname)
            const isNew    = link.path === '/admin/templates/new'
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
