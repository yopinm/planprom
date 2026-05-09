// GET /api/download/[token] — validate token, increment count, stream PDF
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  type DownloadRow = {
    id: string; pdf_path: string; title: string
    download_count: number; download_expires_at: string; fraud_flag: string
    source: 'template_orders' | 'order_items'
  }

  // Check template_orders (single-template flow)
  let row: DownloadRow | undefined
  const [legacyRow] = await db<Omit<DownloadRow, 'source'>[]>`
    SELECT o.id, t.pdf_path, t.title,
           o.download_count, o.download_expires_at, o.fraud_flag
    FROM template_orders o
    JOIN templates t ON t.id = o.template_id
    WHERE o.download_token = ${token}
      AND o.status = 'paid'
    LIMIT 1
  `
  if (legacyRow) row = { ...legacyRow, source: 'template_orders' }

  // Check order_items (cart checkout flow)
  if (!row) {
    const [cartRow] = await db<Omit<DownloadRow, 'source'>[]>`
      SELECT oi.id, t.pdf_path, t.title,
             oi.download_count, oi.download_expires_at, o.fraud_flag
      FROM order_items oi
      JOIN templates t ON t.id = oi.template_id
      JOIN orders o    ON o.id  = oi.order_id
      WHERE oi.download_token = ${token}
        AND o.status = 'paid'
      LIMIT 1
    `
    if (cartRow) row = { ...cartRow, source: 'order_items' }
  }

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (row.fraud_flag === 'revoked') return NextResponse.json({ error: 'Revoked' }, { status: 403 })
  if (new Date(row.download_expires_at) < new Date()) return NextResponse.json({ error: 'Expired' }, { status: 410 })
  if (row.download_count >= 3) return NextResponse.json({ error: 'Download limit reached' }, { status: 410 })

  // Increment count first (count-then-serve)
  if (row.source === 'order_items') {
    await db`UPDATE order_items SET download_count = download_count + 1 WHERE id = ${row.id}`
  } else {
    await db`UPDATE template_orders SET download_count = download_count + 1 WHERE id = ${row.id}`
  }

  // Resolve file path: pdf_path looks like "/uploads/templates/file.pdf"
  const relative  = row.pdf_path.replace(/^\/uploads\//, '')
  const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
  const filePath  = path.join(uploadDir, relative)

  let buffer: Buffer
  try {
    buffer = await readFile(filePath)
  } catch {
    // Fallback: try .next/standalone/uploads (older location)
    try {
      const fallback = path.join(process.cwd(), '.next', 'standalone', 'uploads', relative)
      buffer = await readFile(fallback)
    } catch {
      return NextResponse.json({ error: 'File not found on server' }, { status: 500 })
    }
  }

  const filename = path.basename(row.pdf_path)
  const safeName = encodeURIComponent(`${row.title}.pdf`)

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${safeName}`,
      'Content-Length':      String(buffer.length),
      'Cache-Control':       'no-store',
      'X-File-Name':         filename,
    },
  })
}
