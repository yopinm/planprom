'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireAdminRole } from '@/lib/admin-auth'
import { PERMISSION_MODULES, type AdminRole } from '@/lib/admin-rbac'

const VALID_PERMISSIONS = PERMISSION_MODULES.map(m => m.key)

export async function createAdminUserAction(formData: FormData) {
  await requireAdminRole('admin', '/admin/users')

  const email    = (formData.get('email') as string).toLowerCase().trim()
  const password = formData.get('password') as string
  const role     = formData.get('role') as AdminRole
  const name     = (formData.get('name') as string).trim() || null

  if (!email || !password || !['admin', 'clerk'].includes(role)) {
    throw new Error('invalid input')
  }
  if (password.length < 8) throw new Error('password too short')

  const hash = await bcrypt.hash(password, 12)

  await db`
    INSERT INTO admin_users (email, password_hash, role, name)
    VALUES (${email}, ${hash}, ${role}, ${name})
    ON CONFLICT (email) DO NOTHING
  `

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function deleteAdminUserAction(formData: FormData) {
  await requireAdminRole('admin', '/admin/users')

  const id = formData.get('id') as string
  if (!id) throw new Error('missing id')

  await db`DELETE FROM admin_users WHERE id = ${id}`

  revalidatePath('/admin/users')
}

export async function updatePermissionsAction(formData: FormData) {
  await requireAdminRole('admin', '/admin/users')

  const id = formData.get('id') as string
  if (!id) throw new Error('missing id')

  const selected = formData.getAll('permissions') as string[]
  const permissions = selected.filter(p => VALID_PERMISSIONS.includes(p as typeof VALID_PERMISSIONS[number]))

  await db`
    UPDATE admin_users
    SET permissions = ${db.array(permissions)}, updated_at = NOW()
    WHERE id = ${id} AND role = 'clerk'
  `

  revalidatePath('/admin/users')
}
