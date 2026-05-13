// app/admin/templates/[id]/edit/page.tsx — V15-ADMIN-3 Edit template form
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { updateTemplateAction, approveTemplateAction, setFeaturedWeeklyAction, clearFeaturedWeeklyAction } from '../../actions'
import { GenerateUnlockCodeSection } from './GenerateUnlockCodeSection'

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
  engine_type: string | null; is_featured_weekly: boolean; is_request_only: boolean
}

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession('/admin/login')
  const { id } = await params

  const [t] = await db<Template[]>`
    SELECT * FROM templates WHERE id = ${id} LIMIT 1
  `.catch(() => [] as Template[])

  const [{ rev_count }] = t?.engine_type
    ? await db<{ rev_count: string }[]>`
        SELECT COUNT(*)::text AS rev_count FROM template_revisions WHERE template_id = ${id}
      `.catch(() => [{ rev_count: '0' }])
    : [{ rev_count: '0' }]

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

          <label className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            <input name="is_request_only" type="checkbox" value="true" defaultChecked={t.is_request_only} />
            <span>🔒 Request Only — ลูกค้าต้องมี Unlock Code ถึงจะซื้อได้</span>
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

        {/* Featured Weekly Toggle — HOME-FEAT-1 */}
        <div className={`mt-6 rounded-3xl border p-5 ${t.is_featured_weekly ? 'border-amber-400 bg-amber-50' : 'border-neutral-200 bg-white'}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-1">Featured หน้าโฮม</p>
              <p className="text-sm font-bold text-neutral-700">
                {t.is_featured_weekly ? '⭐ กำลังแสดงในการ์ด "แนะนำสัปดาห์นี้"' : '☆ ไม่ได้ถูกเลือกเป็น Featured'}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">มีได้แค่ 1 template — กด Set จะยกเลิก template เดิมอัตโนมัติ</p>
            </div>
            {t.is_featured_weekly ? (
              <form action={clearFeaturedWeeklyAction}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-black text-neutral-600 hover:bg-neutral-100 transition">
                  ยกเลิก Featured
                </button>
              </form>
            ) : (
              <form action={setFeaturedWeeklyAction}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white hover:bg-amber-600 transition">
                  ⭐ Set Featured
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Unlock Code — J13 */}
        {t.is_request_only && t.status === 'published' && (
          <GenerateUnlockCodeSection templateId={t.id} />
        )}

        {/* Engine Section — DC-8 */}
        {t.engine_type && (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-1">Engine Content</p>
                <div className="flex items-center gap-2">
                  <span className="font-black text-neutral-900">
                    {t.engine_type === 'checklist' ? '✅ Checklist' :
                     t.engine_type === 'form'      ? '📋 Form' : '📅 Planner'}
                  </span>
                  {t.engine_type !== 'form' && (
                    <span className="rounded-full bg-white border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {rev_count} revision{Number(rev_count) !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {t.engine_type === 'form' ? (
                  <Link
                    href={`/admin/form-builder/${t.id}`}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white hover:bg-amber-700 transition"
                  >
                    แก้ไขเนื้อหา →
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/admin/templates/${t.id}/revisions`}
                      className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-black text-amber-700 hover:bg-amber-100 transition"
                    >
                      ดูประวัติ →
                    </Link>
                    <Link
                      href={`/admin/templates/${t.id}/revise`}
                      className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white hover:bg-amber-700 transition"
                    >
                      แก้ไขเนื้อหา →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
