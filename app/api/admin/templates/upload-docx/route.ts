// POST /api/admin/templates/upload-docx — DC-1 docx → standard A4 PDF
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'
import { generatePdf, extractToc } from '@/lib/pdf-generator'

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
const DOCX_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]

export async function POST(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file          = form.get('file') as File | null
  const slug          = ((form.get('slug') as string) ?? '').trim().replace(/[^a-z0-9-]/g, '') || 'template'
  const title         = ((form.get('title') as string) ?? '').trim() || slug
  const documentType  = ((form.get('document_type') as string) ?? 'checklist').trim()
  const watermarkRaw  = ((form.get('watermark_text') as string) ?? '').trim()
  const watermarkText = watermarkRaw || undefined

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!DOCX_TYPES.includes(file.type) && !file.name.endsWith('.docx')) {
    return NextResponse.json({ error: 'ต้องเป็นไฟล์ .docx เท่านั้น' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 20 MB' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  let pdfBuffer: Buffer
  let tocSections: Awaited<ReturnType<typeof extractToc>>

  try {
    ;[pdfBuffer, tocSections] = await Promise.all([
      generatePdf({ buffer, title, documentType, watermarkText }),
      extractToc(buffer),
    ])
  } catch (err) {
    return NextResponse.json({ error: `Generate failed: ${(err as Error).message}` }, { status: 500 })
  }

  const uploadBase = process.env.UPLOAD_DIR
    ? path.join(process.env.UPLOAD_DIR, 'templates')
    : path.join(process.cwd(), 'uploads', 'templates')

  await mkdir(uploadBase, { recursive: true })

  const filename = `${slug}-${Date.now()}.pdf`
  await writeFile(path.join(uploadBase, filename), pdfBuffer)

  return NextResponse.json({
    path: `/uploads/templates/${filename}`,
    toc_sections: tocSections,
    watermark_text: watermarkText ?? null,
  })
}
