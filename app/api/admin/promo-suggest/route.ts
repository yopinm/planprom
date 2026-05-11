import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

const VPS_WEEKLY_COST = 210 // ฿900/เดือน ≈ ฿210/สัปดาห์

function genCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const suffix = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${prefix}${suffix}`
}

function dtLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function addHours(h: number): string {
  return dtLocal(new Date(Date.now() + h * 3_600_000))
}

export async function GET() {
  await requireAdminSession('/admin/login')

  // Signal 1: Slow Week
  const [weekData] = await db<{ rev_this: number; rev_avg: number }[]>`
    SELECT
      COALESCE(
        (SELECT SUM(total_baht) FROM orders
         WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '7 days'), 0
      )::int AS rev_this,
      COALESCE(
        (SELECT SUM(total_baht)::float / 4 FROM orders
         WHERE status = 'paid'
           AND created_at >= NOW() - INTERVAL '35 days'
           AND created_at <  NOW() - INTERVAL '7 days'), 0
      )::int AS rev_avg
  `

  // Signal 2: Tier Uplift — % orders last 30d ที่ซื้อ 1 ชิ้น
  const [tierData] = await db<{ total: number; single: number }[]>`
    SELECT
      COUNT(*)::int                                          AS total,
      COUNT(*) FILTER (WHERE paid_count = 1)::int           AS single
    FROM (
      SELECT o.id,
        COUNT(oi.id) FILTER (WHERE oi.unit_price > 0)::int AS paid_count
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status = 'paid' AND o.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY o.id
    ) sub
  `

  // Signal 3: Cart Recovery — ตะกร้าค้างอยู่ (มี items, สร้างแล้ว > 1 ชม.)
  const [cartData] = await db<{ abandoned: number }[]>`
    SELECT COUNT(DISTINCT c.id)::int AS abandoned
    FROM carts c
    JOIN cart_items ci ON ci.cart_id = c.id
    WHERE c.created_at < NOW() - INTERVAL '1 hour'
      AND c.expires_at > NOW()
  `

  // Signal 4: VPS Break-Even
  const [vpsData] = await db<{ rev_week: number }[]>`
    SELECT COALESCE(SUM(total_baht), 0)::int AS rev_week
    FROM orders
    WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '7 days'
  `

  const now = dtLocal(new Date())

  // avg=0 = ยังไม่มี baseline → always suggest (ไม่มีข้อมูลเปรียบเทียบ)
  const slowSignal = weekData.rev_avg === 0
    ? true
    : weekData.rev_this < weekData.rev_avg * 0.6
  // ลด ratio threshold 70%→50% และ min orders 3→1
  const tierSignal = tierData.total >= 1 && tierData.single / tierData.total > 0.5
  const cartSignal = cartData.abandoned >= 1
  const vpsGap     = Math.max(0, VPS_WEEKLY_COST - vpsData.rev_week)
  const vpsSignal  = vpsGap > 0

  return NextResponse.json([
    {
      engine:  'slow_week',
      signal:  slowSignal,
      metric:  `฿${weekData.rev_this} / avg ฿${weekData.rev_avg}/สัปดาห์`,
      reason:  weekData.rev_avg === 0
        ? `ยังไม่มี baseline — กระตุ้นยอดด้วย flash sale`
        : slowSignal
          ? `ยอดสัปดาห์นี้ ฿${weekData.rev_this} ต่ำกว่า avg ${Math.round((1 - weekData.rev_this / weekData.rev_avg) * 100)}%`
          : `ยอดสัปดาห์นี้ปกติดี ฿${weekData.rev_this}`,
      suggested: slowSignal ? {
        code: genCode('FLASH'), label: 'Flash Sale สัปดาห์นี้',
        discount_type: 'fixed', discount_value: 10, min_cart_value: 0,
        starts_at: now, expires_at: addHours(48),
      } : null,
    },
    {
      engine:  'tier_uplift',
      signal:  tierSignal,
      metric:  `${tierData.total > 0 ? Math.round(tierData.single / tierData.total * 100) : 0}% orders ซื้อแค่ 1 ชิ้น`,
      reason:  tierSignal
        ? `${Math.round(tierData.single / tierData.total * 100)}% orders ซื้อ 1 ชิ้น — โค้ดนี้ดัน AOV`
        : `AOV ปกติดี — ${tierData.total > 0 ? Math.round((1 - tierData.single / tierData.total) * 100) : 0}% orders ซื้อ 2+ ชิ้น`,
      suggested: tierSignal ? {
        code: genCode('PAIR'), label: 'ซื้อ 2 ชิ้น ประหยัดกว่า',
        discount_type: 'fixed', discount_value: 10, min_cart_value: 30,
        starts_at: now, expires_at: addHours(24 * 7),
      } : null,
    },
    {
      engine:  'cart_recovery',
      signal:  cartSignal,
      metric:  `${cartData.abandoned} ตะกร้าค้างอยู่`,
      reason:  cartSignal
        ? `มี ${cartData.abandoned} ตะกร้าที่เลือกสินค้าแต่ไม่ชำระ`
        : `ไม่มีตะกร้าค้าง`,
      suggested: cartSignal ? {
        code: genCode('BACK'), label: 'กลับมาซื้อวันนี้',
        discount_type: 'fixed', discount_value: 10, min_cart_value: 0,
        starts_at: now, expires_at: addHours(24),
      } : null,
    },
    {
      engine:  'vps_breakeven',
      signal:  vpsSignal,
      metric:  `฿${vpsData.rev_week} / เป้า ฿${VPS_WEEKLY_COST}`,
      reason:  vpsSignal
        ? `ยังขาด ฿${vpsGap} เพื่อคุ้ม VPS (฿900/เดือน) สัปดาห์นี้`
        : `คุ้ม VPS แล้ว ฿${vpsData.rev_week} ≥ ฿${VPS_WEEKLY_COST}`,
      suggested: vpsSignal ? {
        code: genCode('GOGO'), label: 'Weekly Goal — คุ้ม VPS',
        discount_type: 'fixed', discount_value: vpsGap > 100 ? 15 : 10, min_cart_value: 0,
        starts_at: now, expires_at: addHours(72),
      } : null,
    },
  ])
}
