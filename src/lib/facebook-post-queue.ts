// POSTLIVE-30 — Facebook Post Queue helpers
// Caption generator + queue CRUD for auto-publisher cron.

import { db } from '@/lib/db'

export type CaptionStyle = 'saving' | 'urgency' | 'direct'

export interface CouponForCaption {
  title: string
  platform: string
  discount_value: number
  type: string
  code: string
  expire_at: string | null
}

function formatDiscount(c: CouponForCaption): string {
  if (c.type === 'percent')  return `ลด ${c.discount_value}%`
  if (c.type === 'cashback') return `คืน ${c.discount_value}%`
  if (c.type === 'fixed')    return `ลด ฿${c.discount_value.toLocaleString('th-TH')}`
  return 'ส่งฟรี'
}

function formatPlatform(p: string): string {
  return p === 'shopee' ? 'Shopee' : p === 'lazada' ? 'Lazada' : p
}

function formatExpire(expireAt: string | null): string {
  if (!expireAt) return '⏰ ไม่จำกัดเวลา'
  return `⏰ หมด: ${new Date(expireAt).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok',
  })}`
}

export function generateCaption(
  coupon: CouponForCaption,
  style: CaptionStyle,
  lineOaId: string,
): string {
  const discount = formatDiscount(coupon)
  const platform = formatPlatform(coupon.platform)
  const expire   = formatExpire(coupon.expire_at)
  const lineLink = `https://line.me/R/ti/p/${lineOaId}`
  const wallet   = 'https://couponkum.com/wallet'

  if (style === 'saving') return [
    '💰 วันนี้ประหยัดได้เลย!', '',
    `📌 ${coupon.title}`,
    `🏪 ${platform}  ·  ${discount}`,
    `🔑 โค้ด: ${coupon.code}`,
    expire, '',
    `👉 ดูคูปองเพิ่มเติม: ${wallet}`,
    `💬 ทักแชท LINE รับโค้ดลับเพิ่ม: ${lineLink}`,
  ].join('\n')

  if (style === 'urgency') return [
    '⏰ คูปองใกล้หมดแล้ว! รีบกดก่อนนะ', '',
    `📌 ${coupon.title}`,
    `🏪 ${platform}  ·  ${discount}`,
    `🔑 โค้ด: ${coupon.code}`,
    expire, '',
    `🔥 กดรับก่อนหมด → ${wallet}`,
    `💬 LINE: ${lineLink}`,
  ].join('\n')

  return [  // direct
    `${platform} ${discount} วันนี้`, '',
    `📌 ${coupon.title}`,
    `🔑 โค้ด: ${coupon.code}`,
    expire, '',
    `คูปองเด็ดประจำวัน → ${wallet}`,
    `💬 LINE: ${lineLink}`,
  ].join('\n')
}

// Rotate saving → urgency → direct across posts within the day
export function pickCaptionStyle(todayPostCount: number): CaptionStyle {
  const styles: CaptionStyle[] = ['saving', 'urgency', 'direct']
  return styles[todayPostCount % styles.length]
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

export interface QueueRow {
  id: string
  coupon_id: string | null
  caption_style: string
  caption: string
  status: string
  scheduled_for: string
  retry_count: number
  content_type: string
  product_id: string | null
  image_url: string | null
}

interface CouponRow {
  id: string
  title: string
  platform: string
  discount_value: number
  type: string
  code: string
  expire_at: string | null
}

// daily_featured first → fallback to highest-value active coupon
// Excludes coupons already posted in the last 7 days
export async function pickNextCoupon(): Promise<CouponRow | null> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

  const [featured] = await db<CouponRow[]>`
    SELECT c.id, c.title, c.platform, c.discount_value, c.type, c.code, c.expire_at
    FROM daily_featured_coupons dfc
    JOIN coupons c ON c.id = dfc.coupon_id
    WHERE dfc.date = ${today}::date
      AND c.is_active = true AND c.code IS NOT NULL
      AND (c.expire_at IS NULL OR c.expire_at > NOW())
      AND c.id NOT IN (
        SELECT coupon_id FROM facebook_post_queue
        WHERE posted_at > NOW() - INTERVAL '7 days'
      )
    LIMIT 1
  `
  if (featured) return featured

  const [fallback] = await db<CouponRow[]>`
    SELECT id, title, platform, discount_value, type, code, expire_at
    FROM coupons
    WHERE is_active = true AND code IS NOT NULL
      AND (expire_at IS NULL OR expire_at > NOW())
      AND id NOT IN (
        SELECT coupon_id FROM facebook_post_queue
        WHERE posted_at > NOW() - INTERVAL '7 days'
      )
    ORDER BY discount_value DESC
    LIMIT 1
  `
  return fallback ?? null
}

export async function findPendingPost(now: Date): Promise<QueueRow | null> {
  const [row] = await db<QueueRow[]>`
    SELECT id, coupon_id, caption_style, caption, status, scheduled_for, retry_count,
           content_type, product_id, image_url
    FROM facebook_post_queue
    WHERE status = 'pending'
      AND scheduled_for <= ${now.toISOString()}
      AND retry_count < 3
    ORDER BY scheduled_for ASC
    LIMIT 1
  `
  return row ?? null
}

export async function countPostsToday(): Promise<number> {
  const todayIct = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
  const [{ count }] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM facebook_post_queue
    WHERE status = 'posted'
      AND (posted_at AT TIME ZONE 'Asia/Bangkok')::date = ${todayIct}::date
  `
  return count ?? 0
}

export async function hoursSinceLastPost(): Promise<number | null> {
  const [row] = await db<{ posted_at: string }[]>`
    SELECT posted_at FROM facebook_post_queue
    WHERE status = 'posted' AND posted_at IS NOT NULL
    ORDER BY posted_at DESC LIMIT 1
  `
  if (!row?.posted_at) return null
  return (Date.now() - new Date(row.posted_at).getTime()) / 3_600_000
}

export async function enqueuePost(
  caption: string,
  captionStyle: CaptionStyle,
  scheduledFor: Date,
  contentType = 'tip',
  couponId?: string,
  productId?: string,
  imageUrl?: string,
): Promise<void> {
  await db`
    INSERT INTO facebook_post_queue
      (coupon_id, caption, caption_style, scheduled_for, content_type, product_id, image_url)
    VALUES (
      ${couponId ?? null},
      ${caption},
      ${captionStyle},
      ${scheduledFor.toISOString()},
      ${contentType},
      ${productId ?? null},
      ${imageUrl ?? null}
    )
  `
}

export async function getPostedProductIds(): Promise<string[]> {
  const rows = await db<{ product_id: string }[]>`
    SELECT product_id FROM facebook_post_queue
    WHERE product_id IS NOT NULL
      AND posted_at > NOW() - INTERVAL '7 days'
  `
  return rows.map(r => r.product_id)
}

export async function hasPostedCampaignToday(): Promise<boolean> {
  const todayIct = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
  const [{ count }] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM facebook_post_queue
    WHERE status = 'posted'
      AND content_type = 'campaign'
      AND (posted_at AT TIME ZONE 'Asia/Bangkok')::date = ${todayIct}::date
  `
  return (count ?? 0) > 0
}

export async function markPosted(id: string, fbPostId: string): Promise<void> {
  await db`
    UPDATE facebook_post_queue
    SET status = 'posted', posted_at = NOW(), fb_post_id = ${fbPostId}
    WHERE id = ${id}
  `
}

export async function markFailed(id: string, error: string): Promise<void> {
  await db`
    UPDATE facebook_post_queue
    SET retry_count = retry_count + 1,
        last_error  = ${error},
        status = CASE WHEN retry_count + 1 >= 3 THEN 'failed' ELSE 'pending' END
    WHERE id = ${id}
  `
}
