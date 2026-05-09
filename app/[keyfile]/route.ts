// IndexNow key-file verification — serves /{INDEXNOW_KEY}.txt
// Search engines crawl this to confirm domain ownership before accepting submissions.
// Option 1 spec: https://www.indexnow.org/documentation

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ keyfile: string }> },
) {
  const { keyfile } = await params
  const key = process.env.INDEXNOW_KEY
  if (!key || keyfile !== `${key}.txt`) {
    return new NextResponse(null, { status: 404 })
  }
  return new NextResponse(key, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
