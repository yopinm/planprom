import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { updatePostAction } from '../../actions'

export const metadata: Metadata = {
  title: 'แก้ไขบทความ · Admin — Planprom',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const INPUT = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white'
const LABEL = 'mb-1 block text-[11px] font-black uppercase tracking-widest text-neutral-400'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession('/admin/seo')
  const { id } = await params

  const [post] = await db<{ id: string; slug: string; title: string; description: string; content: string; reading_time_min: number }[]>`
    SELECT id, slug, title, description, content, reading_time_min FROM blog_posts WHERE id = ${id} LIMIT 1
  `
  if (!post) notFound()

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-3xl px-4 py-8">

        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/seo"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition"
          >
            ← กลับ
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              ✏️ แก้ไขบทความ
            </div>
            <p className="mt-1 font-mono text-xs text-neutral-400">/blog/{post.slug}</p>
          </div>
        </div>

        <form action={updatePostAction} className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="id" value={post.id} />

          <div>
            <label className={LABEL}>Title *</label>
            <input name="title" required defaultValue={post.title} className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Description (SEO)</label>
            <input name="description" defaultValue={post.description} className={INPUT} placeholder="ประโยคสั้นๆ สำหรับ SEO · สูงสุด 160 ตัวอักษร" maxLength={160} />
          </div>

          <div>
            <label className={LABEL}>เวลาอ่าน (นาที)</label>
            <input name="reading_time_min" type="number" min="1" defaultValue={post.reading_time_min} className={`${INPUT} w-24`} />
          </div>

          <div>
            <label className={LABEL}>Content (Markdown / HTML)</label>
            <textarea
              name="content"
              required
              defaultValue={post.content}
              rows={24}
              className={`${INPUT} font-mono text-xs leading-relaxed`}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-black text-white transition hover:bg-amber-600"
            >
              บันทึก
            </button>
            <Link
              href="/admin/seo"
              className="rounded-xl border border-neutral-200 px-6 py-2.5 text-sm font-bold text-neutral-600 transition hover:border-neutral-400"
            >
              ยกเลิก
            </Link>
          </div>
        </form>

      </div>
    </main>
  )
}
