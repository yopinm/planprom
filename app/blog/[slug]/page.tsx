import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getPostBySlug } from '@/lib/blog'
import type { BlogPost } from '@/lib/blog'
import { getDbPostBySlug } from '@/lib/blog-db'
import { renderMarkdown } from '@/lib/markdown'

export const dynamic = 'force-dynamic'

async function resolvePost(slug: string): Promise<BlogPost | null> {
  const decoded = (() => { try { return decodeURIComponent(slug) } catch { return slug } })()
  const dbPost = await getDbPostBySlug(decoded) ?? await getDbPostBySlug(slug)
  if (dbPost) return dbPost
  return getPostBySlug(decoded) ?? getPostBySlug(slug) ?? null
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const post = await resolvePost(slug)
  if (!post) return {}
  return {
    title: `${post.title} · Planprom`,
    description: post.description,
    alternates: { canonical: `https://www.planprom.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
  }
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const post = await resolvePost(slug)
  if (!post) notFound()

  const html = renderMarkdown(post.content)

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Back */}
        <Link href="/blog" className="text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-black transition">
          ← บทความทั้งหมด
        </Link>

        {/* Meta */}
        <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
            {post.category === 'guide' ? 'คู่มือ' : post.category === 'tips' ? 'เทคนิค' : post.category === 'review' ? 'รีวิว' : 'ข่าวสาร'}
          </span>
          <span>·</span>
          <span>{post.readingTimeMin} นาทีอ่าน</span>
          <span>·</span>
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        </div>

        {/* Title */}
        <h1 className="mt-4 text-2xl font-black leading-tight text-black sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">{post.description}</p>

        {/* Author */}
        <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-[10px] font-black text-white">PP</div>
          <div>
            <p className="text-xs font-black text-black">{post.author.name}</p>
            <p className="text-[10px] text-neutral-400">{post.author.role}</p>
          </div>
        </div>

        {/* Content */}
        <article
          className="mt-8 border-t border-neutral-100 pt-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-neutral-100 pt-6">
            {post.tags.map(tag => (
              <span key={tag} className="rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-bold text-neutral-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-6 text-center">
          <p className="text-sm font-black text-amber-800">พร้อมใช้งานเทมเพลตแล้ว?</p>
          <p className="mt-1 text-xs text-amber-700">ดาวน์โหลด PDF พร้อมใช้ ราคาเริ่มต้น ฿30</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/templates"
              className="rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-amber-700"
            >
              ดูเทมเพลต →
            </Link>
            <Link
              href="/blog"
              className="rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-black text-neutral-600 transition hover:border-black"
            >
              บทความอื่นๆ
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
