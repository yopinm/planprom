'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function createCategoryAction(formData: FormData) {
  await requireAdminSession('/admin/login')

  const name  = (formData.get('name') as string ?? '').trim()
  const emoji = (formData.get('emoji') as string ?? '📋').trim()
  const slug  = (formData.get('slug') as string ?? '')
    .trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')

  if (!name || !slug) return

  const [{ max_order }] = await db<{ max_order: number | null }[]>`
    SELECT MAX(sort_order) AS max_order FROM template_categories
  `
  const nextOrder = (max_order ?? 0) + 1

  await db`
    INSERT INTO template_categories (slug, name, emoji, sort_order)
    VALUES (${slug}, ${name}, ${emoji}, ${nextOrder})
    ON CONFLICT (slug) DO NOTHING
  `

  revalidatePath('/admin/catalogs')
  revalidatePath('/')
  redirect('/admin/catalogs')
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id    = (formData.get('id')    as string ?? '').trim()
  const name  = (formData.get('name')  as string ?? '').trim()
  const emoji = (formData.get('emoji') as string ?? '').trim()
  if (!id || !name) return
  await db`UPDATE template_categories SET name = ${name}, emoji = ${emoji} WHERE id = ${id}`
  revalidatePath('/admin/catalogs')
  revalidatePath('/')
  redirect('/admin/catalogs')
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = formData.get('id') as string
  if (!id) return
  await db`DELETE FROM template_categories WHERE id = ${id}`
  revalidatePath('/admin/catalogs')
  revalidatePath('/')
  redirect('/admin/catalogs')
}
