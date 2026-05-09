'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  defaultQuery: string
  category?: string
  price?: string
}

export function TemplateSearchForm({ defaultQuery, category, price }: Props) {
  const [query, setQuery] = useState(defaultQuery)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    if (price) params.set('price', price)
    router.push(`/templates${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="ค้นหาเทมเพลต เช่น แพลนเนอร์ งบประมาณ เรซูเม่..."
        className="h-11 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
      />
      <button
        type="submit"
        className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-95"
      >
        ค้นหา
      </button>
    </form>
  )
}
