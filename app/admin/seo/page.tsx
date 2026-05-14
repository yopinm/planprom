import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { getAllPosts } from '@/lib/blog'
import { getAllDbPosts } from '@/lib/blog-db'
import { UploadDocx } from './UploadDocx'
import { importStaticPostAction } from './actions'
import { DeletePostButton } from './DeletePostButton'
import { BlogListClient } from './BlogListClient'

export const metadata: Metadata = {
  title: 'Blog Manager · Admin — Planprom',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminSeoPage() {
  await requireAdminSession('/admin/seo')

  const [dbPosts, staticPosts] = await Promise.all([
    getAllDbPosts(),
    Promise.resolve(getAllPosts()),
  ])

  const pinnedCount = dbPosts.filter(p => p.pinned).length

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              📝 Blog Manager
            </div>
            <h1 className="mt-2 text-2xl font-black text-black">Blog &amp; Content Management</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {dbPosts.length} บทความใน DB · {pinnedCount} ปักหมุด · {staticPosts.length} บทความ built-in
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/seo/new"
              className="rounded-xl bg-black px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-neutral-800 transition"
            >
              ✏️ เขียนใหม่
            </Link>
            <Link
              href="/blog"
              target="_blank"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition"
            >
              ดูหน้า Blog →
            </Link>
          </div>
        </div>

        {/* Upload */}
        <div className="mb-8">
          <UploadDocx />
        </div>

        {/* DB Posts — search + filter client component */}
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-neutral-500">
            บทความใน DB ({dbPosts.length})
          </h2>
          {dbPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-400">
              ยังไม่มีบทความ — อัพโหลด .docx หรือกด &quot;✏️ เขียนใหม่&quot; เพื่อเริ่มต้น
            </div>
          ) : (
            <BlogListClient
              posts={dbPosts.map(p => ({
                id: p.id,
                slug: p.slug,
                title: p.title,
                status: p.status,
                readingTimeMin: p.readingTimeMin,
                pinned: p.pinned,
              }))}
            />
          )}
        </div>

        {/* Static built-in posts */}
        <div>
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-neutral-500">
            บทความ Built-in (Static · {staticPosts.length})
          </h2>
          <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {staticPosts.map(post => {
              const dbMatch = dbPosts.find(d => d.slug === post.slug)
              const inDb = !!dbMatch
              return (
                <div key={post.slug} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="shrink-0 text-base text-neutral-300">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-700">{post.title}</p>
                    <p className="font-mono text-xs text-neutral-400">/blog/{post.slug}</p>
                  </div>
                  {inDb && (
                    <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-600">
                      ใน DB แล้ว
                    </span>
                  )}
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-500">
                    Built-in
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">{post.readingTimeMin} นาที</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="shrink-0 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-bold text-neutral-500 hover:bg-neutral-200"
                  >
                    ดู
                  </Link>
                  <form action={importStaticPostAction}>
                    <input type="hidden" name="slug" value={post.slug} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-200 transition"
                    >
                      แก้ไข
                    </button>
                  </form>
                  {inDb && dbMatch && (
                    <DeletePostButton id={dbMatch.id} title={post.title} />
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-neutral-400">กด &quot;แก้ไข&quot; เพื่อ import บทความเข้า DB แล้วแก้ไขได้ทันที (DB version จะ override static)</p>
        </div>

      </div>
    </main>
  )
}
