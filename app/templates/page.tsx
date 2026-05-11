// /templates — catalog page with filter by category/tag/price/text search
import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { TemplateSearchForm } from '@/components/templates/TemplateSearchForm'
import { TemplateListWithPreview } from '@/components/templates/TemplateListWithPreview'
import type { TocItem } from '@/components/templates/TocPreview'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'เทมเพลต PDF ทั้งหมด — แพลนพร้อม',
  description: 'เทมเพลต PDF พร้อมใช้ · วางแผนการเงิน ธุรกิจ ครอบครัว อาชีพ · ฿20–100 ดาวน์โหลดทันที',
}

type Template = {
  id: string; slug: string; title: string
  price_baht: number; tier: string; description: string
  thumbnail_path: string | null; sale_count: number; document_type: string
  toc_sections: TocItem[] | null; preview_path: string | null
}

type CategoryRow = { slug: string; name: string; emoji: string | null }

async function fetchAllTemplates(category?: string, price?: string, q?: string, docType?: string): Promise<Template[]> {
  const priceNum = price ? parseInt(price, 10) : null
  const search = q?.trim() ?? ''
  try {
    if (category) {
      return db<Template[]>`
        SELECT t.id, t.slug, t.title, t.price_baht, t.tier, t.description,
               t.thumbnail_path, t.sale_count, t.document_type, t.toc_sections, t.preview_path
        FROM templates t
        JOIN template_category_links l ON l.template_id = t.id
        JOIN template_categories c ON c.id = l.category_id
        WHERE t.status = 'published' AND c.slug = ${category}
          ${priceNum !== null ? db` AND t.price_baht = ${priceNum}` : db``}
          ${search ? db` AND (t.title ILIKE ${'%' + search + '%'} OR t.description ILIKE ${'%' + search + '%'})` : db``}
          ${docType ? db` AND t.document_type = ${docType}` : db``}
        ORDER BY t.sale_count DESC, t.updated_at DESC
      `
    }
    return db<Template[]>`
      SELECT id, slug, title, price_baht, tier, description, thumbnail_path, sale_count, document_type, toc_sections, preview_path
      FROM templates
      WHERE status = 'published'
        ${priceNum !== null ? db` AND price_baht = ${priceNum}` : db``}
        ${search ? db` AND (title ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})` : db``}
        ${docType ? db` AND document_type = ${docType}` : db``}
      ORDER BY sale_count DESC, updated_at DESC
    `
  } catch {
    return []
  }
}

async function fetchCategories(): Promise<CategoryRow[]> {
  try {
    return db<CategoryRow[]>`
      SELECT slug, name, emoji FROM template_categories ORDER BY sort_order ASC, name ASC
    `
  } catch {
    return []
  }
}

interface Props {
  searchParams: Promise<{ category?: string; price?: string; q?: string; type?: string }>
}

export default async function TemplatesPage({ searchParams }: Props) {
  const { category, price, q, type } = await searchParams
  const searchQuery = q?.trim() ?? ''
  const [templates, categories] = await Promise.all([
    fetchAllTemplates(category, price, searchQuery, type),
    fetchCategories(),
  ])

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700">
            ← กลับหน้าแรก
          </Link>
          <h1 className="text-3xl font-black text-neutral-900">📋 เทมเพลตทั้งหมด</h1>
          <p className="mt-1 text-base text-neutral-600">PDF กรอกข้อมูลได้ · ดาวน์โหลดทันที · ใช้ซ้ำตลอดกาล</p>
        </div>

        {/* Search box */}
        <div className="mb-5">
          <TemplateSearchForm defaultQuery={searchQuery} category={category} price={price} />
          {searchQuery && (
            <p className="mt-2 text-sm text-neutral-500">
              ผลการค้นหา &ldquo;<span className="font-semibold text-neutral-800">{searchQuery}</span>&rdquo; — พบ {templates.length} รายการ
              <Link href={`/templates${category ? `?category=${category}` : ''}`} className="ml-3 text-emerald-600 hover:underline">
                ล้างคำค้นหา ×
              </Link>
            </p>
          )}
        </div>

        {/* Filters — plain text rows */}
        <div className="mb-6 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">

          {/* Row 1: หมวดหมู่ */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
              <span className="w-16 shrink-0 text-xs font-bold text-neutral-400">หมวดหมู่</span>
              {categories.map((cat, i) => (
                <>
                  {i > 0 && <span key={`sep-${cat.slug}`} className="text-neutral-300">|</span>}
                  <Link
                    key={cat.slug}
                    href={`/templates?category=${cat.slug}${price ? `&price=${price}` : ''}${type ? `&type=${type}` : ''}`}
                    className={category === cat.slug ? 'font-bold text-emerald-600' : 'text-neutral-500 hover:text-neutral-800 hover:underline'}
                  >
                    {cat.emoji} {cat.name}
                  </Link>
                </>
              ))}
            </div>
          )}

          <div className="border-t border-neutral-200" />

          {/* Row 2: ราคา */}
          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
            <span className="w-16 shrink-0 text-xs font-bold text-neutral-400">ราคา</span>
            {[
              { value: '',   label: 'ทุกราคา' },
              { value: '0',  label: 'ฟรี' },
              { value: '20', label: '฿20' },
            ].map((p, i) => (
              <>
                {i > 0 && <span key={`sep-p-${i}`} className="text-neutral-300">|</span>}
                <Link
                  key={p.value}
                  href={`/templates?${category ? `category=${category}&` : ''}${p.value ? `price=${p.value}` : ''}${type ? `&type=${type}` : ''}`}
                  className={price === p.value || (!price && !p.value) ? 'font-bold text-amber-600' : 'text-neutral-500 hover:text-neutral-800 hover:underline'}
                >
                  {p.label}
                </Link>
              </>
            ))}
          </div>

          <div className="border-t border-neutral-200" />

          {/* Row 3: ประเภท */}
          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
            <span className="w-16 shrink-0 text-xs font-bold text-neutral-400">ประเภท</span>
            {[
              { value: '',          label: 'ทุกประเภท' },
              { value: 'planner',   label: 'แพลนเนอร์' },
              { value: 'checklist', label: 'เช็คลิสต์' },
              { value: 'form',      label: 'ฟอร์ม' },
              { value: 'report',    label: 'รายงาน' },
            ].map((dt, i) => (
              <>
                {i > 0 && <span key={`sep-dt-${i}`} className="text-neutral-300">|</span>}
                <Link
                  key={dt.value}
                  href={`/templates?${category ? `category=${category}&` : ''}${price ? `price=${price}&` : ''}${dt.value ? `type=${dt.value}` : ''}`}
                  className={type === dt.value || (!type && !dt.value) ? 'font-bold text-violet-600' : 'text-neutral-500 hover:text-neutral-800 hover:underline'}
                >
                  {dt.label}
                </Link>
              </>
            ))}
          </div>

        </div>

        {/* Result count */}
        {templates.length > 0 && (
          <p className="mb-3 text-xs text-neutral-400">{templates.length} เทมเพลต</p>
        )}

        {/* Template list — compact rows */}
        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 py-20 text-center text-neutral-500">
            <p className="text-4xl">📭</p>
            <p className="mt-3 font-semibold">ไม่พบเทมเพลตที่ค้นหา</p>
            <Link href="/templates" className="mt-3 inline-block text-sm text-emerald-600 hover:underline">
              ดูเทมเพลตทั้งหมด →
            </Link>
          </div>
        ) : (
          <TemplateListWithPreview templates={templates} />
        )}

        {/* CTA — pricing callout */}
        <div className="mt-10 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-base font-black text-emerald-900">ยิ่งซื้อมาก ยิ่งคุ้ม</p>
          <p className="mt-0.5 text-sm text-emerald-700">ราคาลดอัตโนมัติในตะกร้า ไม่ต้องใส่โค้ด</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold">
            <div className="rounded-xl bg-white border border-emerald-300 px-4 py-2.5 text-center">
              <p className="text-lg font-black text-emerald-700">฿20</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">ชิ้นแรก</p>
            </div>
            <span className="text-emerald-400 font-black text-lg">→</span>
            <div className="rounded-xl bg-white border border-emerald-300 px-4 py-2.5 text-center">
              <p className="text-lg font-black text-emerald-700">฿8<span className="text-xs font-bold">/ชิ้น</span></p>
              <p className="text-[11px] text-emerald-600 mt-0.5">ชิ้น 2–5</p>
            </div>
            <span className="text-emerald-400 font-black text-lg">→</span>
            <div className="rounded-xl bg-white border border-emerald-300 px-4 py-2.5 text-center">
              <p className="text-lg font-black text-emerald-700">฿7<span className="text-xs font-bold">/ชิ้น</span></p>
              <p className="text-[11px] text-emerald-600 mt-0.5">6 ชิ้นขึ้นไป</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-emerald-600">
            📄 PDF พร้อมใช้ · ดาวน์โหลดทันทีหลังชำระ · PromptPay · ไม่ต้องสมัครสมาชิก
          </p>
        </div>

      </div>
    </div>
  )
}
