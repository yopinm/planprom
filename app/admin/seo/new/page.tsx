import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import {
  createPostAction,
  createBlogTemplateAction,
  updateBlogTemplateAction,
  deleteBlogTemplateAction,
} from '../actions'
import { BLOG_TEMPLATES } from './templates'

export const metadata: Metadata = {
  title: 'เขียนบทความใหม่ · Admin — Planprom',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const INPUT = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white'
const LABEL = 'mb-1 block text-[11px] font-black uppercase tracking-widest text-neutral-400'

type DbTpl = {
  id: string
  emoji: string
  label: string
  keyword: string
  title: string
  description: string
  outline: string
}

async function getTemplates(): Promise<DbTpl[]> {
  try {
    const rows = await db<DbTpl[]>`
      SELECT id, emoji, label, keyword, title, description, outline
      FROM blog_templates
      ORDER BY sort_order ASC, created_at ASC
    `
    if (rows.length === 0) {
      for (let i = 0; i < BLOG_TEMPLATES.length; i++) {
        const t = BLOG_TEMPLATES[i]
        await db`
          INSERT INTO blog_templates (emoji, label, keyword, title, description, outline, sort_order)
          VALUES (${t.emoji}, ${t.label}, ${t.keyword}, ${t.title}, ${t.description}, ${t.outline}, ${i})
        `
      }
      return await db<DbTpl[]>`
        SELECT id, emoji, label, keyword, title, description, outline
        FROM blog_templates ORDER BY sort_order ASC, created_at ASC
      `
    }
    return rows
  } catch {
    return []
  }
}

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; manage?: string; id?: string; title?: string; kw?: string; desc?: string }>
}) {
  await requireAdminSession('/admin/seo')
  const { t, manage, id, title: qTitle, kw, desc: qDesc } = await searchParams

  const templates = await getTemplates()

  // State: pre-fill from SEO Keyword Panel (analytics → seo/new shortcut)
  if (qTitle && kw) {
    const autoOutline = `## ${kw}: คู่มือฉบับสมบูรณ์สำหรับคนไทย\n\n[บทนำ 2-3 ประโยค — keyword: ${kw}]\n\n## ${kw} คืออะไร\n\n[อธิบายความหมายและประโยชน์]\n\n## วิธีใช้ ${kw} ให้ได้ผล\n\n[ขั้นตอนหลัก 5-7 ข้อ]\n\n## ตัวอย่างจริง\n\n[case study หรือสถานการณ์จริง]\n\n## เคล็ดลับและข้อควรระวัง\n\n[tips + common mistakes]\n\n## สรุป\n\n[สรุป + CTA ดาวน์โหลด template ที่ planprom.com/templates]`
    return (
      <main className="min-h-screen bg-neutral-50 pb-20">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/admin/template-analytics#s5" className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition">
              ← กลับ Analytics
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              🔍 จาก SEO Panel
            </div>
          </div>
          <form action={createPostAction} className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div>
              <label className={LABEL}>Title *</label>
              <input name="title" required maxLength={100} defaultValue={qTitle} placeholder="ชื่อบทความ — แนะนำ 45–60 ตัวอักษร" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Target Keyword</label>
              <input name="target_keyword" defaultValue={kw} placeholder="keyword หลัก — ใส่ลงในเนื้อหาอย่างเป็นธรรมชาติ" className={INPUT} />
              <p className="mt-1 text-[11px] text-neutral-400">ไม่ถูกบันทึกแยก</p>
            </div>
            <div>
              <label className={LABEL}>Meta Description (SEO) *</label>
              <textarea name="description" required maxLength={200} rows={2} defaultValue={qDesc ?? ''} placeholder="120–160 ตัวอักษร สำหรับแสดงใน Google" className={`${INPUT} resize-none`} />
            </div>
            <div>
              <label className={LABEL}>Content (Markdown) *</label>
              <textarea name="content" required rows={22} defaultValue={autoOutline} className={`${INPUT} font-mono text-xs leading-relaxed`} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" name="submit_type" value="draft" className="rounded-xl bg-neutral-200 px-5 py-2.5 text-xs font-black text-neutral-700 hover:bg-neutral-300 transition">บันทึก Draft</button>
              <button type="submit" name="submit_type" value="publish" className="rounded-xl bg-black px-5 py-2.5 text-xs font-black text-white hover:bg-neutral-800 transition">Publish ทันที</button>
            </div>
          </form>
        </div>
      </main>
    )
  }

  // State: write blog post
  const writeTpl = t ? templates.find(x => x.id === t) ?? (t === 'blank' ? null : undefined) : undefined
  if (writeTpl !== undefined) {
    return (
      <main className="min-h-screen bg-neutral-50 pb-20">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/admin/seo/new" className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition">
              ← เลือก Topic ใหม่
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              ✏️ เขียนบทความ
            </div>
          </div>
          <form action={createPostAction} className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div>
              <label className={LABEL}>Title *</label>
              <input name="title" required maxLength={100} defaultValue={writeTpl?.title ?? ''} placeholder="ชื่อบทความ — แนะนำ 45–60 ตัวอักษร" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Target Keyword</label>
              <input name="target_keyword" defaultValue={writeTpl?.keyword ?? ''} placeholder="keyword หลัก — ใส่ลงในเนื้อหาอย่างเป็นธรรมชาติ" className={INPUT} />
              <p className="mt-1 text-[11px] text-neutral-400">ไม่ถูกบันทึกแยก</p>
            </div>
            <div>
              <label className={LABEL}>Meta Description (SEO) *</label>
              <textarea name="description" required maxLength={200} rows={2} defaultValue={writeTpl?.description ?? ''} placeholder="120–160 ตัวอักษร สำหรับแสดงใน Google" className={`${INPUT} resize-none`} />
            </div>
            <div>
              <label className={LABEL}>Content (Markdown) *</label>
              <textarea name="content" required rows={22} defaultValue={writeTpl?.outline ?? ''} className={`${INPUT} font-mono text-xs leading-relaxed`} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" name="submit_type" value="draft" className="rounded-xl bg-neutral-200 px-5 py-2.5 text-xs font-black text-neutral-700 hover:bg-neutral-300 transition">บันทึก Draft</button>
              <button type="submit" name="submit_type" value="publish" className="rounded-xl bg-black px-5 py-2.5 text-xs font-black text-white hover:bg-neutral-800 transition">Publish ทันที</button>
            </div>
          </form>
        </div>
      </main>
    )
  }

  // State: edit template
  const editTpl = manage === 'edit' && id ? templates.find(x => x.id === id) : null
  if (manage === 'edit' && editTpl) {
    return (
      <main className="min-h-screen bg-neutral-50 pb-20">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/admin/seo/new" className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition">← กลับ</Link>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">แก้ไข Topic</div>
          </div>
          <form action={updateBlogTemplateAction} className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <input type="hidden" name="id" value={editTpl.id} />
            <div className="flex gap-3">
              <div className="w-20">
                <label className={LABEL}>Emoji</label>
                <input name="emoji" defaultValue={editTpl.emoji} className={INPUT} />
              </div>
              <div className="flex-1">
                <label className={LABEL}>Label *</label>
                <input name="label" required defaultValue={editTpl.label} className={INPUT} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Keyword *</label>
              <input name="keyword" required defaultValue={editTpl.keyword} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Title (pre-fill) *</label>
              <input name="title" required defaultValue={editTpl.title} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Description (pre-fill) *</label>
              <textarea name="description" required rows={2} defaultValue={editTpl.description} className={`${INPUT} resize-none`} />
            </div>
            <div>
              <label className={LABEL}>Outline (pre-fill content)</label>
              <textarea name="outline" rows={14} defaultValue={editTpl.outline} className={`${INPUT} font-mono text-xs leading-relaxed`} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black text-white hover:bg-amber-600 transition">บันทึก</button>
              <Link href="/admin/seo/new" className="rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-600 hover:border-neutral-400 transition">ยกเลิก</Link>
            </div>
          </form>
        </div>
      </main>
    )
  }

  // State: add template
  if (manage === 'add') {
    return (
      <main className="min-h-screen bg-neutral-50 pb-20">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/admin/seo/new" className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition">← กลับ</Link>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">➕ เพิ่ม Topic ใหม่</div>
          </div>
          <form action={createBlogTemplateAction} className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex gap-3">
              <div className="w-20">
                <label className={LABEL}>Emoji</label>
                <input name="emoji" defaultValue="📝" className={INPUT} />
              </div>
              <div className="flex-1">
                <label className={LABEL}>Label *</label>
                <input name="label" required placeholder="เช่น วางแผนเกษียณ" className={INPUT} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Keyword *</label>
              <input name="keyword" required placeholder="keyword หลักที่คนค้นหา" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Title (pre-fill) *</label>
              <input name="title" required placeholder="ชื่อบทความที่จะ pre-fill ให้ admin" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Description (pre-fill) *</label>
              <textarea name="description" required rows={2} placeholder="meta description template" className={`${INPUT} resize-none`} />
            </div>
            <div>
              <label className={LABEL}>Outline (pre-fill content)</label>
              <textarea name="outline" rows={14} placeholder="## หัวข้อหลัก&#10;&#10;[เนื้อหา]&#10;&#10;## สรุป&#10;&#10;[CTA]" className={`${INPUT} font-mono text-xs leading-relaxed`} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="rounded-xl bg-black px-5 py-2.5 text-xs font-black text-white hover:bg-neutral-800 transition">เพิ่ม Topic</button>
              <Link href="/admin/seo/new" className="rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold text-neutral-600 hover:border-neutral-400 transition">ยกเลิก</Link>
            </div>
          </form>
        </div>
      </main>
    )
  }

  // State: picker grid (default)
  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin/seo" className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition">← กลับ</Link>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">✏️ เขียนบทความใหม่</div>
        </div>

        <p className="mb-4 text-sm text-neutral-500">
          เลือก topic — ระบบจะ pre-fill โครงสร้างให้เลย
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {templates.map(tpl => (
            <div key={tpl.id} className="group relative flex flex-col gap-1.5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:border-neutral-400 transition">
              <Link href={`/admin/seo/new?t=${tpl.id}`} className="absolute inset-0 rounded-2xl" />
              <span className="text-2xl">{tpl.emoji}</span>
              <span className="text-sm font-black text-neutral-800">{tpl.label}</span>
              <span className="text-[11px] text-neutral-400 leading-relaxed">{tpl.keyword}</span>
              <div className="relative z-10 mt-1 flex gap-1">
                <Link
                  href={`/admin/seo/new?manage=edit&id=${tpl.id}`}
                  className="rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-500 hover:bg-amber-100 hover:text-amber-700 transition"
                >
                  แก้
                </Link>
                <form action={deleteBlogTemplateAction}>
                  <input type="hidden" name="id" value={tpl.id} />
                  <button type="submit" className="rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-500 hover:bg-red-100 hover:text-red-600 transition">
                    ลบ
                  </button>
                </form>
              </div>
            </div>
          ))}

          {/* เพิ่ม topic ใหม่ */}
          <Link
            href="/admin/seo/new?manage=add"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-4 text-center transition hover:border-black"
          >
            <span className="text-2xl">➕</span>
            <span className="text-sm font-black text-neutral-500">เพิ่ม Topic</span>
          </Link>

          {/* เขียนเอง */}
          <Link
            href="/admin/seo/new?t=blank"
            className="flex flex-col gap-1.5 rounded-2xl border border-dashed border-neutral-300 bg-white p-4 transition hover:border-black"
          >
            <span className="text-2xl">📄</span>
            <span className="text-sm font-black text-neutral-500">เขียนเอง</span>
            <span className="text-[11px] text-neutral-400">ไม่ใช้ template</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
