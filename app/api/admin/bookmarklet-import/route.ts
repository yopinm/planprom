// POST /api/admin/bookmarklet-import — ADMIN-BOOKMARKLET-1
// Receives product data scraped from a Shopee page by the admin bookmarklet.
// Upserts into products table (same shape as manual shopee import).

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export interface BookmarkletPayload {
  name:           string
  price_current:  number
  price_original: number | null
  platform_id:    string
  product_url:    string
  image_url:      string | null
  shop_name:      string | null
}

function validate(body: unknown): body is BookmarkletPayload {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.name !== 'string' || b.name.trim() === '') return false
  if (typeof b.price_current !== 'number' || b.price_current <= 0) return false
  if (typeof b.platform_id !== 'string' || b.platform_id.trim() === '') return false
  if (typeof b.product_url !== 'string' || !b.product_url.startsWith('https://')) return false
  return true
}

export async function POST(req: NextRequest) {
  if (!await getAdminUser()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!validate(body)) {
    return NextResponse.json(
      { error: 'Missing or invalid fields: name, price_current (>0), platform_id, product_url (https)' },
      { status: 422 },
    )
  }

  const now = new Date().toISOString()

  try {
    await db`
      INSERT INTO products (
        name,
        price_current,
        price_original,
        platform,
        platform_id,
        product_url,
        image_url,
        shop_name,
        data_source,
        is_active,
        price_checked_at,
        updated_at
      )
      VALUES (
        ${body.name.trim()},
        ${body.price_current},
        ${body.price_original ?? null},
        'shopee',
        ${body.platform_id.trim()},
        ${body.product_url},
        ${body.image_url ?? null},
        ${body.shop_name ?? null},
        'manual',
        true,
        ${now},
        ${now}
      )
      ON CONFLICT (platform_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        price_current = EXCLUDED.price_current,
        price_original = EXCLUDED.price_original,
        product_url = EXCLUDED.product_url,
        image_url = EXCLUDED.image_url,
        shop_name = EXCLUDED.shop_name,
        data_source = EXCLUDED.data_source,
        is_active = EXCLUDED.is_active,
        price_checked_at = EXCLUDED.price_checked_at,
        updated_at = EXCLUDED.updated_at
    `
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, platform_id: body.platform_id })
}
