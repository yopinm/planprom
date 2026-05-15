// /admin/catalogs — Catalog (category) manager
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { createCategoryAction } from './actions'
import { DeleteCategoryButton } from './DeleteCategoryButton'
import { EditCategoryButton } from './EditCategoryButton'

export const metadata: Metadata = {
  title: 'Catalog Manager — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Category = {
  id: string
  slug: string
  name: string
  emoji: string
  sort_order: number
  template_count: string
}

type TemplateInCat = {
  id: string
  title: string
  slug: string
  tier: string
  status: string
  category_id: string
}

export default async function AdminCatalogsPage() {
  await requireAdminSession('/admin/login')

  const categories = await db<Category[]>`
    SELECT c.id, c.slug, c.name, c.emoji, c.sort_order,
           COUNT(l.template_id)::text AS template_count
    FROM template_categories c
    LEFT JOIN template_category_links l ON l.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `.catch(() => [] as Category[])

  const templates = await db<TemplateInCat[]>`
    SELECT t.id, t.title, t.slug, t.tier, t.status, l.category_id
    FROM templates t
    JOIN template_category_links l ON l.template_id = t.id
    ORDER BY t.created_at DESC
  `.catch(() => [] as TemplateInCat[])

  const byCategory = templates.reduce<Record<string, TemplateInCat[]>>((acc, t) => {
    ;(acc[t.category_id] ??= []).push(t)
    return acc
  }, {})

  const TIER_COLOR: Record<string, string> = {
    free:     'bg-emerald-100 text-emerald-700',
    standard: 'bg-amber-100 text-amber-700',
    premium:  'bg-violet-100 text-violet-700',
    ultra:    'bg-rose-100 text-rose-700',
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/templates" className="text-xs font-bold text-neutral-400 hover:text-black">← Templates</Link>
            <h1 className="mt-1 text-2xl font-black text-black">Catalog Manager</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{categories.length} categories · จัดกลุ่มเทมเพลต</p>
          </div>
        </div>

        {/* Existing categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {categories.map(cat => {
            const catTemplates = byCategory[cat.id] ?? []
            return (
              <div key={cat.id} className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl">{cat.emoji}</span>
                    <div>
                      <p className="font-black text-neutral-900">{cat.name}</p>
                      <p className="text-xs text-neutral-400 font-mono">{cat.slug} · {cat.template_count} templates</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <EditCategoryButton id={cat.id} name={cat.name} emoji={cat.emoji} />
                    <DeleteCategoryButton id={cat.id} name={cat.name} />
                  </div>
                </div>

                {/* Templates in this category */}
                {catTemplates.length > 0 ? (
                  <div className="px-5 py-3 flex flex-wrap gap-2">
                    {catTemplates.map(t => (
                      <Link
                        key={t.id}
                        href={`/admin/templates/${t.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-amber-400 hover:bg-amber-50 transition"
                      >
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${TIER_COLOR[t.tier] ?? 'bg-neutral-100 text-neutral-600'}`}>
                          {t.tier}
                        </span>
                        {t.title}
                        {t.status === 'published' && <span className="text-emerald-500">●</span>}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-3 text-xs text-neutral-400">ยังไม่มีเทมเพลตใน catalog นี้</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add new category */}
        <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-6">
          <h2 className="font-black text-neutral-900 mb-4">+ เพิ่ม Catalog ใหม่</h2>
          <form action={createCategoryAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Emoji</label>
                <input
                  name="emoji"
                  defaultValue="📋"
                  maxLength={4}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xl text-center focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Slug (a-z, 0-9, -)</label>
                <input
                  name="slug"
                  placeholder="เช่น health"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 mb-1">ชื่อ Catalog (ภาษาไทย)</label>
              <input
                name="name"
                placeholder="เช่น สุขภาพ / ออกกำลังกาย"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-black text-white hover:bg-amber-700 transition"
            >
              เพิ่ม Catalog
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}
