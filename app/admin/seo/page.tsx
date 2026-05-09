import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { getAllPosts } from '@/lib/blog'
import { getAllDbPosts } from '@/lib/blog-db'

export const metadata: Metadata = {
  title: 'Blog SEO · Admin',
  robots: { index: false, follow: false },
}

const CATEGORY_LABEL: Record<string, string> = {
  guide: 'คู่มือ',
  review: 'รีวิว',
  news: 'ข่าวสาร',
  tips: 'เทคนิค',
}

export default async function AdminSeoPage() {
  await requireAdminSession('/admin/seo')

  const [staticPosts, dbPosts] = await Promise.all([
    Promise.resolve(getAllPosts()),
    getAllDbPosts(),
  ])

  const dbSlugs = new Set(dbPosts.map(p => p.slug))
  const allPosts = [
    ...dbPosts.map(p => ({ ...p, source: 'db' as const })),
    ...staticPosts
      .filter(p => !dbSlugs.has(p.slug))
      .map(p => ({ ...p, source: 'static' as const, status: 'published' as const })),
  ]

  const published = allPosts.filter(p => p.status === 'published').length
  const draft = allPosts.filter(p => p.status === 'draft').length

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8">

        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              📝 Blog SEO
            </div>
            <h1 className="mt-2 text-2xl font-black text-black">Blog &amp; Content Management</h1>
            <p className="mt-1 text-sm text-neutral-500">บทความ SEO สำหรับ planprom.com</p>
          </div>
          <Link href="/blog" target="_blank"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition">
            ดู Blog →
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-center shadow-sm">
            <p className="text-2xl font-black text-black">{allPosts.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">บทความทั้งหมด</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-white px-4 py-4 text-center shadow-sm">
            <p className="text-2xl font-black text-green-600">{published}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Published</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-center shadow-sm">
            <p className="text-2xl font-black text-neutral-400">{draft}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Draft</p>
          </div>
        </div>

        {/* Post List */}
        <div className="mt-8 space-y-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-neutral-400">บทความทั้งหมด</p>
          {allPosts.map(post => (
            <div key={post.slug}
              className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    post.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {post.status === 'published' ? 'Live' : 'Draft'}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {CATEGORY_LABEL[post.category] ?? post.category}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    post.source === 'db'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-neutral-50 text-neutral-400'
                  }`}>
                    {post.source === 'db' ? 'DB' : 'Static'}
                  </span>
                </div>
                <p className="mt-1.5 font-black text-black text-sm leading-snug">{post.title}</p>
                <p className="mt-0.5 text-xs text-neutral-400 font-mono">/blog/{post.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/blog/${post.slug}`} target="_blank"
                  className="rounded-xl border border-neutral-200 px-3 py-1.5 text-[11px] font-black text-neutral-500 hover:border-black hover:text-black transition">
                  ดู
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* SEO Checklist */}
        <div className="mt-10 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-black text-black">SEO Checklist</h2>
          <div className="mt-4 space-y-2.5 text-sm">
            {[
              { done: true,  text: '/blog index page — live' },
              { done: true,  text: '/blog/[slug] pages — live' },
              { done: true,  text: 'Metadata title + description ทุกบทความ' },
              { done: true,  text: 'Canonical URL ทุกหน้า' },
              { done: true,  text: 'OpenGraph tags (title, description, publishedTime)' },
              { done: false, text: 'Sitemap รวม /blog/* — ตรวจสอบ /sitemap.xml' },
              { done: false, text: 'Internal links จาก /templates → /blog' },
              { done: false, text: 'Schema Article markup (JSON-LD)' },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-2.5">
                <span className={`mt-0.5 text-base ${item.done ? 'text-green-500' : 'text-neutral-300'}`}>
                  {item.done ? '✅' : '⬜'}
                </span>
                <span className={item.done ? 'text-neutral-700' : 'text-neutral-400'}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
