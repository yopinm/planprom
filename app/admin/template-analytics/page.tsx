// /admin/template-analytics — INTEL-A+B+C+D: Market Intelligence Dashboard v2
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Market Intelligence — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// ── Constants ─────────────────────────────────────────────────────────────────
const SEED_KEYWORDS = [
  // Core
  { key: 'checklist', label: 'Checklist', engineType: 'checklist', color: 'bg-indigo-50 text-indigo-700',  border: 'border-indigo-200', headerBg: 'bg-indigo-50'  },
  { key: 'planner',   label: 'Planner',   engineType: 'pipeline',  color: 'bg-purple-50 text-purple-700', border: 'border-purple-200', headerBg: 'bg-purple-50' },
  { key: 'ฟอร์ม',     label: 'Form',      engineType: 'form',      color: 'bg-teal-50 text-teal-700',     border: 'border-teal-200',   headerBg: 'bg-teal-50'   },
  { key: 'รายงาน',   label: 'Report',    engineType: 'report',    color: 'bg-amber-50 text-amber-700',   border: 'border-amber-200',  headerBg: 'bg-amber-50'  },
  // Extended (B: new seed keywords)
  { key: 'ตาราง',    label: 'ตาราง',    engineType: 'form',      color: 'bg-teal-50 text-teal-700',     border: 'border-teal-200',   headerBg: 'bg-teal-50'   },
  { key: 'ใบแจ้ง',   label: 'ใบแจ้ง',   engineType: 'form',      color: 'bg-teal-50 text-teal-700',     border: 'border-teal-200',   headerBg: 'bg-teal-50'   },
  { key: 'แผนงาน',   label: 'แผนงาน',   engineType: 'pipeline',  color: 'bg-purple-50 text-purple-700', border: 'border-purple-200', headerBg: 'bg-purple-50' },
  { key: 'บัญชี',    label: 'บัญชี',    engineType: 'report',    color: 'bg-amber-50 text-amber-700',   border: 'border-amber-200',  headerBg: 'bg-amber-50'  },
] as const

// A: expanded from 6 → 15 most-common Thai consonants
const ALPHA_CHARS = ['ก','ข','ค','ง','จ','ต','ท','น','บ','ป','ม','ว','ส','ห','อ'] as const
const DRILL_LIMIT = 6 // per engineType — D: drill ALL Level 1 (covered + uncovered)

const AUDIENCE_RULES: { tag: string; color: string; pattern: RegExp }[] = [
  { tag: 'ส่วนตัว',    color: 'bg-sky-100 text-sky-700',       pattern: /เที่ยว|เดินทาง|งานแต่ง|ออกกำลัง|ชีวิต|สุขภาพ|ห้อง|บ้าน|เปิดเทอม|โรงเรียน|ไปเรียน/ },
  { tag: 'ธุรกิจ SME', color: 'bg-amber-100 text-amber-700',   pattern: /ร้าน|ธุรกิจ|ใบเสนอ|ราคา|ลูกค้า|invoice|สินค้า|ขาย|เปิดกิจการ|บริษัท|ใบส่ง/ },
  { tag: 'ราชการ/HR',  color: 'bg-red-100 text-red-700',       pattern: /ราชการ|หน่วยงาน|ประกัน|ว่างงาน|ปฏิบัติงาน|ลา|บันทึก|ประชุม|มอบอำนาจ|รายงานตัว/ },
  { tag: 'โครงการ',    color: 'bg-purple-100 text-purple-700', pattern: /โครงการ|ก่อสร้าง|timeline|แผนงาน|ประจำปี|งบ|ระยะเวลา|milestone/ },
  { tag: 'การศึกษา',   color: 'bg-green-100 text-green-700',   pattern: /นักเรียน|มหาวิทยาลัย|สอบ|เรียน|วิชา|semester|วิทยาลัย/ },
]

const NOISE = /^(แปลว่า|คือ|ภาษาอังกฤษ|pdf|ฟรี|goodnote|sut|a problem|speech|สรุป|one piece|marvel|resident evil|ฟอร์มาลิน|ฟอร์มาลดีไฮด์|ฟอร์มูลาวัน|formula 1|format factory|format$|formula$)$/i

// ── Types ─────────────────────────────────────────────────────────────────────
type TemplateRef = { id: string; title: string; slug: string; orders: number }
type IdeaRow = {
  idea: string
  stripped: string
  level: 1 | 2 | 3
  source?: string
  char?: string
  match: TemplateRef | null
}
type KpiRow  = { total_revenue: string; paid_orders: string; pending_orders: string; total_downloads: string; unique_buyers: string }
type TypeRow = { type_group: string; orders: string; paid: string; revenue: string }
type DailyRow = { day: string; orders: string; revenue: string }
type RankRow  = { id: string; title: string; slug: string; engine_type: string; price_baht: number; status: string; orders: string; revenue: string; downloads: string }
type GapRow   = { engine_type: string; template_count: string; total_orders: string }

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchSuggestions(keyword: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(keyword)}&hl=th&gl=th`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = await res.json() as [string, string[]]
    return (json[1] ?? []).slice(0, 10)
  } catch { return [] }
}

function stripPrefix(s: string, keyword: string): string {
  return s.replace(new RegExp(`^${keyword}\\s*`, 'i'), '').trim()
}

function findMatch(stripped: string, templates: TemplateRef[]): TemplateRef | null {
  if (!stripped || stripped.length < 2) return null
  const words = stripped.split(/\s+/).filter(w => w.length > 1)
  if (!words.length) return null
  return templates.find(t => words.some(w => t.title.includes(w))) ?? null
}

function analyzeKeyword(keyword: string, suggestions: string[]) {
  const joined    = suggestions.join(' ')
  const audiences = AUDIENCE_RULES.filter(r => r.pattern.test(joined))
  const ideas: string[] = []
  for (const s of suggestions) {
    const stripped = stripPrefix(s, keyword)
    if (!stripped || NOISE.test(stripped)) continue
    ideas.push(`${keyword} ${stripped}`)
    if (ideas.length >= 5) break
  }
  const actionable  = suggestions.filter(s => { const st = stripPrefix(s, keyword); return st && !NOISE.test(st) }).length
  const demand: 'สูง' | 'กลาง' | 'ต่ำ' = actionable >= 5 ? 'สูง' : actionable >= 3 ? 'กลาง' : 'ต่ำ'
  const demandColor = demand === 'สูง' ? 'bg-green-100 text-green-700' : demand === 'กลาง' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-500'
  return { audiences, ideas, demand, demandColor }
}

// C: priority score = level weight × (100 − coverage%)
function priorityScore(level: 1 | 2 | 3, pct: number): number {
  return Math.round((level === 1 ? 3 : level === 2 ? 2 : 1) * (100 - pct))
}

function priorityBadge(score: number): { label: string; color: string } {
  if (score >= 250) return { label: '🔴 ด่วนสุด', color: 'bg-red-100 text-red-700' }
  if (score >= 150) return { label: '🟠 ควรทำ',   color: 'bg-orange-100 text-orange-700' }
  if (score >= 50)  return { label: '🟡 พิจารณา', color: 'bg-amber-100 text-amber-700' }
  return              { label: '⚪ ต่ำ',          color: 'bg-neutral-100 text-neutral-500' }
}

const ENGINE_LABEL: Record<string, string> = { checklist: 'Checklist', pipeline: 'Planner', planner: 'Planner', form: 'Form', report: 'Report' }
const ENGINE_COLOR: Record<string, string> = {
  checklist: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  pipeline:  'border-purple-200 bg-purple-50 text-purple-900',
  planner:   'border-purple-200 bg-purple-50 text-purple-900',
  form:      'border-teal-200 bg-teal-50 text-teal-900',
  report:    'border-amber-200 bg-amber-50 text-amber-900',
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminMarketIntelPage() {
  await requireAdminSession('/admin/login')

  // ── Phase 1 (parallel) ───────────────────────────────────────────────────
  const [baseSuggestRaw, allTemplates, kpiRow, byType, daily, ranking, gapData, alphaRaw] =
    await Promise.all([
      Promise.all(SEED_KEYWORDS.map(async kw => ({ kw, suggestions: await fetchSuggestions(kw.key) }))),

      db<TemplateRef[]>`
        SELECT t.id, t.title, t.slug,
          COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status = 'paid') AS orders
        FROM templates t
        LEFT JOIN order_items oi ON oi.template_id = t.id
        LEFT JOIN orders o ON o.id = oi.order_id
        WHERE t.status = 'published'
        GROUP BY t.id
      `.catch(() => [] as TemplateRef[]),

      db<KpiRow[]>`
        SELECT
          COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid'), 0)::text AS total_revenue,
          COUNT(*) FILTER (WHERE status = 'paid')::text AS paid_orders,
          COUNT(*) FILTER (WHERE status = 'pending_payment')::text AS pending_orders,
          COALESCE((SELECT SUM(oi.download_count) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status = 'paid'), 0)::text AS total_downloads,
          COUNT(DISTINCT customer_line_id) FILTER (WHERE status = 'paid' AND customer_line_id IS NOT NULL)::text AS unique_buyers
        FROM orders
      `.catch(() => [{ total_revenue: '0', paid_orders: '0', pending_orders: '0', total_downloads: '0', unique_buyers: '0' }]),

      db<TypeRow[]>`
        WITH item_share AS (
          SELECT oi.template_id, oi.order_id, o.status,
            ROUND(o.total_baht::numeric / COUNT(*) OVER (PARTITION BY o.id)) AS share
          FROM order_items oi JOIN orders o ON o.id = oi.order_id
        )
        SELECT
          CASE WHEN t.engine_type IN ('planner','planner-pipeline','pipeline') THEN 'pipeline'
               WHEN t.engine_type IN ('checklist','form','report') THEN t.engine_type
               ELSE 'other' END AS type_group,
          COUNT(DISTINCT s.order_id)::text AS orders,
          COUNT(DISTINCT s.order_id) FILTER (WHERE s.status = 'paid')::text AS paid,
          COALESCE(SUM(s.share) FILTER (WHERE s.status = 'paid'), 0)::text AS revenue
        FROM item_share s JOIN templates t ON t.id = s.template_id
        GROUP BY type_group
      `.catch(() => [] as TypeRow[]),

      db<DailyRow[]>`
        SELECT DATE(created_at AT TIME ZONE 'Asia/Bangkok') AS day,
          COUNT(*) FILTER (WHERE status = 'paid')::text AS orders,
          COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid'), 0)::text AS revenue
        FROM orders WHERE created_at > NOW() - INTERVAL '14 days'
        GROUP BY day ORDER BY day DESC
      `.catch(() => [] as DailyRow[]),

      db<RankRow[]>`
        SELECT t.id, t.title, t.slug, COALESCE(t.engine_type,'') AS engine_type, t.price_baht, t.status,
          COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status = 'paid')::text AS orders,
          COALESCE(SUM(o.total_baht / (SELECT COUNT(*) FROM order_items x WHERE x.order_id = o.id)::numeric) FILTER (WHERE o.status = 'paid'), 0)::text AS revenue,
          COALESCE(SUM(oi.download_count), 0)::text AS downloads
        FROM templates t
        LEFT JOIN order_items oi ON oi.template_id = t.id
        LEFT JOIN orders o ON o.id = oi.order_id
        GROUP BY t.id ORDER BY orders::int DESC, t.created_at DESC
      `.catch(() => [] as RankRow[]),

      db<GapRow[]>`
        SELECT CASE WHEN engine_type IN ('planner','planner-pipeline','pipeline') THEN 'pipeline'
                    WHEN engine_type IN ('checklist','form','report') THEN engine_type
                    ELSE 'other' END AS engine_type,
          COUNT(*)::text AS template_count,
          COALESCE(SUM(sale_count), 0)::text AS total_orders
        FROM templates WHERE status = 'published' GROUP BY engine_type
      `.catch(() => [] as GapRow[]),

      // A: 8 keywords × 15 chars = 120 alpha calls (cached 1h)
      Promise.all(
        SEED_KEYWORDS.flatMap(kw =>
          ALPHA_CHARS.map(async char => ({
            engineType: kw.engineType, keyword: kw.key, char,
            suggestions: await fetchSuggestions(`${kw.key} ${char}`),
          }))
        )
      ),
    ])

  const kpi = kpiRow[0] ?? { total_revenue: '0', paid_orders: '0', pending_orders: '0', total_downloads: '0', unique_buyers: '0' }
  const keywordData = baseSuggestRaw.map(({ kw, suggestions }) => ({
    ...kw, suggestions, ...analyzeKeyword(kw.key, suggestions),
  }))

  // ── Build Level 1 — merged by engineType (B+D) ───────────────────────────
  const uniqueEngineTypes = [...new Set(SEED_KEYWORDS.map(kw => kw.engineType))]
  const level1Map = new Map<string, IdeaRow[]>(uniqueEngineTypes.map(et => [et, []]))
  const seenMap   = new Map<string, Set<string>>(uniqueEngineTypes.map(et => [et, new Set<string>()]))
  const drillQueue: { idea: string; engineType: string; keyword: string }[] = []

  for (const { kw, suggestions } of baseSuggestRaw) {
    const seen = seenMap.get(kw.engineType)!
    const rows = level1Map.get(kw.engineType)!
    for (const s of suggestions) {
      const stripped = stripPrefix(s, kw.key)
      if (!stripped || NOISE.test(stripped) || seen.has(stripped)) continue
      seen.add(stripped)
      const match = findMatch(stripped, allTemplates)
      rows.push({ idea: s, stripped, level: 1, match })
      // D: drill ALL Level 1 (covered + uncovered)
      if (drillQueue.filter(d => d.engineType === kw.engineType).length < DRILL_LIMIT) {
        drillQueue.push({ idea: s, engineType: kw.engineType, keyword: kw.key })
      }
    }
  }

  // ── Phase 2 (sequential): drill-down ─────────────────────────────────────
  const drillResults = await Promise.all(
    drillQueue.map(async d => ({ ...d, suggestions: await fetchSuggestions(d.idea) }))
  )

  const level2Map = new Map<string, IdeaRow[]>()
  for (const dr of drillResults) {
    const seen = seenMap.get(dr.engineType) ?? new Set<string>()
    const rows = level2Map.get(dr.engineType) ?? []
    for (const s of dr.suggestions) {
      const stripped = stripPrefix(s, dr.keyword)
      if (!stripped || NOISE.test(stripped) || seen.has(stripped)) continue
      seen.add(stripped)
      rows.push({ idea: s, stripped, level: 2, source: dr.idea, match: findMatch(stripped, allTemplates) })
    }
    level2Map.set(dr.engineType, rows)
    seenMap.set(dr.engineType, seen)
  }

  // ── Build Level 3 (alphabet) ─────────────────────────────────────────────
  const level3Map = new Map<string, IdeaRow[]>()
  for (const ar of alphaRaw) {
    const seen = seenMap.get(ar.engineType) ?? new Set<string>()
    const rows = level3Map.get(ar.engineType) ?? []
    for (const s of ar.suggestions) {
      const stripped = stripPrefix(s, ar.keyword)
      if (!stripped || NOISE.test(stripped) || seen.has(stripped)) continue
      seen.add(stripped)
      rows.push({ idea: s, stripped, level: 3, char: ar.char, match: findMatch(stripped, allTemplates) })
    }
    level3Map.set(ar.engineType, rows)
    seenMap.set(ar.engineType, seen)
  }

  // ── Combine coverage per engine ───────────────────────────────────────────
  const coverageMap = new Map<string, IdeaRow[]>()
  for (const et of uniqueEngineTypes) {
    coverageMap.set(et, [
      ...(level1Map.get(et) ?? []),
      ...(level2Map.get(et) ?? []),
      ...(level3Map.get(et) ?? []),
    ])
  }

  // ── C: Priority List — uncovered ideas sorted by score ───────────────────
  const seenPrio = new Set<string>()
  const priorityList: Array<{ idea: string; level: 1|2|3; engineType: string; score: number }> = []
  for (const [engineType, rows] of coverageMap) {
    const covered = rows.filter(r => r.match !== null).length
    const pct     = rows.length > 0 ? Math.round((covered / rows.length) * 100) : 0
    for (const row of rows) {
      if (row.match !== null || seenPrio.has(row.idea)) continue
      seenPrio.add(row.idea)
      priorityList.push({ idea: row.idea, level: row.level, engineType, score: priorityScore(row.level, pct) })
    }
  }
  const topBuildNext = priorityList.sort((a, b) => b.score - a.score).slice(0, 20)

  // ── Sales ─────────────────────────────────────────────────────────────────
  const ALL_TYPES   = ['checklist', 'pipeline', 'form', 'report'] as const
  const typeMap     = new Map(byType.map(r => [r.type_group, r]))
  const gapMap      = new Map(gapData.map(r => [r.engine_type, r]))
  const bestsellers = ranking.filter(r => Number(r.orders) > 0)
  const zeroSale    = ranking.filter(r => Number(r.orders) === 0 && r.status === 'published')
  const maxOrders   = Math.max(...bestsellers.map(r => Number(r.orders)), 1)

  const LEVEL_BADGE: Record<1|2|3, { label: string; color: string }> = {
    1: { label: '🔍 Base',  color: 'bg-indigo-100 text-indigo-700' },
    2: { label: '🔽 Drill', color: 'bg-purple-100 text-purple-700' },
    3: { label: '🔤 ก-ฮ',  color: 'bg-teal-100 text-teal-700' },
  }

  // one card per engineType for coverage section
  const uniqueKwCards = SEED_KEYWORDS.filter(
    (kw, idx, arr) => arr.findIndex(k => k.engineType === kw.engineType) === idx
  )

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/admin" className="text-xs font-bold text-neutral-400 hover:text-black">← Admin</Link>
            <h1 className="mt-1 text-2xl font-black text-black">Market Intelligence</h1>
            <p className="mt-0.5 text-sm text-neutral-500">ตลาดต้องการอะไร + เราครอบแค่ไหน → สร้าง template ที่ถูกจุด</p>
          </div>
          <span className="mt-6 rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-black text-indigo-700 uppercase">
            {SEED_KEYWORDS.length} keywords · {ALPHA_CHARS.length} alpha · cache 1h
          </span>
        </div>

        {/* ── S1: KPI ─────────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-neutral-400">ภาพรวมยอดขาย</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'รายได้รวม',     value: `฿${Number(kpi.total_revenue).toLocaleString('th-TH')}`, color: 'text-emerald-700' },
              { label: 'Orders สำเร็จ', value: kpi.paid_orders,     color: 'text-green-700' },
              { label: 'รอชำระ',         value: kpi.pending_orders,  color: 'text-yellow-700' },
              { label: 'ดาวน์โหลด',      value: kpi.total_downloads, color: 'text-blue-700' },
              { label: 'ลูกค้า (LINE)',  value: kpi.unique_buyers,   color: 'text-violet-700' },
            ].map(k => (
              <div key={k.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
                <p className={`mt-1 text-2xl font-black ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── S2: Revenue by Engine ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-neutral-400">ยอดขายแยกตาม Engine</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ALL_TYPES.map(type => {
              const row = typeMap.get(type)
              return (
                <div key={type} className={`rounded-xl border px-4 py-4 ${ENGINE_COLOR[type] ?? 'border-neutral-200 bg-neutral-50'}`}>
                  <p className="font-black capitalize">{ENGINE_LABEL[type] ?? type}</p>
                  <p className="mt-2 text-2xl font-black">฿{Number(row?.revenue ?? 0).toLocaleString('th-TH')}</p>
                  <p className="mt-0.5 text-xs opacity-70">{row?.paid ?? 0} orders paid</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── S3: สร้างอะไรก่อน (C: Priority) ─────────────────────────────── */}
        <section>
          <h2 className="mb-1 text-xs font-black uppercase tracking-widest text-neutral-400">สร้างอะไรก่อน</h2>
          <p className="mb-4 text-xs text-neutral-400">
            Idea ที่ยังไม่มี template · เรียงตาม <span className="font-bold text-neutral-600">Priority = level × (100 − coverage%)</span>
          </p>
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {topBuildNext.length === 0 ? (
              <p className="px-5 py-6 text-sm font-bold text-emerald-600 text-center">🎉 ครอบคลุมทุก idea แล้ว!</p>
            ) : topBuildNext.map((item, i) => {
              const badge  = priorityBadge(item.score)
              const lBadge = LEVEL_BADGE[item.level]
              const engCol = ENGINE_COLOR[item.engineType] ?? 'border-neutral-200 bg-neutral-50 text-neutral-900'
              return (
                <div key={i} className="flex items-center gap-2 px-5 py-3">
                  <span className="shrink-0 w-5 text-right text-[10px] font-black text-neutral-300">{i + 1}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black whitespace-nowrap ${badge.color}`}>{badge.label}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black whitespace-nowrap ${engCol}`}>{ENGINE_LABEL[item.engineType] ?? item.engineType}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black whitespace-nowrap ${lBadge.color}`}>{lBadge.label}</span>
                  <span className="flex-1 min-w-0 text-xs font-medium text-neutral-800 truncate">{item.idea}</span>
                  <span className="shrink-0 font-mono text-[9px] text-neutral-300">{item.score}pt</span>
                  <Link href="/admin/templates/new" className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] font-black text-amber-700 hover:bg-amber-100 transition">
                    + สร้าง
                  </Link>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── S4: ครอบคลุมแค่ไหน ───────────────────────────────────────────── */}
        <section>
          <h2 className="mb-1 text-xs font-black uppercase tracking-widest text-neutral-400">ครอบคลุมแค่ไหน</h2>
          <p className="mb-4 text-xs text-neutral-400">
            จับคู่ Google Suggest → Template ใน DB · 3 ขั้น: <span className="font-bold text-indigo-600">🔍 Base</span> → <span className="font-bold text-purple-600">🔽 Drill-down</span> → <span className="font-bold text-teal-600">🔤 ก-ฮ Alphabet</span>
          </p>
          <div className="space-y-4">
            {uniqueKwCards.map(kw => {
              const rows    = coverageMap.get(kw.engineType) ?? []
              const covered = rows.filter(r => r.match !== null).length
              const total   = rows.length
              const pct     = total > 0 ? Math.round((covered / total) * 100) : 0
              return (
                <div key={kw.engineType} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${kw.border}`}>
                  <div className={`flex items-center justify-between px-5 py-3 border-b ${kw.border} ${kw.headerBg}`}>
                    <span className={`font-mono font-black text-sm uppercase tracking-wider ${kw.color}`}>{ENGINE_LABEL[kw.engineType] ?? kw.engineType}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500">{covered}/{total} ครอบแล้ว</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${pct >= 60 ? 'bg-green-100 text-green-700' : pct >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                        {pct}% covered
                      </span>
                    </div>
                  </div>
                  {rows.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-neutral-400 italic">— ไม่มีข้อมูล</p>
                  ) : (
                    <div className="divide-y divide-neutral-50">
                      {rows.map((row, i) => {
                        const badge = LEVEL_BADGE[row.level]
                        return (
                          <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black whitespace-nowrap ${badge.color}`}>{badge.label}</span>
                            <span className="flex-1 min-w-0 text-xs text-neutral-700 truncate">{row.idea}</span>
                            {row.match ? (
                              <div className="shrink-0 flex items-center gap-2">
                                <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[160px]">✅ {row.match.title}</span>
                                {row.match.orders > 0 && (
                                  <span className="text-[9px] text-neutral-400">{row.match.orders} orders</span>
                                )}
                                <Link href={`/admin/templates/${row.match.id}/edit`} className="text-[9px] text-neutral-400 hover:text-black">แก้ไข →</Link>
                              </div>
                            ) : (
                              <div className="shrink-0 flex items-center gap-2">
                                <span className="text-[10px] text-orange-500 font-bold">🟠 ยังไม่มี</span>
                                <Link href="/admin/templates/new" className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 hover:bg-amber-100 transition">+ สร้าง</Link>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── S5: Market Demand (Google Suggest) ───────────────────────────── */}
        <section>
          <h2 className="mb-1 text-xs font-black uppercase tracking-widest text-neutral-400">ความต้องการตลาด (Google Suggest)</h2>
          <p className="mb-4 text-xs text-neutral-400">สิ่งที่คนไทยพิมพ์ค้นหาบน Google → โอกาสที่ควรสร้าง template</p>
          <div className="space-y-4">
            {keywordData.map(kw => (
              <div key={kw.key} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${kw.border}`}>
                <div className={`px-5 py-3 flex flex-wrap items-center gap-2 border-b ${kw.color} ${kw.border}`}>
                  <span className="font-mono font-black text-sm uppercase tracking-wider">{kw.label}</span>
                  <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-black ${kw.demandColor}`}>demand {kw.demand}</span>
                  {kw.audiences.map(a => (
                    <span key={a.tag} className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${a.color}`}>{a.tag}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 divide-x divide-neutral-100">
                  <div className="p-4">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">Google Suggest</p>
                    <ol className="space-y-1.5">
                      {kw.suggestions.map((s, i) => {
                        const stripped = stripPrefix(s, kw.key)
                        const isNoise  = !stripped || NOISE.test(stripped)
                        return (
                          <li key={i} className={`flex items-start gap-2 text-xs ${isNoise ? 'opacity-30' : ''}`}>
                            <span className="shrink-0 w-4 text-right text-neutral-300 font-bold">{i + 1}</span>
                            <span className="text-neutral-700 leading-snug">{s}</span>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">💡 Template ที่ควรสร้าง</p>
                      {kw.ideas.length === 0 ? (
                        <p className="text-xs text-neutral-300 italic">— วิเคราะห์ไม่ได้จาก suggestions นี้</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {kw.ideas.map((idea, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="text-amber-500 text-xs shrink-0">→</span>
                              <span className="text-xs font-bold text-neutral-800">{idea}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {kw.audiences.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">🎯 กลุ่มเป้าหมาย</p>
                        <div className="flex flex-wrap gap-1.5">
                          {kw.audiences.map(a => (
                            <span key={a.tag} className={`rounded-full px-2.5 py-1 text-[10px] font-black ${a.color}`}>{a.tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <Link href="/admin/templates/new" className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-black text-neutral-500 hover:border-amber-400 hover:text-amber-600 transition">
                      + สร้าง template →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── S6: Market Gap Matrix ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-1 text-xs font-black uppercase tracking-widest text-neutral-400">Market Gap Matrix</h2>
          <p className="mb-4 text-xs text-neutral-400">เทียบ demand ตลาด vs template ที่มีอยู่ → ช่องว่างที่ควรเติมก่อน</p>
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  <th className="px-5 py-3">Engine</th>
                  <th className="px-4 py-3">Google Demand</th>
                  <th className="px-4 py-3">Template มีแล้ว</th>
                  <th className="px-4 py-3">ยอดขาย</th>
                  <th className="px-4 py-3">คำแนะนำ</th>
                </tr>
              </thead>
              <tbody>
                {ALL_TYPES.map(type => {
                  const kwData        = keywordData.find(k => k.engineType === type)
                  const gap           = gapMap.get(type)
                  const templateCount = Number(gap?.template_count ?? 0)
                  const totalOrders   = Number(gap?.total_orders ?? 0)
                  const demand        = kwData?.demand ?? 'ต่ำ'
                  const demandColor   = kwData?.demandColor ?? 'bg-neutral-100 text-neutral-500'
                  const noTemplate    = templateCount === 0
                  const lowSale       = templateCount > 0 && totalOrders === 0
                  const action        = noTemplate ? '🟠 สร้าง engine ใหม่' : lowSale ? '🟡 ปรับปรุงหัวข้อ' : '✅ มีอยู่แล้ว'
                  const actionColor   = noTemplate ? 'text-orange-600 font-black' : lowSale ? 'text-amber-600 font-bold' : 'text-emerald-600'
                  const kw            = SEED_KEYWORDS.find(k => k.engineType === type)
                  return (
                    <tr key={type} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${kw?.color ?? 'bg-neutral-100 text-neutral-700'}`}>{ENGINE_LABEL[type] ?? type}</span>
                      </td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${demandColor}`}>{demand}</span></td>
                      <td className="px-4 py-3 text-xs font-bold text-neutral-700">{templateCount} ชิ้น</td>
                      <td className="px-4 py-3 text-xs font-bold text-neutral-700">{totalOrders} orders</td>
                      <td className={`px-4 py-3 text-xs ${actionColor}`}>{action}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── S7: Daily 14d ────────────────────────────────────────────────── */}
        {daily.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-neutral-400">ยอดขาย 14 วันล่าสุด</h2>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-wider text-neutral-400">
                    <th className="pb-2 pr-6">วัน</th><th className="pb-2 pr-6">Orders</th><th className="pb-2">รายได้</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map(d => (
                    <tr key={String(d.day)} className="border-b border-neutral-50">
                      <td className="py-2 pr-6 font-mono text-neutral-600">{new Date(d.day).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</td>
                      <td className="py-2 pr-6 font-bold text-neutral-900">{d.orders}</td>
                      <td className="py-2 font-bold text-emerald-700">฿{Number(d.revenue).toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── S8: Bestseller + Zero-sale ───────────────────────────────────── */}
        <section className="space-y-6">
          {bestsellers.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-neutral-400">🏆 ขายดีสุด</h2>
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
                {bestsellers.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-neutral-100 text-neutral-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-neutral-50 text-neutral-400'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800 truncate">{t.title}</p>
                      <div className="mt-1.5 h-1 rounded-full bg-neutral-100">
                        <div className="h-1 rounded-full bg-indigo-400" style={{ width: `${Math.round((Number(t.orders) / maxOrders) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-black text-sm text-indigo-600">{t.orders} orders</p>
                      <p className="text-[10px] text-neutral-400">฿{Number(t.revenue).toLocaleString()} · {t.downloads} DL</p>
                    </div>
                    <Link href={`/admin/templates/${t.id}/edit`} className="shrink-0 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-black text-neutral-500 hover:border-indigo-400 hover:text-indigo-600 transition">แก้ไข</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          {zeroSale.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">⚠️ ยังไม่มียอดขาย</h2>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-black text-red-600">{zeroSale.length} template</span>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
                {zeroSale.map(t => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-700 truncate">{t.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-black uppercase text-green-700">published</span>
                        <span className="text-[10px] text-neutral-400">฿{t.price_baht} · {ENGINE_LABEL[t.engine_type] ?? t.engine_type}</span>
                      </div>
                    </div>
                    <Link href={`/admin/templates/${t.id}/edit`} className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-600 hover:bg-red-100 transition">ปรับปรุง →</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
