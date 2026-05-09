// /catalog/[slug] — all templates in a single category
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { CatalogTemplateList } from '@/components/catalog/CatalogTemplateList'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

type CategoryRow = { id: string; name: string; emoji: string | null }
import type { CatalogTemplate } from '@/components/catalog/CatalogTemplateList'

type Template = CatalogTemplate

async function fetchCategory(slug: string): Promise<CategoryRow | null> {
  const rows = await db<CategoryRow[]>`
    SELECT id, name, emoji FROM template_categories WHERE slug = ${slug} LIMIT 1
  `.catch(() => [] as CategoryRow[])
  return rows[0] ?? null
}

async function fetchTemplates(categoryId: string): Promise<Template[]> {
  return db<Template[]>`
    SELECT t.id, t.slug, t.title, t.price_baht, t.tier, t.sale_count, t.document_type, t.preview_path
    FROM templates t
    JOIN template_category_links l ON l.template_id = t.id
    WHERE l.category_id = ${categoryId} AND t.status = 'published'
    ORDER BY t.updated_at DESC, t.sale_count DESC
  `.catch(() => [])
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = await fetchCategory(slug)
  if (!cat) return { title: 'หมวดหมู่ — คูปองคุ้ม' }
  return {
    title: `${cat.emoji ?? ''} ${cat.name} — เทมเพลต PDF | คูปองคุ้ม`,
    description: `เทมเพลต PDF หมวด${cat.name} พร้อมใช้ · ดาวน์โหลดทันที · ใช้ซ้ำตลอดกาล`,
  }
}

export default async function CatalogPage({ params }: Props) {
  const { slug } = await params
  const cat = await fetchCategory(slug)
  if (!cat) notFound()

  const templates = await fetchTemplates(cat.id)

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-700">หน้าแรก</Link>
          <span>/</span>
          <Link href="/templates" className="hover:text-neutral-700">เทมเพลตทั้งหมด</Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800">{cat.emoji} {cat.name}</span>
        </div>

        {/* Header */}
        <div className="mb-8 rounded-2xl border-2 border-emerald-200 bg-[#ECFDF5] px-6 py-5">
          <h1 className="text-2xl font-black text-emerald-900">
            {cat.emoji} {cat.name}
          </h1>
          <p className="mt-1 text-sm text-emerald-700">
            {templates.length > 0
              ? `${templates.length} เทมเพลต · PDF กรอกข้อมูลได้ · ดาวน์โหลดทันที`
              : 'ยังไม่มีเทมเพลตในหมวดนี้'}
          </p>
        </div>

        {/* Template list */}
        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 py-20 text-center text-neutral-500">
            <p className="text-4xl">📭</p>
            <p className="mt-3 font-semibold">ยังไม่มีเทมเพลตในหมวดนี้</p>
            <Link href="/templates" className="mt-3 inline-block text-sm text-emerald-600 hover:underline">
              ดูเทมเพลตทั้งหมด →
            </Link>
          </div>
        ) : (
          <CatalogTemplateList templates={templates} />
        )}

        {/* Back links */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/templates"
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
          >
            ← เทมเพลตทั้งหมด
          </Link>
          <Link
            href="/#template-store"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            หน้าแรก →
          </Link>
        </div>

      </div>
    </div>
  )
}
