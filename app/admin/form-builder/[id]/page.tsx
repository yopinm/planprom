import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { FormBuilderClient } from '../FormBuilderClient'
import type { FormEngineData } from '@/lib/engine-form-types'

export const metadata: Metadata = {
  title: 'แก้ไขฟอร์ม — Admin',
  robots: { index: false, follow: false },
}

type Category = { id: string; name: string; emoji: string }

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession()
  const { id } = await params

  const [t] = await db<{ id: string; title: string; tier: string; slug: string; engine_data: unknown }[]>`
    SELECT id, title, tier, slug, engine_data
    FROM templates
    WHERE id = ${id} AND engine_type = 'form'
    LIMIT 1
  `.catch(() => [])

  if (!t) notFound()

  const [categories, catLinks] = await Promise.all([
    db<Category[]>`
      SELECT id, name, emoji FROM template_categories ORDER BY sort_order ASC, name ASC
    `.catch(() => [] as Category[]),
    db<{ category_id: string }[]>`
      SELECT category_id FROM template_category_links WHERE template_id = ${id} LIMIT 1
    `.catch(() => [] as { category_id: string }[]),
  ])

  const raw = typeof t.engine_data === 'string' ? JSON.parse(t.engine_data) : t.engine_data
  const engineData = raw as FormEngineData

  return (
    <FormBuilderClient
      categories={categories}
      templateId={id}
      initialData={{
        title: engineData.title ?? t.title,
        fields: engineData.fields ?? [],
        sampleData: engineData.sampleData ?? {},
        slug: t.slug,
        tier: t.tier,
        categoryId: catLinks[0]?.category_id ?? '',
      }}
    />
  )
}
