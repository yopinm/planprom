import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { FormBuilderClient } from './FormBuilderClient'

export const metadata: Metadata = {
  title: 'Form Builder — Admin',
  robots: { index: false, follow: false },
}

export default async function FormBuilderPage() {
  await requireAdminSession()
  const categories = await db<{ id: string; name: string; emoji: string }[]>`
    SELECT id, name, emoji FROM template_categories ORDER BY sort_order ASC, name ASC
  `.catch(() => [])
  return <FormBuilderClient categories={categories} />
}
