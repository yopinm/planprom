// /admin/templates/[id]/revisions — DC-8 Revision history list
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'ประวัติ Revision — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Revision = {
  id: string
  revision_number: number
  pdf_path: string
  preview_path: string | null
  change_note: string | null
  created_at: string
}

type Template = { id: string; slug: string; title: string; engine_type: string | null }

export default async function RevisionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession('/admin/login')
  const { id } = await params

  const [t] = await db<Template[]>`
    SELECT id, slug, title, engine_type FROM templates WHERE id = ${id} LIMIT 1
  `.catch(() => [] as Template[])

  if (!t) notFound()

  const revisions = await db<Revision[]>`
    SELECT id, revision_number, pdf_path, preview_path, change_note, created_at
    FROM template_revisions
    WHERE template_id = ${id}
    ORDER BY revision_number DESC
  `.catch(() => [] as Revision[])

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href={`/admin/templates/${id}/edit`} className="text-xs font-bold text-neutral-400 hover:text-black">← แก้ไข Template</Link>
        <div className="mt-2 flex items-baseline gap-3">
          <h1 className="text-2xl font-black text-black">ประวัติ Revision</h1>
          <span className="text-sm text-neutral-400 font-mono">{t.slug}</span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-400">{revisions.length} revision{revisions.length !== 1 ? 's' : ''}</p>

        <div className="mt-6 space-y-3">
          {revisions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
              <p className="text-2xl">📄</p>
              <p className="mt-2 text-sm font-bold text-neutral-400">ยังไม่มี revision</p>
              <Link href={`/admin/templates/${id}/revise`}
                className="mt-3 inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white hover:bg-amber-700">
                แก้ไขเนื้อหาตอนนี้ →
              </Link>
            </div>
          )}

          {revisions.map(r => (
            <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-black">
                      Rev {r.revision_number}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {new Date(r.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  {r.change_note && (
                    <p className="mt-1.5 text-sm text-neutral-700">{r.change_note}</p>
                  )}
                  {!r.change_note && (
                    <p className="mt-1.5 text-xs text-neutral-400 italic">ไม่มีหมายเหตุ</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {r.preview_path && (
                    <img src={r.preview_path} alt={`rev-${r.revision_number}`}
                      className="h-16 w-12 rounded-lg border border-neutral-200 object-cover" />
                  )}
                  <a href={r.pdf_path} target="_blank" rel="noopener noreferrer"
                    className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-100 transition">
                    ดาวน์โหลด PDF →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Link href={`/admin/templates/${id}/revise`}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black text-white hover:bg-amber-700 transition">
            + แก้ไขเนื้อหา (Revision ใหม่)
          </Link>
          <Link href={`/admin/templates/${id}/edit`}
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-black text-neutral-600 hover:border-black transition">
            ← กลับหน้าแก้ไข
          </Link>
        </div>
      </div>
    </main>
  )
}
