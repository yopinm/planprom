// app/api/admin/cache/route.ts
// TASK 2.11 — Cache invalidation endpoint
//
// DELETE /api/admin/cache?secret=<CRON_SECRET>&prefix=products
// DELETE /api/admin/cache?secret=<CRON_SECRET>           → full flush
//
// Called by admin after coupon/product write to ensure fresh data.
// Guarded by CRON_SECRET (same secret used for cron jobs).

import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/cache'
import { getValidCachePrefixes, normalizeCachePrefix } from '@/lib/cache-policy'

export async function DELETE(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prefix = req.nextUrl.searchParams.get('prefix')

  if (prefix) {
    const fullPrefix = normalizeCachePrefix(prefix)
    if (!fullPrefix) {
      return NextResponse.json(
        { error: `Invalid prefix. Valid: ${getValidCachePrefixes().join(', ')}` },
        { status: 400 },
      )
    }
    cache.delPattern(fullPrefix)
    return NextResponse.json({ ok: true, cleared: fullPrefix })
  }

  // Full flush
  const before = cache.size()
  cache.clear()
  return NextResponse.json({ ok: true, cleared: 'all', entries_removed: before })
}
