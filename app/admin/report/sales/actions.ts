'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function revokeCartOrderAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = formData.get('id') as string
  await db`UPDATE orders SET fraud_flag = 'revoked' WHERE id = ${id}`
  await db`UPDATE order_items SET download_token = NULL WHERE order_id = ${id}`
  revalidatePath('/admin/report/sales')
}

export async function cancelCartOrderAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = formData.get('id') as string
  await db`UPDATE orders SET status = 'revoked' WHERE id = ${id} AND status = 'pending_payment'`
  revalidatePath('/admin/report/sales')
}
