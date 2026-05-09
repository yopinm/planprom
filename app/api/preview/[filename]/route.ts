// GET /api/preview/[filename] — serves engine template preview images (publicly accessible)
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Only allow safe image filenames — no path traversal
  if (!/^[a-z0-9._-]+-preview-\d+\.(jpg|jpeg|png)$/i.test(filename)) {
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
        'Content-Type':  'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
