'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { togglePinAction, togglePostPublishAction, approveDraftAction } from './actions'
import { DeletePostButton } from './DeletePostButton'

type Post = {
  id: string
  slug: string
  title: string
  status: string
  readingTimeMin: number
  pinned: boolean
}

type Tab = 'all' | 'published' | 'draft' | 'pending'

const TAB_STATUS: Record<Exclude<Tab, 'all'>, string> = {
  published: 'published',
  draft: 'draft',
  pending: 'pending_review',
}

export function BlogListClient({ posts }: { posts: Post[] }) {
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  const counts: Record<Tab, number> = {
    all: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
    pending: posts.filter(p => p.status === 'pending_review').length,
  }

  const filtered = useMemo(() => {
    let r = tab === 'all' ? posts : posts.filter(p => p.status === TAB_STATUS[tab])
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(p => p.title.toLowerCase().includes(q))
    }
    return r
  }, [posts, tab, search])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',       label: 'ทั้งหมด' },
    { key: 'published', label: 'Published' },
    { key: 'draft',     label: 'Draft' },
    { key: 'pending',   label: 'รออนุมัติ' },
  ]

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {TABS.map(({ key, label }) =>
            counts[key] > 0 || key === 'all' ? (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full px-3 py-1 text-[11px] font-black transition ${
                  tab === key
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                {label} <span className="opacity-60">({counts[key]})</span>
              </button>
            ) : null
          )}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 ค้นหาชื่อบทความ…"
          className="ml-auto w-44 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs focus:border-black focus:outline-none"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400">
          ไม่พบบทความ
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {filtered.map(post => (
            <div key={post.id} className="flex items-center gap-3 px-5 py-4">
              <span className={`shrink-0 text-lg ${
                post.status === 'pending_review' ? '' : post.pinned ? 'text-amber-500' : 'text-neutral-200'
              }`}>
                {post.status === 'pending_review' ? '🤖' : '📌'}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-neutral-900">{post.title}</p>
                <p className="mt-0.5 font-mono text-xs text-neutral-400">/blog/{post.slug}</p>
              </div>

              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                post.status === 'published'     ? 'bg-green-100 text-green-700'
                : post.status === 'pending_review' ? 'bg-indigo-100 text-indigo-700'
                : 'bg-neutral-100 text-neutral-500'
              }`}>
                {post.status === 'published' ? 'Published' : post.status === 'pending_review' ? 'AI Draft' : 'Draft'}
              </span>

              <span className="shrink-0 text-xs text-neutral-400">{post.readingTimeMin} นาที</span>

              <div className="flex shrink-0 gap-1">
                {post.status === 'pending_review' ? (
                  <>
                    <Link
                      href={`/admin/seo/${post.id}/edit`}
                      className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-bold text-neutral-500 hover:bg-neutral-200 transition"
                    >
                      แก้ไข
                    </Link>
                    <form action={approveDraftAction}>
                      <input type="hidden" name="id" value={post.id} />
                      <button type="submit" className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition">
                        Approve ✓
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <form action={togglePinAction}>
                      <input type="hidden" name="id" value={post.id} />
                      <input type="hidden" name="pinned" value={String(post.pinned)} />
                      <button type="submit" className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        post.pinned
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-amber-100 hover:text-amber-700'
                      }`}>
                        {post.pinned ? 'เอาออก' : 'ปักหมุด'}
                      </button>
                    </form>
                    <form action={togglePostPublishAction}>
                      <input type="hidden" name="id" value={post.id} />
                      <input type="hidden" name="status" value={post.status} />
                      <button type="submit" className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        post.status === 'published'
                          ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}>
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </form>
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-bold text-neutral-500 hover:bg-neutral-200 transition"
                    >
                      ดู
                    </Link>
                  </>
                )}
                <DeletePostButton id={post.id} title={post.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
