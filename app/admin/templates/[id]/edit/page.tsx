// app/admin/templates/[id]/edit/page.tsx — V15-ADMIN-3 Edit template form
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { updateTemplateAction, approveTemplateAction } from '../../actions'

export const metadata: Metadata = {
  title: 'แก้ไข Template — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const INPUT = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white'
const LABEL = 'mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400'

type Template = {
  id: string; slug: string; title: string; description: string | null
  tier: string; price_baht: number; status: string
  pdf_path: string; preview_path: string | null; thumbnail_path: string | null
  page_count: number | null; has_form_fields: boolean; document_type: string
  published_at: string | null; created_at: string
}

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession('/admin/login')
  const { id } = await params

  const [t] = await db<Template[]>`
    SELECT * FROM templates WHERE id = ${id} LIMIT 1
  `.catch(() => [] as Template[])

  if (!t) notFound()

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/admin/templates" className="text-xs font-bold text-neutral-400 hover:text-black">← Template Manager</Link>
        <h1 className="mt-2 text-2xl font-black text-black">แก้ไข Template</h1>
        <p className="mt-0.5 text-sm text-neutral-500 font-mono">{t.slug}</p>

        <form action={updateTemplateAction} className="mt-8 space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="id" value={t.id} />

          <div>
            <label className={LABEL}>ชื่อ Template *</label>
            <input name="title" required defaultValue={t.title} className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Slug (read-only)</label>
            <input value={t.slug} readOnly className={`${INPUT} cursor-not-allowed font-mono opacity-50`} />
            <p className="mt-1 text-[11px] text-neutral-400">Slug ไม่สามารถแก้ได้หลังสร้างแล้ว (เพื่อ SEO)</p>
          </div>

          <div>
            <label className={LABEL}>คำอธิบาย</label>
            <textarea name="description" rows={3} defaultValue={t.description ?? ''} className={INPUT} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Tier *</label>
              <select name="tier" required defaultValue={t.tier} className={INPUT}>
                <option value="free">Free — ฿0</option>
                <option value="standard">Standard — ฿20</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>จำนวนหน้า</label>
              <input name="page_count" type="number" min="1" defaultValue={t.page_count ?? ''} className={INPUT} />
            </div>
          </div>

          <div>
            <label className={LABEL}>ประเภทเอกสาร *</label>
            <select name="document_type" required defaultValue={t.document_type ?? 'checklist'} className={INPUT}>
              <option value="checklist">✅ Checklist — รายการตรวจสอบ</option>
              <option value="planner">📅 Planner — วางแผนล่วงหน้า</option>
              <option value="form">📝 Form — ฟอร์มกรอกข้อมูล</option>
              <option value="report">📊 Report — รายงาน/สรุปผล</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>PDF Path</label>
            <input name="pdf_path" defaultValue={t.pdf_path} className={`${INPUT} font-mono text-xs`} />
          </div>

          <div>
            <label className={LABEL}>Thumbnail Path (optional)</label>
            <input name="thumbnail_path" defaultValue={t.thumbnail_path ?? ''} className={`${INPUT} font-mono text-xs`} />
          </div>

          <div>
            <label className={LABEL}>Preview Path (watermarked, optional)</label>
            <input name="preview_path" defaultValue={t.preview_path ?? ''} className={`${INPUT} font-mono text-xs`} />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-700">
            <input name="has_form_fields" type="checkbox" value="true" defaultChecked={t.has_form_fields} />
            <span>มี Form Fields (กรอกชื่อ/วันที่ได้ใน PDF)</span>
          </label>

          {/* Draft Preview — approve block */}
          {t.status === 'draft_preview' && (
            <div className="rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-4">
              <p className="text-sm font-black text-violet-800 mb-2">📋 Draft Preview — รอ Approve</p>
              {t.pdf_path && (
                <a
                  href={t.pdf_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 inline-block text-xs font-bold text-violet-600 underline hover:text-violet-800"
                >
                  ดู PDF ที่ generate แล้ว →
                </a>
              )}
              <form action={approveTemplateAction}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-black text-white transition hover:bg-violet-700"
                >
                  ✅ Approve — Publish ทันที
                </button>
              </form>
            </div>
          )}

          {/* Status info */}
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
            <p>สถานะ: <span className="font-black">{t.status}</span>
              {t.published_at && ` · Published ${new Date(t.published_at).toLocaleDateString('th-TH')}`}
            </p>
            <p className="mt-0.5">สร้างเมื่อ: {new Date(t.created_at).toLocaleDateString('th-TH')}</p>
            <p className="mt-0.5 text-amber-600 font-bold">เปลี่ยน Publish/Draft ได้จากหน้า Template Manager</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/admin/templates"
              className="flex-1 rounded-xl border border-neutral-200 py-3 text-center text-sm font-black text-neutral-600 hover:border-black"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-amber-600 py-3 text-sm font-black text-white transition hover:bg-amber-700"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
