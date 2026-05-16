'use server'
import { db } from '@/lib/db'
import { PRESETS, CAT_SLUG_TO_PRESETS } from '@/lib/pipeline-presets'

// ── Types ──────────────────────────────────────────────────────────────────

export type SmartSource = 'A' | 'AB' | 'ABC' | 'C' | 'static'

export type SmartSignals = {
  templateCount: number       // จำนวน pipeline templates ใน catalog นี้
  dominantHorizon: string | null  // horizon ที่ใช้บ่อยสุด (A)
  hasSalesData: boolean       // มียอดขายจริงไหม (B)
  gapHorizons: string[]       // horizon ที่ยังไม่มีใน catalog นี้ (C)
}

export type SmartSuggestionResult = {
  presetIds: string[]
  source: SmartSource
  signals: SmartSignals
}

// ── Horizon → preset IDs ────────────────────────────────────────────────────
// ใช้ defaults.horizon ของแต่ละ preset เพื่อ match กับสัญญาณ

function presetsForHorizon(horizon: string): string[] {
  return PRESETS.filter(p => p.defaults.horizon === horizon).map(p => p.id)
}

// ── Main engine ────────────────────────────────────────────────────────────

export async function getSmartPresetSuggestions(
  catSlug: string,
): Promise<SmartSuggestionResult> {

  const staticIds = CAT_SLUG_TO_PRESETS[catSlug] ?? []
  const staticFallback: SmartSuggestionResult = {
    presetIds: staticIds,
    source: 'static',
    signals: { templateCount: 0, dominantHorizon: null, hasSalesData: false, gapHorizons: [] },
  }

  try {
    // ── Option A + B: horizon distribution + sales per pipeline template ──
    type HRow = { horizon: string | null; cnt: string; sales: string; views: string }
    const horizonRows = await db<HRow[]>`
      SELECT
        (t.engine_data -> 's1_goal' ->> 'horizon') AS horizon,
        COUNT(*)::text                              AS cnt,
        COALESCE(SUM(t.sale_count),  0)::text      AS sales,
        COALESCE(SUM(t.view_count),  0)::text      AS views
      FROM templates t
      JOIN template_category_links  l ON l.template_id = t.id
      JOIN template_categories      c ON c.id = l.category_id
      WHERE c.slug = ${catSlug}
        AND t.engine_type IN ('pipeline', 'preset')
        AND t.engine_data IS NOT NULL
      GROUP BY 1
    `.catch(() => [] as HRow[])

    const templateCount = horizonRows.reduce((s, r) => s + Number(r.cnt), 0)
    const hasSalesData  = horizonRows.some(r => Number(r.sales) > 0)

    // ── Option A: dominant horizon by count ──────────────────────────────
    const byCount  = [...horizonRows].sort((a, b) => Number(b.cnt)   - Number(a.cnt))
    const bySales  = [...horizonRows].sort((a, b) => Number(b.sales) - Number(a.sales))
    const dominantHorizon = byCount[0]?.horizon ?? null
    // B takes over A when sales data exists
    const effectiveHorizon = hasSalesData ? (bySales[0]?.horizon ?? dominantHorizon) : dominantHorizon

    // ── Option C: gap — horizons NOT yet published in this catalog ───────
    type GRow = { horizon: string | null }
    const publishedRows = await db<GRow[]>`
      SELECT DISTINCT (t.engine_data -> 's1_goal' ->> 'horizon') AS horizon
      FROM templates t
      JOIN template_category_links  l ON l.template_id = t.id
      JOIN template_categories      c ON c.id = l.category_id
      WHERE c.slug = ${catSlug}
        AND t.status  = 'published'
        AND t.engine_data IS NOT NULL
    `.catch(() => [] as GRow[])

    const publishedHorizons = new Set(publishedRows.map(r => r.horizon).filter(Boolean) as string[])
    const allHorizons = ['monthly', 'yearly', 'project'] as const
    const gapHorizons = allHorizons.filter(h => !publishedHorizons.has(h))

    // ── Score every preset ────────────────────────────────────────────────
    const scores: Record<string, number> = {}
    for (const preset of PRESETS) {
      let s = 0
      const ph = preset.defaults.horizon

      // A: horizon clustering
      if (effectiveHorizon && ph === effectiveHorizon) s += 40
      // B: amplify when backed by real sales
      if (hasSalesData && ph === effectiveHorizon)     s += 30
      // C: gap fill — preset fills an under-represented horizon
      if (gapHorizons.includes(ph))                    s += 20
      // domain baseline — static mapping still counts
      if (staticIds.includes(preset.id))               s += 10

      scores[preset.id] = s
    }

    // ── Determine source label ────────────────────────────────────────────
    let source: SmartSource = 'static'
    if (templateCount > 0 && hasSalesData && gapHorizons.length > 0)  source = 'ABC'
    else if (templateCount > 0 && hasSalesData)                        source = 'AB'
    else if (templateCount > 0)                                        source = 'A'
    else if (gapHorizons.length > 0)                                   source = 'C'

    // ── Pick top 3 with positive score ───────────────────────────────────
    const ranked = PRESETS
      .filter(p => scores[p.id] > 0)
      .sort((a, b) => scores[b.id] - scores[a.id])
      .slice(0, 3)
      .map(p => p.id)

    // nothing useful → static
    if (ranked.length === 0) return staticFallback

    return {
      presetIds: ranked,
      source,
      signals: { templateCount, dominantHorizon, hasSalesData, gapHorizons },
    }
  } catch {
    return staticFallback
  }
}
