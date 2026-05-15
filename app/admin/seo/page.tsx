import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { getAllPosts } from '@/lib/blog'
import { getAllDbPosts, type DbBlogPost } from '@/lib/blog-db'
import { UploadDocx } from './UploadDocx'
import { importStaticPostAction } from './actions'
import { DeletePostButton } from './DeletePostButton'
import { BlogListClient } from './BlogListClient'

function scoreBlogPost(p: DbBlogPost) {
  const titleLen   = p.title.length
  const descLen    = p.description.length
  const wordCount  = p.content.split(/\s+/).filter(Boolean).length
  const linkCount  = (p.content.match(/\/templates\//g) ?? []).length
  const tagCount   = p.tags.length

  const titleScore   = titleLen >= 30 && titleLen <= 60 ? 20 : titleLen >= 20 ? 10 : 0
  const descScore    = descLen >= 160 ? 20 : descLen >= 80 ? 10 : 0
  const contentScore = wordCount >= 600 ? 25 : wordCount >= 300 ? 15 : 0
  const linkScore    = linkCount >= 2 ? 20 : linkCount >= 1 ? 10 : 0
  const tagScore     = tagCount >= 3 ? 15 : tagCount >= 2 ? 10 : tagCount >= 1 ? 5 : 0

  const total = titleScore + descScore + contentScore + linkScore + tagScore
  const grade = total >= 80 ? '🟢' : total >= 50 ? '🟡' : '🔴'

  const dims = [
    { label: 'Title',          score: titleScore,   max: 20, issue: titleLen < 30 ? `สั้นเกิน (${titleLen} ตัว · ต้องการ 30–60)` : titleLen > 60 ? `ยาวเกิน (${titleLen} ตัว)` : '' },
    { label: 'Description',    score: descScore,    max: 20, issue: descLen < 80 ? `description ${descLen} ตัว (ต้องการ ≥80)` : descLen < 160 ? `${descLen} ตัว (≥160 = เต็ม)` : '' },
    { label: 'เนื้อหา',        score: contentScore, max: 25, issue: wordCount < 300 ? `${wordCount} คำ (ต้องการ ≥300)` : wordCount < 600 ? `${wordCount} คำ (≥600 = เต็ม)` : '' },
    { label: 'Internal Links', score: linkScore,    max: 20, issue: linkCount === 0 ? 'ไม่มีลิ้งค์ไป /templates/' : linkCount < 2 ? `${linkCount} ลิ้งค์ (≥2 = เต็ม)` : '' },
    { label: 'Tags',           score: tagScore,     max: 15, issue: tagCount === 0 ? 'ไม่มี tags' : tagCount < 3 ? `${tagCount} tags (≥3 = เต็ม)` : '' },
  ]

  const topIssue     = dims.find(d => d.issue && d.score < d.max)
  const potentialGain = topIssue ? topIssue.max - topIssue.score : 0

  return { total, grade, dims, topIssue, potentialGain }
}

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

        {/* Blog SEO Health Score */}
        {(() => {
          const published = dbPosts.filter(p => p.status === 'published')
          if (published.length === 0) return null
          const scored = published
            .map(p => ({ ...p, health: scoreBlogPost(p) }))
            .sort((a, b) => a.health.total - b.health.total)
          const redCount    = scored.filter(p => p.health.total < 50).length
          const yellowCount = scored.filter(p => p.health.total >= 50 && p.health.total < 80).length
          const greenCount  = scored.filter(p => p.health.total >= 80).length
          return (
            <div className="mb-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-neutral-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Blog SEO Health</p>
                  <p className="text-sm font-bold text-neutral-800">คะแนน SEO บทความ 5 มิติ / 100</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">เรียงจากแย่→ดี · คลิกแถวดู breakdown · เฉพาะ published</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {redCount    > 0 && <span className="rounded-full bg-red-100   px-2.5 py-0.5 text-[10px] font-black text-red-600">🔴 {redCount}</span>}
                  {yellowCount > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-600">🟡 {yellowCount}</span>}
                  {greenCount  > 0 && <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-black text-green-600">🟢 {greenCount}</span>}
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200 divide-y divide-neutral-50 overflow-hidden">
                {scored.map(p => {
                  const { health } = p
                  const barColor = health.grade === '🟢' ? 'bg-green-400' : health.grade === '🟡' ? 'bg-amber-400' : 'bg-red-400'
                  return (
                    <details key={p.id} className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 hover:bg-neutral-50 select-none">
                        <span className="shrink-0 text-base leading-none">{health.grade}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-800 truncate">{p.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1 w-24 rounded-full bg-neutral-100">
                              <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${health.total}%` }} />
                            </div>
                            <span className="text-[10px] text-neutral-400">{health.total}/100</span>
                            {health.topIssue && (
                              <span className="text-[10px] text-amber-500 truncate">⚠ {health.topIssue.issue}</span>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/admin/seo/${p.id}/edit`}
                          className="shrink-0 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-black text-neutral-500 hover:border-amber-400 hover:text-amber-600 transition"
                        >
                          แก้ไข →
                        </Link>
                        <span className="shrink-0 text-neutral-300 text-xs group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="border-t border-neutral-100 bg-neutral-50/50 px-5 py-4">
                        <div className="grid grid-cols-5 gap-2 mb-3">
                          {health.dims.map(d => (
                            <div key={d.label} className="rounded-xl border border-neutral-100 bg-white p-3 text-center">
                              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">{d.label}</p>
                              <p className={`text-lg font-black ${d.score === d.max ? 'text-green-500' : d.score > 0 ? 'text-amber-500' : 'text-red-400'}`}>
                                {d.score}<span className="text-[10px] text-neutral-300">/{d.max}</span>
                              </p>
                              {d.score === d.max
                                ? <p className="text-[9px] text-green-500">✓ ผ่าน</p>
                                : <p className="text-[9px] text-neutral-400">{d.issue}</p>
                              }
                            </div>
                          ))}
                        </div>
                        {health.topIssue && (
                          <p className="text-[10px] font-bold text-amber-600">
                            💡 แก้ {health.topIssue.label} ก่อน → score ~{health.total + health.potentialGain} pt
                          </p>
                        )}
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>
          )
        })()}

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
