// /admin/templates/[id]/revise — DC-8 Engine content revision page
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { ReviseClient } from './ReviseClient'
import type { ChecklistEngineData, PlannerEngineData, PlannerEngineDataV2, PlannerPipelineData, PlannerPipelineDataV4 } from '@/lib/engine-types'

export const metadata: Metadata = {
  title: 'แก้ไขเนื้อหา — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Template = {
  id: string; slug: string; title: string
  engine_type: string | null; engine_data: unknown
  watermark_text: string | null
}

export default async function RevisePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession('/admin/login')
  const { id } = await params

  const [t] = await db<Template[]>`
    SELECT id, slug, title, engine_type, engine_data, watermark_text
    FROM templates WHERE id = ${id} LIMIT 1
  `.catch(() => [] as Template[])

  if (!t) notFound()
  if (!t.engine_type || !t.engine_data) {
    return (
      <main className="min-h-screen bg-neutral-50 pb-20">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Link href={`/admin/templates/${id}/edit`} className="text-xs font-bold text-neutral-400 hover:text-black">← แก้ไข Template</Link>
          <p className="mt-8 text-center text-neutral-500">Template นี้ไม่มี engine_data — ไม่สามารถแก้ไขผ่านระบบนี้ได้</p>
        </div>
      </main>
    )
  }

  if (t.engine_type === 'form') {
    return (
      <main className="min-h-screen bg-neutral-50 pb-20">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Link href={`/admin/templates/${id}/edit`} className="text-xs font-bold text-neutral-400 hover:text-black">← แก้ไข Template</Link>
          <h1 className="mt-2 text-2xl font-black text-black">แก้ไขเนื้อหา</h1>
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="font-black text-neutral-800 mb-1">Form Template</p>
            <p className="text-sm text-neutral-500">ฟอร์มนี้สร้างจาก Form Builder — ระบบแก้ไขเนื้อหาฟอร์มยังไม่รองรับใน /revise</p>
            <p className="text-xs text-amber-700 mt-3">หากต้องการแก้ไขฟอร์ม ให้สร้างฟอร์มใหม่ใน <Link href="/admin/form-builder" className="underline font-bold">Form Builder</Link></p>
          </div>
        </div>
      </main>
    )
  }

  const [{ max_rev }] = await db<{ max_rev: string | null }[]>`
    SELECT MAX(revision_number)::text AS max_rev FROM template_revisions WHERE template_id = ${id}
  `.catch(() => [{ max_rev: null }])

  const nextRevisionNumber = Number(max_rev ?? 0) + 1

  // category name for checklist watermark label
  let categoryName: string | undefined
  if (t.engine_type === 'checklist') {
    const [cat] = await db<{ name: string }[]>`
      SELECT tc.name FROM template_categories tc
      JOIN template_category_links tcl ON tcl.category_id = tc.id
      WHERE tcl.template_id = ${id} LIMIT 1
    `.catch(() => [] as { name: string }[])
    categoryName = cat?.name
  }

  // engine_data stored as double-encoded JSON string via JSON.stringify() in actions.ts — parse if needed
  const rawEngineData = typeof t.engine_data === 'string'
    ? JSON.parse(t.engine_data)
    : t.engine_data

  const isPipelineV4 = t.engine_type === 'pipeline' &&
    (rawEngineData as PlannerPipelineDataV4)?.meta?.schemaVersion === '4.0'

  const engineData =
    t.engine_type === 'checklist' ? (rawEngineData as ChecklistEngineData) :
    isPipelineV4                  ? (rawEngineData as PlannerPipelineDataV4) :
    t.engine_type === 'pipeline'  ? (rawEngineData as PlannerPipelineData) :
    (rawEngineData as PlannerEngineData | PlannerEngineDataV2)

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href={`/admin/templates/${id}/edit`} className="text-xs font-bold text-neutral-400 hover:text-black">← แก้ไข Template</Link>
        <div className="mt-2 flex items-baseline gap-3">
          <h1 className="text-2xl font-black text-black">แก้ไขเนื้อหา</h1>
          <span className="text-sm text-neutral-400 font-mono">{t.slug}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-black uppercase">
            {t.engine_type === 'checklist' ? '✅ Checklist' : '📅 Planner'}
          </span>
          <span className="text-xs text-neutral-400">Revision {nextRevisionNumber} (ถัดไป)</span>
        </div>

        <div className="mt-6">
          <ReviseClient
            templateId={id}
            slug={t.slug}
            engineType={t.engine_type as 'checklist' | 'planner' | 'pipeline'}
            initialData={engineData}
            nextRevisionNumber={nextRevisionNumber}
            categoryName={categoryName}
          />
        </div>
      </div>
    </main>
  )
}
