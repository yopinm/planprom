'use client'
import { useState } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type TemplateRef = { id: string; title: string; slug: string; orders: number }
export type ExcelDisplayItem = {
  id: number
  idea_text: string
  title_en: string | null
  ranking_need: number
  engine_type: string
  match: TemplateRef | null
  inSuggest: boolean
}

type Tier   = 'confirmed' | 'ai_only' | 'market' | 'defer'
type Filter = 'all' | 'confirmed' | 'ai_only' | 'market' | 'quickwin'

// ── Static config ─────────────────────────────────────────────────────────────
const ENGINE_LABEL: Record<string, string> = {
  checklist: 'Checklist', pipeline: 'Planner', planner: 'Planner', form: 'Form', report: 'Report',
}
const ENGINE_COLOR: Record<string, string> = {
  checklist: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  pipeline:  'border-purple-200 bg-purple-50 text-purple-900',
  planner:   'border-purple-200 bg-purple-50 text-purple-900',
  form:      'border-teal-200 bg-teal-50 text-teal-900',
  report:    'border-amber-200 bg-amber-50 text-amber-900',
}
const TIER_META: Record<Tier, { emoji: string; label: string; desc: string; pill: string }> = {
  confirmed: { emoji: '🔥', label: '🔥 Confirmed', desc: 'Excel ≥9 + Google Suggest — สร้างได้เลย',       pill: 'bg-red-100 text-red-700 border-red-200' },
  ai_only:   { emoji: '🤔', label: '🤔 AI Only',   desc: 'Excel ≥9 ยังไม่มี Google proof',                pill: 'bg-amber-100 text-amber-700 border-amber-200' },
  market:    { emoji: '🔵', label: '🔵 Market',    desc: 'คนค้นหาจริง แต่ AI ให้ rank ต่ำกว่า',           pill: 'bg-blue-100 text-blue-700 border-blue-200' },
  defer:     { emoji: '⏳', label: '⏳ Defer',     desc: 'signal ต่ำทั้งสองทาง — พักไว้ก่อน',            pill: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTier(item: ExcelDisplayItem): Tier {
  if (item.ranking_need >= 9 && item.inSuggest)  return 'confirmed'
  if (item.ranking_need >= 9 && !item.inSuggest) return 'ai_only'
  if (item.inSuggest)                            return 'market'
  return 'defer'
}
function rankBg(r: number) {
  return r >= 9 ? 'bg-red-100 text-red-700' : r >= 7 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
}

// ── Sub-components (defined outside to avoid "nested component" lint error) ───
function IdeaRow({
  item, showTier, deleteAction,
}: {
  item: ExcelDisplayItem
  showTier: boolean
  deleteAction: (formData: FormData) => Promise<void>
}) {
  const tier    = getTier(item)
  const encEng  = item.engine_type === 'pipeline' ? 'planner-pipeline' : item.engine_type
  const createUrl = `/admin/templates/new?title=${encodeURIComponent(item.idea_text)}&engine=${encEng}`

  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:border-neutral-300 transition-colors">
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border ${ENGINE_COLOR[item.engine_type] ?? 'border-neutral-200 bg-neutral-50 text-neutral-700'}`}>
        {ENGINE_LABEL[item.engine_type] ?? item.engine_type}
      </span>
      <span className="flex-1 min-w-0 text-sm font-medium text-neutral-800 truncate">{item.idea_text}</span>

      {showTier && (
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${TIER_META[tier].pill}`}
          title={TIER_META[tier].desc}>
          {TIER_META[tier].emoji}
        </span>
      )}
      {item.inSuggest && (
        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600"
          title="คนค้นหาใน Google จริง">
          🔍 Suggest
        </span>
      )}
      {item.title_en && (
        <span className="hidden sm:block shrink-0 text-xs text-neutral-400 truncate max-w-[140px]">{item.title_en}</span>
      )}
      <Link href={createUrl}
        className="shrink-0 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 hover:bg-orange-200 transition-colors">
        + สร้าง
      </Link>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={item.id} />
        <button type="submit" title="ลบ"
          className="shrink-0 rounded px-1.5 py-0.5 text-[11px] text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          ✕
        </button>
      </form>
    </div>
  )
}

function RankSection({
  items, showTier, deleteAction,
}: {
  items: ExcelDisplayItem[]
  showTier: boolean
  deleteAction: (formData: FormData) => Promise<void>
}) {
  return (
    <>
      {[10, 9, 8, 7, 6, 5].map(rank => {
        const group = items.filter(e => e.ranking_need === rank)
        if (!group.length) return null
        return (
          <div key={rank} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${rankBg(rank)}`}>★ {rank}/10</span>
              <span className="text-xs text-neutral-400">{group.length} รายการ</span>
            </div>
            <div className="space-y-1.5">
              {group.map(item => (
                <IdeaRow key={item.id} item={item} showTier={showTier} deleteAction={deleteAction} />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function ExcelS0Panel({
  gapItems,
  deleteAction,
}: {
  gapItems: ExcelDisplayItem[]
  deleteAction: (formData: FormData) => Promise<void>
}) {
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  const confirmedItems = gapItems.filter(e => getTier(e) === 'confirmed')
  const aiOnlyItems    = gapItems.filter(e => getTier(e) === 'ai_only')
  const marketItems    = gapItems.filter(e => getTier(e) === 'market')
  const quickWinItems  = gapItems.filter(e => e.engine_type === 'checklist' && e.ranking_need >= 9)

  const FILTERS: { key: Filter; label: string; count: number; base: string; active: string }[] = [
    { key: 'confirmed', label: '🔥 Confirmed', count: confirmedItems.length,
      base:   'border-neutral-200 text-neutral-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700',
      active: 'border-red-400 bg-red-50 text-red-700 font-black' },
    { key: 'ai_only',   label: '🤔 AI Only',   count: aiOnlyItems.length,
      base:   'border-neutral-200 text-neutral-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
      active: 'border-amber-400 bg-amber-50 text-amber-700 font-black' },
    { key: 'market',    label: '🔵 Market',    count: marketItems.length,
      base:   'border-neutral-200 text-neutral-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
      active: 'border-blue-400 bg-blue-50 text-blue-700 font-black' },
    { key: 'quickwin',  label: '⚡ Quick Win', count: quickWinItems.length,
      base:   'border-neutral-200 text-neutral-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
      active: 'border-emerald-400 bg-emerald-50 text-emerald-700 font-black' },
    { key: 'all',       label: 'ทั้งหมด',      count: gapItems.length,
      base:   'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:bg-neutral-50',
      active: 'border-neutral-500 bg-neutral-100 text-neutral-800 font-black' },
  ]

  const displayItems: ExcelDisplayItem[] = (() => {
    switch (activeFilter) {
      case 'confirmed': return confirmedItems
      case 'ai_only':   return aiOnlyItems
      case 'market':    return marketItems
      case 'quickwin':  return quickWinItems
      default:          return gapItems
    }
  })()

  const sorted   = [...displayItems].sort((a, b) => b.ranking_need - a.ranking_need)
  const showTier = activeFilter === 'all' || activeFilter === 'quickwin'
  const topItem  = (activeFilter === 'confirmed' || activeFilter === 'quickwin') ? (sorted[0] ?? null) : null

  return (
    <div className="mt-5">
      {/* Tier legend */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {(Object.entries(TIER_META) as [Tier, typeof TIER_META[Tier]][]).map(([k, m]) => (
          <span key={k} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${m.pill}`} title={m.desc}>
            {m.label}
          </span>
        ))}
        <span className="text-[10px] text-neutral-400 ml-1">= Excel AI score × Google Suggest</span>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${activeFilter === f.key ? f.active : f.base}`}>
            {f.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black min-w-[1.25rem] text-center
              ${activeFilter === f.key ? 'bg-white/60' : 'bg-neutral-100 text-neutral-600'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* "Next Build" card */}
      {topItem && (
        <div className="mb-5 rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1.5">⭐ สร้างตัวนี้ก่อน</p>
          <p className="text-sm font-black text-neutral-900 mb-2">{topItem.idea_text}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${ENGINE_COLOR[topItem.engine_type] ?? ''}`}>
              {ENGINE_LABEL[topItem.engine_type]}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${rankBg(topItem.ranking_need)}`}>
              ★ {topItem.ranking_need}/10
            </span>
            {topItem.inSuggest && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">🔍 Google Suggest</span>
            )}
            {topItem.title_en && <span className="text-xs text-neutral-400">{topItem.title_en}</span>}
            <Link
              href={`/admin/templates/new?title=${encodeURIComponent(topItem.idea_text)}&engine=${topItem.engine_type === 'pipeline' ? 'planner-pipeline' : topItem.engine_type}`}
              className="ml-auto rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-black text-white hover:bg-emerald-700 transition-colors">
              + สร้างเลย →
            </Link>
          </div>
        </div>
      )}

      {/* Item list */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-10 text-center">
          <p className="text-sm text-neutral-400">ไม่มีรายการในหมวดนี้</p>
        </div>
      ) : (
        <RankSection items={sorted} showTier={showTier} deleteAction={deleteAction} />
      )}
    </div>
  )
}
