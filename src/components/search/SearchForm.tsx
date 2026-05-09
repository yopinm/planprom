'use client'

// SearchForm — Client Component
// Handles search input + form submission → navigates to /search?q=...

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { useRouter } from 'next/navigation'

interface SearchFormProps {
  defaultQuery: string
  size?: 'sm' | 'lg'
  submitLabel?: string
}

export function SearchForm({
  defaultQuery,
  size = 'lg',
  submitLabel,
}: SearchFormProps): ReactElement {
  const [query, setQuery] = useState(defaultQuery)
  const router = useRouter()

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const isSmall = size === 'sm'
  const ctaLabel = submitLabel ?? 'ค้นหา'

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full items-center">
      <div className={`pointer-events-none absolute left-3 text-neutral-400 ${isSmall ? 'scale-75' : ''}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={isSmall ? "ค้นหา..." : "ค้นหาสินค้า หรือใส่ลิงก์ Shopee / Lazada"}
        className={`w-full rounded-2xl border border-orange-200 bg-orange-50 pl-10 text-black outline-none transition placeholder:text-neutral-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 ${
          isSmall
            ? 'h-10 pr-20 text-xs'
            : submitLabel
              ? 'h-14 pr-48 text-base font-medium'
              : 'h-14 pr-32 text-base font-medium'
        }`}
        autoFocus={!isSmall}
      />
      <button
        type="submit"
        className={`absolute right-1 font-black text-white transition hover:bg-orange-700 active:scale-95 bg-orange-600 ${
          isSmall ? 'h-8 rounded-lg px-3 text-[10px]' : 'h-11 rounded-xl px-6 text-sm'
        }`}
      >
        {ctaLabel}
      </button>
    </form>
  )
}
