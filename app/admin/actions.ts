'use server'

// app/admin/actions.ts — Server Actions for Admin CRUD
// TASK 1.16: add/edit coupon + featured deals toggle
// TASK S1: auth via Supabase session (role = 'admin'), removed ?key= pattern

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { sanitizeText, sanitizeCode, sanitizeNumber } from '@/lib/security/sanitizer'
import { syncTikTokTrends } from '@/lib/tiktok-trend-discovery'
import type { CouponType, CouponTier, Platform, UserSegment } from '@/types'

// ---------------------------------------------------------------------------
// Add Coupon
// ---------------------------------------------------------------------------

export async function addCoupon(formData: FormData): Promise<void> {
  if (!await getAdminUser()) return

  const rawCode    = sanitizeCode(formData.get('code'))
  const rawExpire  = (formData.get('expire_at') as string | null) || null

  const record = {
    code:                   rawCode || null,
    title:                  sanitizeText(formData.get('title'), 200),
    description:            sanitizeText(formData.get('description'), 500) || null,
    platform:               formData.get('platform') as Platform | 'all',
    tier:                   parseInt(formData.get('tier') as string, 10) as CouponTier,
    type:                   formData.get('type') as CouponType,
    discount_value:         sanitizeNumber(formData.get('discount_value')),
    max_discount:           formData.get('max_discount') ? sanitizeNumber(formData.get('max_discount')) : null,
    min_spend:              sanitizeNumber(formData.get('min_spend')) || 0,
    applicable_categories:  [],
    can_stack:              formData.get('can_stack') === 'true',
    user_segment:           (formData.get('user_segment') as UserSegment) || 'all',
    expire_at:              rawExpire,
    is_active:              true,
    source:                 'admin',
  }

  await db`
    INSERT INTO coupons (
      code,
      title,
      description,
      platform,
      tier,
      type,
      discount_value,
      max_discount,
      min_spend,
      applicable_categories,
      can_stack,
      user_segment,
      expire_at,
      is_active,
      source
    )
    VALUES (
      ${record.code},
      ${record.title},
      ${record.description},
      ${record.platform},
      ${record.tier},
      ${record.type},
      ${record.discount_value},
      ${record.max_discount},
      ${record.min_spend},
      ${record.applicable_categories},
      ${record.can_stack},
      ${record.user_segment},
      ${record.expire_at},
      ${record.is_active},
      ${record.source}
    )
  `

  revalidatePath('/admin')
  redirect('/admin?notice=added')
}

// ---------------------------------------------------------------------------
// Toggle is_active
// ---------------------------------------------------------------------------

export async function toggleCouponActive(id: string, isActive: boolean): Promise<void> {
  if (!await getAdminUser()) return

  await db`
    UPDATE coupons
    SET is_active = ${isActive}
    WHERE id = ${id}
  `
  revalidatePath('/admin')
}

// ---------------------------------------------------------------------------
// Delete Coupon
// ---------------------------------------------------------------------------

export async function deleteCoupon(id: string): Promise<void> {
  if (!await getAdminUser()) return

  await db`DELETE FROM coupons WHERE id = ${id}`
  revalidatePath('/admin')
}

// ---------------------------------------------------------------------------
// Form-based wrappers (Server Actions via <form action={...}>)
// ---------------------------------------------------------------------------

export async function toggleCouponActiveAction(formData: FormData): Promise<void> {
  const id       = formData.get('coupon_id') as string
  const isActive = formData.get('is_active') === 'true'
  await toggleCouponActive(id, isActive)
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  const id = formData.get('coupon_id') as string
  await deleteCoupon(id)
}

/** Sync latest trends from TikTok. */
export async function syncTikTokTrendsAction(): Promise<void> {
  if (!await getAdminUser()) return

  await syncTikTokTrends()
  
  revalidatePath('/admin')
}
