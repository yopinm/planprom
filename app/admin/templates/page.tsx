// app/admin/templates/page.tsx — V15-ADMIN-1 Template & Planner Manager list
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { togglePublishAction } from './actions'
import { DeleteTemplateButton } from '@/components/admin/DeleteTemplateButton'
import { ArchiveTemplateButton } from '@/components/admin/ArchiveTemplateButton'

export const metadata: Metadata = {
  title: 'Template & Planner Manager — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Template = {
  id: string
  slug: string
  title: string
  tier: string
  price_baht: number
  status: string
  document_type: string
  published_at: string | null
  created_at: string
  sale_count: number
  category_emoji: string | null
  category_name: string | null
}

const TYPE_COLOR: Record<string, string> = {
  checklist: 'bg-blue-100 text-blue-700',
  planner:   'bg-purple-100 text-purple-700',
  form:      'bg-teal-100 text-teal-700',
  report:    'bg-orange-100 text-orange-700',
}
const TYPE_LABEL: Record<string, string> = {
  checklist: '✅ เช็คลิสต์',
  planner:   '📅 แพลนเนอร์',
  form:      '📝 ฟอร์ม',
  report:    '📊 รายงาน',
}

const TIER_COLOR: Record<string, string> = {
  free:     'bg-emerald-100 text-emerald-700',
  standard: 'bg-amber-100 text-amber-700',
  premium:  'bg-violet-100 text-violet-700',
  ultra:    'bg-rose-100 text-rose-700',
}

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-neutral-100 text-neutral-500',
  published: 'bg-green-100 text-green-700',
  archived:  'bg-red-100 text-red-500',
}

const TYPE_TABS = [
  { label: 'ทั้งหมด',               value: '' },
  { label: '📅 แพลนเนอร์',         value: 'planner' },
  { label: '✅ เช็คลิสต์',         value: 'checklist' },
  { label: '📝 ฟอร์ม',             value: 'form' },
  { label: '📊 รายงาน',            value: 'report' },
]

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  await requireAdminSession('/admin/login')
  const { type } = await searchParams
  const activeType = type ?? ''

  const templates = await (activeType
    ? db<Template[]>`
        SELECT t.id, t.slug, t.title, t.tier, t.price_baht, t.status,
               t.document_type, t.published_at, t.created_at, t.sale_count,
               c.emoji AS category_emoji, c.name AS category_name
        FROM templates t
        LEFT JOIN template_category_links l ON l.template_id = t.id
        LEFT JOIN template_categories c ON c.id = l.category_id
        WHERE t.document_type = ${activeType}
        ORDER BY t.created_at DESC
      `
    : db<Template[]>`
        SELECT t.id, t.slug, t.title, t.tier, t.price_baht, t.status,
               t.document_type, t.published_at, t.created_at, t.sale_count,
               c.emoji AS category_emoji, c.name AS category_name
        FROM templates t
        LEFT JOIN template_category_links l ON l.template_id = t.id
        LEFT JOIN template_categories c ON c.id = l.category_id
        ORDER BY t.created_at DESC
      `
  ).catch(() => [] as Template[])

  const published = templates.filter(t => t.status === 'published').length
  const draft     = templates.filter(t => t.status === 'draft').length

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs font-bold text-neutral-400 hover:text-black">← Admin</Link>
            <h1 className="mt-1 text-2xl font-black text-black">Template &amp; Planner Manager</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {published} published · {draft} draft · {templates.length} รวม{activeType ? ` (กรอง: ${activeType})` : ''}
            </p>
          </div>
          <Link
            href="/admin/templates/new"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-black text-white transition hover:bg-amber-700"
          >
            + เพิ่ม Template
          </Link>
        </div>

        {/* Type filter tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {TYPE_TABS.map(tab => (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/templates?type=${tab.value}` : '/admin/templates'}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                activeType === tab.value
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-amber-400 hover:text-amber-700'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* List */}
        <div className="mt-8 space-y-3">
          {templates.length === 0 && (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white py-16 text-center">
              <p className="text-2xl">📋</p>
              <p className="mt-2 text-sm font-bold text-neutral-400">ยังไม่มี template — เพิ่มอันแรกได้เลย</p>
              <Link href="/admin/templates/new" className="mt-4 inline-block rounded-xl bg-amber-600 px-5 py-2 text-sm font-black text-white hover:bg-amber-700">
                + เพิ่ม Template
              </Link>
            </div>
          )}

          {templates.map(t => (
            <div key={t.id} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-black">{t.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${TIER_COLOR[t.tier] ?? 'bg-neutral-100 text-neutral-600'}`}>
                    {t.tier}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_COLOR[t.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                    {t.status}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider ${TYPE_COLOR[t.document_type] ?? 'bg-neutral-100 text-neutral-500'}`}>
                    {TYPE_LABEL[t.document_type] ?? t.document_type}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-400">
                  <span className="font-mono">{t.slug}</span>
                  <span className="font-bold text-emerald-600">฿{t.price_baht}</span>
                  {t.category_name && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 font-medium">
                      {t.category_emoji} {t.category_name}
                    </span>
                  )}
                  {t.sale_count > 0 && <span>{t.sale_count} ขาย</span>}
                  <span>{new Date(t.created_at).toLocaleDateString('th-TH')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/templates/${t.id}/edit`}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-600 hover:border-black hover:text-black"
                >
                  แก้ไข
                </Link>

                <form action={togglePublishAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="status" value={t.status} />
                  <button
                    type="submit"
                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                      t.status === 'published'
                        ? 'bg-green-50 text-green-700 hover:bg-orange-50 hover:text-orange-600'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    {t.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                </form>

                <ArchiveTemplateButton id={t.id} status={t.status} />
                <DeleteTemplateButton id={t.id} title={t.title} />
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
