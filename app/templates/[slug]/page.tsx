// /templates/[slug] — template detail + buy CTA
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { db } from '@/lib/db'
import type { TocItem } from '@/lib/pdf-types'
import type { ChecklistEngineData, PlannerEngineData } from '@/lib/engine-types'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [tmpl] = await db<{ title: string; description: string }[]>`
    SELECT title, description FROM templates WHERE slug = ${slug} AND status = 'published' LIMIT 1
  `.catch(() => [])
  if (!tmpl) return { title: 'Template — แพลนพร้อม' }
  return {
    title: `${tmpl.title} — แพลนพร้อม`,
    description: tmpl.description,
  }
}

const TIER_LABEL: Record<string, string> = {
  free: 'ฟรี', standard: 'Standard', premium: 'Premium', ultra: 'Ultra',
}
const TIER_COLOR: Record<string, string> = {
  free:     'bg-emerald-100 text-emerald-700',
  standard: 'bg-amber-100 text-amber-700',
  premium:  'bg-violet-100 text-violet-700',
  ultra:    'bg-rose-100 text-rose-700',
}
const TIER_FEATURES: Record<string, string[]> = {
  free:     ['PDF กรอกข้อมูลได้', 'ดาวน์โหลดทันที', 'ใช้ฟรี ไม่มีค่าใช้จ่าย'],
  standard: ['PDF กรอกข้อมูลได้', 'ดาวน์โหลดทันที', 'ใช้ซ้ำตลอดกาล', 'ออกแบบครบถ้วน'],
  premium:  ['PDF กรอกข้อมูลได้', 'ดาวน์โหลดทันที', 'ใช้ซ้ำตลอดกาล', 'ออกแบบระดับพรีเมียม', 'หน้าหลายหน้า'],
  ultra:    ['PDF กรอกข้อมูลได้', 'ดาวน์โหลดทันที', 'ใช้ซ้ำตลอดกาล', 'ออกแบบระดับพรีเมียม', 'หน้าหลายหน้า', 'คอนเทนต์ครบจบในชุดเดียว'],
}

export default async function TemplateDetailPage({ params }: Props) {
  const { slug } = await params

  const [tmpl] = await db<{
    id: string; title: string; description: string; tier: string
    price_baht: number; thumbnail_path: string | null; page_count: number | null
    has_form_fields: boolean; sale_count: number; published_at: string
    category_name: string | null; category_emoji: string | null; category_slug: string | null
    toc_sections: TocItem[] | null
    engine_type: string | null; engine_data: ChecklistEngineData | PlannerEngineData | null
  }[]>`
    SELECT t.id, t.title, t.description, t.tier, t.price_baht,
           t.thumbnail_path, t.page_count, t.has_form_fields, t.sale_count, t.published_at,
           t.toc_sections, t.engine_type, t.engine_data,
           c.name AS category_name, c.emoji AS category_emoji, c.slug AS category_slug
    FROM templates t
    LEFT JOIN template_category_links l ON l.template_id = t.id
    LEFT JOIN template_categories c ON c.id = l.category_id
    WHERE t.slug = ${slug} AND t.status = 'published'
    LIMIT 1
  `.catch(() => [])

  if (!tmpl) notFound()

  const tags = await db<{ name: string }[]>`
    SELECT name FROM template_tags WHERE template_id = ${tmpl.id}
  `.catch(() => [])

  const related = await db<{ id: string; title: string; slug: string; price_baht: number; tier: string; thumbnail_path: string | null }[]>`
    SELECT t.id, t.title, t.slug, t.price_baht, t.tier, t.thumbnail_path
    FROM templates t
    JOIN template_category_links l ON l.template_id = t.id
    JOIN template_category_links l2 ON l2.category_id = l.category_id AND l2.template_id = ${tmpl.id}
    WHERE t.id <> ${tmpl.id} AND t.status = 'published'
    LIMIT 4
  `.catch(() => [])

  const isFree = tmpl.tier === 'free'

  return (
    <main className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
        <div className="mx-auto max-w-4xl flex items-center gap-2 text-xs text-neutral-400">
          <Link href="/" className="hover:text-neutral-700">หน้าแรก</Link>
          <span>/</span>
          {tmpl.category_slug && (
            <>
              <span>{tmpl.category_emoji} {tmpl.category_name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-neutral-700 font-medium truncate">{tmpl.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* Left — detail */}
          <div>
            {/* Thumbnail */}
            <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100">
              {tmpl.thumbnail_path ? (
                <Image src={tmpl.thumbnail_path} alt={tmpl.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FileText size={64} strokeWidth={1.2} className="text-emerald-400" />
                </div>
              )}
              <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black uppercase ${TIER_COLOR[tmpl.tier] ?? 'bg-neutral-100 text-neutral-600'}`}>
                {TIER_LABEL[tmpl.tier] ?? tmpl.tier}
              </span>
            </div>

            {/* Title + meta */}
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">เทมเพลต PDF</p>
            <h1 className="text-2xl font-black text-neutral-900 leading-snug">{tmpl.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              {tmpl.category_name && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 font-medium text-xs">
                  {tmpl.category_emoji} {tmpl.category_name}
                </span>
              )}
              {tmpl.page_count && <span>📄 {tmpl.page_count} หน้า</span>}
              {tmpl.has_form_fields && <span>✏️ กรอกข้อมูลได้</span>}
              {tmpl.sale_count > 0 && <span>🛒 {tmpl.sale_count} คนซื้อแล้ว</span>}
            </div>

            {/* Description */}
            <div className="mt-5 rounded-2xl bg-neutral-50 p-5">
              <h2 className="font-bold text-neutral-900 mb-2">รายละเอียด</h2>
              <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">{tmpl.description}</p>
            </div>

            {/* Features */}
            <div className="mt-5">
              <h2 className="font-bold text-neutral-900 mb-3">รวมอยู่ในแพ็กเกจ</h2>
              <ul className="space-y-2">
                {(TIER_FEATURES[tmpl.tier] ?? TIER_FEATURES.standard).map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Engine Preview — DC-7: structured info from engine_data */}
            {tmpl.engine_type === 'checklist' && tmpl.engine_data && (() => {
              const d = tmpl.engine_data as ChecklistEngineData
              if (!d.s1) return null
              return (
                <div className="mt-5 rounded-2xl bg-emerald-50 p-5">
                  <h2 className="font-bold text-neutral-900 mb-1">ข้อมูลเอกสาร</h2>
                  <p className="text-xs text-neutral-500 mb-3">เช็คลิสต์มาตรฐาน · {d.s3?.items?.filter(i=>i.trim()).length ?? 0} รายการตรวจสอบ</p>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="rounded-lg bg-white p-3 border border-emerald-100">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">รหัสเอกสาร</p>
                      <p className="font-bold text-neutral-800">{d.s1.docCode} · v{d.s1.version}</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 border border-emerald-100">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">ผู้จัดทำ</p>
                      <p className="font-bold text-neutral-800">{d.s1.author}</p>
                    </div>
                  </div>
                  {d.s2?.purpose && (
                    <div className="rounded-lg bg-white p-3 border border-emerald-100 text-sm">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">วัตถุประสงค์</p>
                      <p className="text-neutral-700">{d.s2.purpose}</p>
                    </div>
                  )}
                  {d.s2?.context && (
                    <div className="mt-2 rounded-lg bg-white p-3 border border-emerald-100 text-sm">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">บริบทการใช้งาน</p>
                      <p className="text-neutral-700">{d.s2.context}</p>
                    </div>
                  )}
                </div>
              )
            })()}

            {tmpl.engine_type === 'planner' && tmpl.engine_data && (() => {
              const d = tmpl.engine_data as PlannerEngineData
              if (!d.p1) return null
              const PERIOD: Record<string,string> = { yearly:'รายปี', quarterly:'รายไตรมาส', monthly:'รายเดือน', weekly:'รายสัปดาห์' }
              const FW: Record<string,string> = { SMART:'SMART', OKR:'OKR', both:'SMART+OKR', none:'' }
              const pillars = [
                (d.p1?.yearlyGoals?.filter(g=>g.trim()).length ?? 0) > 0 && 'เป้าหมายปี',
                (d.p2?.views?.length ?? 0) > 0 && 'Execution Layout',
                ((d.p3?.habitNames?.filter(h=>h.trim()).length ?? 0) > 0 || d.p3?.includeMoodTracker) && 'Habit & Mood Tracker',
                (d.p4?.projectAreas?.filter(a=>a.trim()).length ?? 0) > 0 && 'Project Planning',
              ].filter(Boolean) as string[]
              return (
                <div className="mt-5 rounded-2xl bg-violet-50 p-5">
                  <h2 className="font-bold text-neutral-900 mb-1">ภาพรวม Planner</h2>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                      📅 {PERIOD[d.p1.period] ?? d.p1.period}
                    </span>
                    {FW[d.p1.framework] && (
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                        🎯 {FW[d.p1.framework]}
                      </span>
                    )}
                    {pillars.map(p => (
                      <span key={p} className="rounded-full bg-white border border-violet-200 px-3 py-1 text-xs font-bold text-violet-600">
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                  {d.p1.description && (
                    <p className="text-sm text-neutral-700 mb-3">{d.p1.description}</p>
                  )}
                  {(d.p1?.yearlyGoals?.filter(g=>g.trim()).length ?? 0) > 0 && (
                    <div className="rounded-lg bg-white p-3 border border-violet-100">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">เป้าหมายประจำปีที่รวมอยู่</p>
                      <ul className="space-y-1">
                        {d.p1.yearlyGoals.filter(g=>g.trim()).map((g,i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                            <span className="text-violet-400 shrink-0">●</span>{g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* TOC — always expanded on detail page (docx path) */}
            {!tmpl.engine_type && tmpl.toc_sections && tmpl.toc_sections.length > 0 && (
              <div className="mt-5 rounded-2xl bg-violet-50 p-5">
                <h2 className="font-bold text-neutral-900 mb-1">สารบัญเนื้อหา</h2>
                <p className="text-xs text-neutral-500 mb-3">{tmpl.toc_sections.length} หัวข้อ</p>
                <ul className="space-y-1">
                  {tmpl.toc_sections.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-neutral-700 leading-snug"
                      style={{ paddingLeft: `${(item.level - 1) * 16}px` }}
                    >
                      <span className="mt-0.5 shrink-0 text-violet-400">
                        {item.level === 1 ? '●' : item.level === 2 ? '○' : '·'}
                      </span>
                      <span>{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag.name} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right — sticky buy card */}
          <div>
            <div className="sticky top-20 rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">
              <div className="mb-4">
                <p className="text-3xl font-black text-neutral-900">
                  {isFree ? 'ฟรี' : '฿20'}
                </p>
                {!isFree && <p className="text-xs text-neutral-400 mt-0.5">จ่ายครั้งเดียว · ใช้ซ้ำตลอดกาล</p>}
              </div>

              {isFree ? (
                <a
                  href="#line-cta"
                  className="block w-full rounded-2xl bg-[#06C755] py-3.5 text-center text-base font-black text-white transition hover:bg-green-500"
                >
                  🎁 รับฟรี ผ่าน LINE OA
                </a>
              ) : (
                <Link
                  href={`/checkout/${slug}`}
                  className="block w-full rounded-2xl bg-amber-500 py-3.5 text-center text-base font-black text-white transition hover:bg-amber-600"
                >
                  ซื้อเลย ฿20
                </Link>
              )}

              <div className="mt-4 space-y-2 text-xs text-neutral-500">
                <p className="flex items-center gap-2"><span>⚡</span> ดาวน์โหลดทันทีหลังชำระ</p>
                <p className="flex items-center gap-2"><span>📱</span> ส่งลิงก์ผ่าน LINE OA</p>
                <p className="flex items-center gap-2"><span>♾️</span> ใช้ซ้ำได้ตลอดกาล</p>
                <p className="flex items-center gap-2"><span>❓</span> มีปัญหา ติดต่อ @couponkum</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related templates */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-black text-neutral-900 mb-4">เทมเพลตที่เกี่ยวข้อง</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/templates/${r.slug}`}
                  className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:border-orange-400 hover:shadow-md"
                >
                  <div className="relative h-24 overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100">
                    {r.thumbnail_path
                      ? <Image src={r.thumbnail_path} alt={r.title} fill className="object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><FileText size={28} strokeWidth={1.5} className="text-emerald-400" /></div>
                    }
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] text-neutral-400">เทมเพลต PDF</p>
                    <p className="text-xs font-semibold leading-snug text-neutral-800 line-clamp-2">{r.title}</p>
                    <p className="mt-1 text-sm font-black text-emerald-700">{r.tier === 'free' ? 'ฟรี' : '฿20'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
