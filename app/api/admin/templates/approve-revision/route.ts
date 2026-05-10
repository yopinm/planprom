// POST /api/admin/templates/approve-revision — DC-8
// INSERT template_revisions + UPDATE templates (engine_data, pdf_path, preview_path)
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: {
    template_id: string
    engine_data: unknown
    pdf_path: string
    preview_path: string | null
    change_note: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { template_id, engine_data, pdf_path, preview_path, change_note } = body
  if (!template_id || !engine_data || !pdf_path) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const [{ max_rev }] = await db<{ max_rev: string | null }[]>`
      SELECT MAX(revision_number)::text AS max_rev
      FROM template_revisions WHERE template_id = ${template_id}
    `
    const revisionNumber = Number(max_rev ?? 0) + 1

    await db`
      INSERT INTO template_revisions
        (template_id, revision_number, engine_data, pdf_path, preview_path, change_note)
      VALUES (
        ${template_id}, ${revisionNumber},
        ${JSON.stringify(engine_data)},
        ${pdf_path},
        ${preview_path ?? null},
        ${change_note || null}
      )
    `
    await db`
      UPDATE templates
      SET engine_data  = ${JSON.stringify(engine_data)},
          pdf_path     = ${pdf_path},
          preview_path = ${preview_path ?? null}
      WHERE id = ${template_id}
    `
    return NextResponse.json({ ok: true, revision_number: revisionNumber })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
