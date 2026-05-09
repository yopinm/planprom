'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { pushLine } from '@/lib/line-messaging'

// ── Cart order actions (new orders + order_items tables) ────────────────────

export async function revokeCartOrderAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = formData.get('id') as string
  await db`
    UPDATE orders SET fraud_flag = 'revoked' WHERE id = ${id}
  `
  await db`
    UPDATE order_items SET download_token = NULL WHERE order_id = ${id}
  `
  revalidatePath('/admin/orders')
}

export async function cancelCartOrderAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = formData.get('id') as string
  await db`
    UPDATE orders SET status = 'revoked' WHERE id = ${id} AND status = 'pending_payment'
  `
  revalidatePath('/admin/orders')
}

export async function verifyOrderAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = formData.get('id') as string
  await db`
    UPDATE template_orders SET is_verified = true WHERE id = ${id}
  `
  revalidatePath('/admin/orders')
}

export async function cancelPendingOrderAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = formData.get('id') as string
  await db`
    DELETE FROM template_orders
    WHERE id = ${id} AND status = 'pending_payment'
  `
  revalidatePath('/admin/orders')
}

export async function revokeOrderAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id     = formData.get('id') as string
  const reason = (formData.get('reason') as string ?? 'ตรวจไม่พบการชำระเงิน').trim()

  const [order] = await db<{ customer_line_id: string; order_number: string }[]>`
    SELECT customer_line_id, order_number FROM template_orders WHERE id = ${id} LIMIT 1
  `
  if (!order) return

  await db`
    UPDATE template_orders SET
      fraud_flag      = 'revoked',
      is_verified     = false,
      download_token  = NULL,
      revoked_at      = NOW(),
      revoke_reason   = ${reason}
    WHERE id = ${id}
  `

  await pushLine(order.customer_line_id, [{
    type: 'text',
    text: [
      '⚠️ แจ้งจาก คูปองคุ้ม',
      '',
      `ขออภัย — ตรวจไม่พบการชำระเงินสำหรับ Order: ${order.order_number}`,
      '',
      'กรุณาส่ง slip โอนเงินมาที่ LINE OA นี้ หรือติดต่อ @couponkum เพื่อขอความช่วยเหลือ',
    ].join('\n'),
  }]).catch(() => null)

  revalidatePath('/admin/orders')
}
