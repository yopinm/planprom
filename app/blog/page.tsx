import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import { getPublishedDbPosts } from '@/lib/blog-db'

export const metadata: Metadata = {
  title: 'บทความ · Planprom',
  description: 'บทความแนะนำการใช้เทมเพลต PDF แพลนเนอร์ และ Checklist สำหรับธุรกิจและชีวิตประจำวัน',
  alternates: { canonical: 'https://www.planprom.com/blog' },
}

export const revalidate = 3600

const CATEGORY_LABEL: Record<string, string> = {
  guide: 'คู่มือ',
  review: 'รีวิว',
  news: 'ข่าวสาร',
  tips: 'เทคนิค',
}

export default async function BlogPage() {
  const [staticPosts, dbPosts] = await Promise.all([
    Promise.resolve(getAllPosts()),
    getPublishedDbPosts(),
  ])

  const dbSlugs = new Set(dbPosts.map(p => p.slug))
  const posts = [...dbPosts, ...staticPosts.filter(p => !dbSlugs.has(p.slug))]

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-3xl px-4 py-12">

        <div className="mb-8">
          <Link href="/" className="text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-black transition">
            ← หน้าแรก
          </Link>
          <h1 className="mt-4 text-3xl font-black text-black tracking-tight">บทความ</h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            คู่มือ เทคนิค และแนวทางการใช้เทมเพลต PDF ให้ได้ผลจริง
          </p>
        </div>

        <div className="space-y-4">
          {posts.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-3xl border border-neutral-200 bg-white px-6 py-5 shadow-sm transition hover:border-amber-400 hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                  {CATEGORY_LABEL[post.category] ?? post.category}
                </span>
                <span>·</span>
                <span>{post.readingTimeMin} นาที</span>
                <span>·</span>
                <span>{new Date(post.publishedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <h2 className="mt-2 text-base font-black text-black group-hover:text-amber-700 transition leading-snug">
                {post.title}
              </h2>
              <p className="mt-1.5 text-sm text-neutral-500 line-clamp-2">{post.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-6 text-center">
          <p className="text-sm font-black text-amber-800">พร้อมใช้งานเทมเพลตแล้ว?</p>
          <p className="mt-1 text-xs text-amber-700">ดูเทมเพลต PDF พร้อมดาวน์โหลด ราคาเริ่มต้น ฿20</p>
          <Link
            href="/templates"
            className="mt-4 inline-block rounded-2xl bg-amber-600 px-6 py-2.5 text-sm font-black text-white transition hover:bg-amber-700"
          >
            ดูเทมเพลตทั้งหมด →
          </Link>
        </div>

      </div>
    </main>
  )
}
