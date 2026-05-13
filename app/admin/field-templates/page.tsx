import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { FieldTemplatesClient } from './FieldTemplatesClient'

export const metadata: Metadata = {
  title: 'Field Templates — Admin',
  robots: { index: false, follow: false },
}

export default async function FieldTemplatesPage() {
  await requireAdminSession()
  const rows = await db<{ id: string; label: string; type: string; icon: string; grp: string; preset: object }[]>`
    SELECT id, label, type, icon, grp, preset
    FROM field_templates
    ORDER BY grp, sort_order, created_at
  `.catch(() => [])
  return <FieldTemplatesClient initialRows={rows} />
}
