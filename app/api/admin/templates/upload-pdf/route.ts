// app/api/admin/templates/upload-pdf/route.ts — V15-ADMIN-2
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

export async function POST(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const slug = ((formData.get('slug') as string) ?? '').trim().replace(/[^a-z0-9-]/g, '') || 'template'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF files only' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Max file size: 20 MB' }, { status: 400 })

  const uploadBase = process.env.UPLOAD_DIR
    ? path.join(process.env.UPLOAD_DIR, 'templates')
    : path.join(process.cwd(), 'uploads', 'templates')

  await mkdir(uploadBase, { recursive: true })

  const safeName = `${slug}-${Date.now()}.pdf`
  const dest     = path.join(uploadBase, safeName)
  const bytes    = await file.arrayBuffer()

  await writeFile(dest, Buffer.from(bytes))

  return NextResponse.json({ path: `/uploads/templates/${safeName}` })
}
