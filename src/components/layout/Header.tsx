'use client'

import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'หน้าแรก', href: '/' },
  { label: 'เทมเพลตทั้งหมด', href: '/templates' },

  { label: 'บทความเกี่ยวกับเทมเพลต', href: '/blog' },
  { label: 'Planner vs Checklist ต่างกันอย่างไร?', href: '/blog/planner-กับ-checklist-ต่างกันยังไง' },
  { label: 'คำถามที่พบบ่อย', href: '/blog/คำถามที่พบบ่อย-faq' },
]

export function Header(): ReactElement {
  const pathname = usePathname()
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  const [query, setQuery] = useState('')

  // Cart count — re-fetch on navigation (badge clears after checkout) + cart-updated event
  useEffect(() => {
    function fetchCartCount() {
      fetch('/api/cart/count')
        .then(r => r.ok ? (r.json() as Promise<{ count: number }>) : null)
        .then(data => { if (data) setCartCount(data.count) })
        .catch(() => {})
    }
    fetchCartCount()
    window.addEventListener('cart-updated', fetchCartCount)
    return () => window.removeEventListener('cart-updated', fetchCartCount)
  }, [pathname])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/templates?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm">
      {/* Row 1 — Logo + Brand + Slogan */}
      <div className="border-b border-amber-200 bg-gradient-to-r from-orange-50 via-white to-emerald-50 px-6 py-3 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center gap-3.5">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="แพลนพร้อม"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-contain"
              priority
            />
            <span className="text-3xl font-semibold leading-none text-neutral-900">
              แพลนพร้อม
            </span>
          </Link>
          <span className="hidden flex-1 text-3xl font-semibold leading-none text-neutral-600 sm:block">
            เช็คทุกขั้น แพลนทุกวัน ง่ายทุกงานวางแผน
          </span>
        </div>
      </div>

      {/* Row 2 — Nav links + Search */}
      <div className="border-b border-neutral-100 bg-white px-6 py-2 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <nav className="flex items-center gap-4 sm:gap-[18px]">
            {NAV_ITEMS.map(({ label, href }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`py-1 text-sm font-medium transition-colors hover:text-neutral-900 ${
                    isActive
                      ? 'border-b-2 border-orange-600 text-neutral-900'
                      : 'text-neutral-500'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/cart" prefetch={false} className="relative p-1 text-neutral-500 hover:text-neutral-900" aria-label="ตะกร้า">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 7h12.8M7 13L5.4 5M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-0.5 text-[9px] font-black leading-none text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <form onSubmit={handleSearch}>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="ค้นหาเทมเพลต..."
                className="h-[26px] w-36 rounded-full border border-neutral-200 bg-neutral-50 px-3 text-xs text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
              />
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
