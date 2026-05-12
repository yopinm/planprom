// GET /api/admin/form-builder/pdf/[filename] — admin-only PDF viewer
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const adminId = await getAdminUser()
  if (!adminId) return new NextResponse('Unauthorized', { status: 403 })

  const { filename } = await params

  if (!/^[a-z0-9_-]+-form-\d+\.pdf$/i.test(filename)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
  const filePath  = path.resolve(path.join(uploadDir, 'templates', filename))
  const allowedBase = path.resolve(path.join(uploadDir, 'templates'))

  if (!filePath.startsWith(allowedBase)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const buffer = await readFile(filePath)
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type':  'application/pdf',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
