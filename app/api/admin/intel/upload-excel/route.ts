import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

const VALID_ENGINE = new Set(['checklist', 'form', 'report', 'planner', 'pipeline'])

function parseRanking(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const s = String(raw).trim()
  // "10/10" → 10 | "9/10" → 9 | "8" → 8
  const slash = s.match(/^(\d+)\s*\//)
  const n = slash ? parseInt(slash[1], 10) : parseInt(s, 10)
  if (isNaN(n) || n < 1 || n > 10) return null
  return n
}

function normalizeEngine(raw: unknown): string | null {
  if (!raw) return null
  const s = String(raw).trim().toLowerCase()
  if (s === 'checklist' || s === 'เช็คลิสต์') return 'checklist'
  if (s === 'form' || s === 'ฟอร์ม' || s === 'แบบฟอร์ม') return 'form'
  if (s === 'report' || s === 'รายงาน') return 'report'
  if (s === 'planner' || s === 'แพลนเนอร์' || s === 'pipeline') return 'planner'
  if (VALID_ENGINE.has(s)) return s
  return null
}

export async function POST(req: NextRequest) {
  await requireAdminSession('/admin/login')

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ .xlsx หรือ .xls' }, { status: 400 })
  }

  const buf  = Buffer.from(await file.arrayBuffer())
  const wb   = XLSX.read(buf, { type: 'buffer' })
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  if (!rows.length) return NextResponse.json({ error: 'ไฟล์ว่างเปล่า' }, { status: 400 })

  // Detect columns — รองรับหลาย header format
  const firstRow  = rows[0]
  const headers   = Object.keys(firstRow)
  const colThai   = headers.find(h => /ไทย|idea_text|ชื่อ/i.test(h))
  const colEn     = headers.find(h => /อังกฤษ|title_en|english/i.test(h))
  const colRank   = headers.find(h => /อันดับ|ranking|rank|คะแนน|need/i.test(h))
  const colEngine = headers.find(h => /ประเภท|engine|type/i.test(h))

  if (!colThai || !colRank || !colEngine) {
    return NextResponse.json({
      error: `ไม่พบคอลัมน์ที่ต้องการ — ต้องมี: ชื่อไทย, อันดับคะแนน, ประเภท (header ที่พบ: ${headers.join(', ')})`,
    }, { status: 400 })
  }

  const valid: { idea_text: string; title_en: string | null; ranking_need: number; engine_type: string }[] = []
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row     = rows[i]
    const ideaRaw = String(row[colThai] ?? '').trim()
    const engRaw  = normalizeEngine(row[colEngine])
    const rankRaw = parseRanking(row[colRank])
    const titleEn = colEn ? String(row[colEn] ?? '').trim() || null : null

    if (!ideaRaw) continue // skip blank rows
    if (!engRaw)  { errors.push(`แถว ${i + 2}: ประเภท "${row[colEngine]}" ไม่ถูกต้อง`); continue }
    if (!rankRaw) { errors.push(`แถว ${i + 2}: ranking "${row[colRank]}" ไม่ถูกต้อง (ต้องเป็น 1-10)`); continue }

    valid.push({ idea_text: ideaRaw, title_en: titleEn, ranking_need: rankRaw, engine_type: engRaw })
  }

  if (!valid.length) {
    return NextResponse.json({ error: 'ไม่มีแถวที่ valid', details: errors }, { status: 400 })
  }

  // Merge mode — upsert only, never truncate
  // New ideas → INSERT · Existing (idea_text+engine_type) → UPDATE ranking+title_en
  // Ideas not in this file → remain untouched in DB
  let inserted = 0
  let updated  = 0
  for (const row of valid) {
    const result = await db`
      INSERT INTO intel_excel_ideas (idea_text, title_en, ranking_need, engine_type)
      VALUES (${row.idea_text}, ${row.title_en}, ${row.ranking_need}, ${row.engine_type})
      ON CONFLICT (idea_text, engine_type) DO UPDATE
        SET title_en     = EXCLUDED.title_en,
            ranking_need = EXCLUDED.ranking_need,
            uploaded_at  = NOW()
      RETURNING (xmax = 0) AS is_insert
    `
    if (result[0]?.is_insert) inserted++; else updated++
  }

  return NextResponse.json({ inserted, updated, errors, total: rows.length })
}
