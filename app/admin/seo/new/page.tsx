import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminSession } from '@/lib/admin-auth'
import { createPostAction } from '../actions'
import { BLOG_TEMPLATES } from './templates'

export const metadata: Metadata = {
  title: 'เขียนบทความใหม่ · Admin — Planprom',
  robots: { index: false, follow: false },
}

const INPUT = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white'
const LABEL = 'mb-1 block text-[11px] font-black uppercase tracking-widest text-neutral-400'

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  await requireAdminSession('/admin/seo')
  const { t } = await searchParams
  const tpl = t ? BLOG_TEMPLATES.find(x => x.id === t) : null

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-3xl px-4 py-8">

        <div className="mb-6 flex items-center gap-3">
          <Link
            href={tpl ? '/admin/seo/new' : '/admin/seo'}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition"
          >
            ← {tpl ? 'เลือก Topic ใหม่' : 'กลับ'}
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              ✏️ เขียนบทความใหม่
            </div>
            {tpl && (
              <p className="mt-1 text-xs text-neutral-500">
                Template: {tpl.emoji} {tpl.label}
              </p>
            )}
          </div>
        </div>

        {/* Step 1: Topic picker */}
        {!tpl && (
          <div>
            <p className="mb-4 text-sm text-neutral-500">
              เลือก topic ที่ตรง keyword ที่คนค้นหา — ระบบจะ pre-fill โครงสร้างให้เลย
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BLOG_TEMPLATES.map(template => (
                <Link
                  key={template.id}
                  href={`/admin/seo/new?t=${template.id}`}
                  className="group flex flex-col gap-1.5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-black hover:shadow-md"
                >
                  <span className="text-2xl">{template.emoji}</span>
                  <span className="text-sm font-black text-neutral-800 group-hover:text-black">
                    {template.label}
                  </span>
                  <span className="text-[11px] text-neutral-400 leading-relaxed">
                    {template.keyword}
                  </span>
                </Link>
              ))}

              {/* Blank — custom */}
              <Link
                href="/admin/seo/new?t=blank"
                className="group flex flex-col gap-1.5 rounded-2xl border border-dashed border-neutral-300 bg-white p-4 transition hover:border-black"
              >
                <span className="text-2xl">📄</span>
                <span className="text-sm font-black text-neutral-500 group-hover:text-black">
                  เขียนเอง
                </span>
                <span className="text-[11px] text-neutral-400">ไม่ใช้ template</span>
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Write form */}
        {(tpl || t === 'blank') && (
          <form action={createPostAction} className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

            <div>
              <label className={LABEL}>Title *</label>
              <input
                name="title"
                required
                maxLength={100}
                defaultValue={tpl?.title ?? ''}
                placeholder="ชื่อบทความ — แนะนำ 45–60 ตัวอักษร"
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>Target Keyword</label>
              <input
                name="target_keyword"
                defaultValue={tpl?.keyword ?? ''}
                placeholder="keyword หลักที่คนค้นหา — ใช้เตือนตัวเองขณะเขียน"
                className={INPUT}
              />
              <p className="mt-1 text-[11px] text-neutral-400">ไม่ถูกบันทึกแยก — ใส่ลงในเนื้อหาอย่างเป็นธรรมชาติ</p>
            </div>

            <div>
              <label className={LABEL}>Meta Description (SEO) *</label>
              <textarea
                name="description"
                required
                maxLength={200}
                rows={2}
                defaultValue={tpl?.description ?? ''}
                placeholder="สรุปบทความใน 1–2 ประโยค สำหรับแสดงใน Google — แนะนำ 120–160 ตัวอักษร"
                className={`${INPUT} resize-none`}
              />
            </div>

            <div>
              <label className={LABEL}>Content (Markdown) *</label>
              <textarea
                name="content"
                required
                rows={22}
                defaultValue={tpl?.outline ?? ''}
                className={`${INPUT} font-mono text-xs leading-relaxed`}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                name="submit_type"
                value="draft"
                className="rounded-xl bg-neutral-200 px-5 py-2.5 text-xs font-black text-neutral-700 hover:bg-neutral-300 transition"
              >
                บันทึก Draft
              </button>
              <button
                type="submit"
                name="submit_type"
                value="publish"
                className="rounded-xl bg-black px-5 py-2.5 text-xs font-black text-white hover:bg-neutral-800 transition"
              >
                Publish ทันที
              </button>
            </div>
          </form>
        )}

      </div>
    </main>
  )
}
