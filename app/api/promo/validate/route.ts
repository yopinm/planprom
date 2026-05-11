// POST /api/promo/validate — PROMO-1
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type PromoRow = {
  id: string; discount_type: string; discount_value: number
  min_cart_value: number; max_uses: number | null; used_count: number
  starts_at: string; expires_at: string; is_active: boolean; label: string
}

export async function POST(req: NextRequest) {
  const { code, cart_total, paid_item_count } = await req.json() as {
    code: string; cart_total: number; paid_item_count: number
  }

  if (!code || !cart_total) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
  }

  const [row] = await db<PromoRow[]>`
    SELECT * FROM promo_codes WHERE code = ${code.toUpperCase().trim()} LIMIT 1
  `.catch(() => [] as PromoRow[])

  if (!row || !row.is_active)        return NextResponse.json({ error: 'ไม่พบโค้ดส่วนลดนี้' })
  if (new Date() < new Date(row.starts_at))  return NextResponse.json({ error: 'โค้ดยังไม่เริ่มใช้งาน' })
  if (new Date() > new Date(row.expires_at)) return NextResponse.json({ error: 'โค้ดหมดอายุแล้ว' })
  if (row.max_uses !== null && row.used_count >= row.max_uses)
    return NextResponse.json({ error: 'โค้ดถูกใช้ครบแล้ว' })
  if (cart_total < row.min_cart_value)
    return NextResponse.json({ error: `ยอดขั้นต่ำ ฿${row.min_cart_value}` })

  const raw = row.discount_type === 'percent'
    ? Math.round(cart_total * (row.discount_value / 100) * 100) / 100
    : row.discount_value
  const discount_applied = Math.min(raw, cart_total)
  const final_total = cart_total - discount_applied

  // Guard: Omise floor ฿20 (ถ้า total > 0)
  if (final_total > 0 && final_total < 20) {
    return NextResponse.json({ error: 'ส่วนลดนี้ทำให้ยอดรวมต่ำกว่าขั้นต่ำการชำระเงิน (฿20)' })
  }

  // Guard: tier branding — effective per-item ≥ ฿7
  if (paid_item_count > 0 && final_total > 0 && (final_total / paid_item_count) < 7) {
    return NextResponse.json({ error: 'ส่วนลดสูงเกินไปสำหรับจำนวนสินค้าในตะกร้า' })
  }

  return NextResponse.json({
    valid: true,
    code: row.id,          // return id for server use
    code_text: code.toUpperCase().trim(),
    label: row.label,
    discount_applied,
    final_total,
  })
}
