'use server'
import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function str(fd: FormData, key: string) {
  return ((fd.get(key) as string) ?? '').trim()
}

export async function createPromoCodeAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const code         = str(formData, 'code').toUpperCase()
  const label        = str(formData, 'label')
  const discountType = str(formData, 'discount_type')
  const discountVal  = parseFloat(str(formData, 'discount_value'))
  const minCart      = parseFloat(str(formData, 'min_cart_value') || '0')
  const maxUsesRaw   = str(formData, 'max_uses')
  const maxUses      = maxUsesRaw ? parseInt(maxUsesRaw) : null
  const startsAt     = str(formData, 'starts_at')
  const expiresAt    = str(formData, 'expires_at')

  await db`
    INSERT INTO promo_codes
      (code, label, discount_type, discount_value, min_cart_value, max_uses, starts_at, expires_at)
    VALUES
      (${code}, ${label}, ${discountType}, ${discountVal}, ${minCart}, ${maxUses}, ${startsAt}, ${expiresAt})
  `
  revalidatePath('/admin/promo-codes')
  redirect('/admin/promo-codes')
}

export async function updatePromoCodeAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id           = str(formData, 'id')
  const label        = str(formData, 'label')
  const discountType = str(formData, 'discount_type')
  const discountVal  = parseFloat(str(formData, 'discount_value'))
  const minCart      = parseFloat(str(formData, 'min_cart_value') || '0')
  const maxUsesRaw   = str(formData, 'max_uses')
  const maxUses      = maxUsesRaw ? parseInt(maxUsesRaw) : null
  const expiresAt    = str(formData, 'expires_at')

  await db`
    UPDATE promo_codes SET
      label          = ${label},
      discount_type  = ${discountType},
      discount_value = ${discountVal},
      min_cart_value = ${minCart},
      max_uses       = ${maxUses},
      expires_at     = ${expiresAt}
    WHERE id = ${id}
  `
  revalidatePath('/admin/promo-codes')
}

export async function togglePromoCodeAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id       = str(formData, 'id')
  const current  = str(formData, 'is_active') === 'true'
  await db`UPDATE promo_codes SET is_active = ${!current} WHERE id = ${id}`
  revalidatePath('/admin/promo-codes')
}

export async function deletePromoCodeAction(formData: FormData): Promise<void> {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')
  const [row] = await db<{ used_count: number }[]>`SELECT used_count FROM promo_codes WHERE id = ${id}`
  if (!row || row.used_count > 0) return
  await db`DELETE FROM promo_codes WHERE id = ${id}`
  revalidatePath('/admin/promo-codes')
}
