import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Predict Engine — Admin Report',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const SEED_KEYWORDS = [
  'checklist',
  'planner',
  'form',
  'report',
  'template',
  'แผน',
  'บัญชี',
  'งบประมาณ',
]

async function fetchSuggestions(keyword: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(keyword)}&hl=th&gl=th`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json() as [string, string[]]
    return (json[1] ?? []).slice(0, 8)
  } catch {
    return []
  }
}

export default async function PredictPage() {
  await requireAdminSession('/admin/login')

  // Fetch all suggestions in parallel
  const suggestionResults = await Promise.all(
    SEED_KEYWORDS.map(async kw => ({ keyword: kw, suggestions: await fetchSuggestions(kw) }))
  )

  // Template sales ranking (all time)
  const ranking = await db<{
    id: string
    title: string
    slug: string
    price_baht: number
    status: string
    orders: string
    revenue: string
    downloads: string
  }[]>`
    SELECT
      t.id,
      t.title,
      t.slug,
      t.price_baht,
      t.status,
      COUNT(o.id)               AS orders,
      COALESCE(SUM(o.amount_baht), 0) AS revenue,
      COALESCE(SUM(o.download_count), 0) AS downloads
    FROM templates t
    LEFT JOIN template_orders o ON o.template_id = t.id AND o.status = 'paid'
    GROUP BY t.id, t.title, t.slug, t.price_baht, t.status
    ORDER BY orders DESC, t.created_at DESC
  `

  const bestsellers = ranking.filter(r => Number(r.orders) > 0)
  const zeroSale    = ranking.filter(r => Number(r.orders) === 0)
  const maxOrders   = Math.max(...bestsellers.map(r => Number(r.orders)), 1)

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report · AI Predict</p>
            <h1 className="text-2xl font-black text-black">🔮 Predict Engine</h1>
            <p className="mt-0.5 text-sm text-neutral-500">Trend + Template Performance — ใช้วางแผนสร้าง template ใหม่</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">← Admin</Link>
        </div>

        {/* ── Section 1: Google Trends ── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-base font-black text-black">🔍 คนกำลังค้นหาอะไร</h2>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black text-indigo-700 uppercase">Google Suggest · TH</span>
          </div>
          <p className="mb-4 text-xs text-neutral-400">Autocomplete จาก Google Thailand แบบ real-time — คำที่ขึ้นคือสิ่งที่คนไทยกำลังค้นหาจริง</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestionResults.map(({ keyword, suggestions }) => (
              <div key={keyword} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="mb-3 font-mono text-xs font-black text-indigo-600 uppercase tracking-wider">
                  🔑 {keyword}
                </p>
                {suggestions.length === 0 ? (
                  <p className="text-xs text-neutral-300 italic">ไม่สามารถดึงข้อมูลได้</p>
                ) : (
                  <ul className="space-y-1.5">
                    {suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-[9px] font-black text-neutral-300">{i + 1}</span>
                        <span className="text-xs text-neutral-700 leading-snug">{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            💡 <strong>วิธีใช้:</strong> เลือก keyword ที่น่าสนใจ → สร้าง template ตอบโจทย์ → เพิ่มในหน้า catalog
            · Refresh หน้าเพื่อดู trend ล่าสุด (cache 1 ชม.)
          </div>
        </section>

        {/* ── Section 2: Bestseller Ranking ── */}
        <section>
          <h2 className="mb-4 text-base font-black text-black">🏆 Template ขายดี</h2>

          {bestsellers.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400 italic">ยังไม่มียอดขาย</p>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
              {bestsellers.map((t, i) => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                  {/* Rank */}
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-neutral-100 text-neutral-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-neutral-50 text-neutral-400'
                  }`}>
                    {i + 1}
                  </div>

                  {/* Bar + title */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-800 truncate">{t.title}</p>
                    <div className="mt-1.5 h-1 rounded-full bg-neutral-100">
                      <div
                        className="h-1 rounded-full bg-indigo-400"
                        style={{ width: `${Math.round((Number(t.orders) / maxOrders) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="shrink-0 text-right">
                    <p className="font-black text-sm text-indigo-600">{Number(t.orders)} orders</p>
                    <p className="text-[10px] text-neutral-400">฿{Number(t.revenue).toLocaleString()} · {Number(t.downloads)} DL</p>
                  </div>

                  {/* Edit link */}
                  <Link
                    href={`/admin/templates/${t.id}`}
                    className="shrink-0 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-black text-neutral-500 hover:border-indigo-400 hover:text-indigo-600 transition"
                  >
                    แก้ไข
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 3: Zero-sale (ควรปรับปรุง) ── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-base font-black text-black">⚠️ ยังไม่มียอดขาย</h2>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-black text-red-600 uppercase">{zeroSale.length} template</span>
          </div>

          {zeroSale.length === 0 ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center">
              <p className="font-black text-green-700">✅ ทุก template มียอดขายแล้ว</p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-neutral-400">ปรับปรุง: title, description, ราคา, thumbnail — แล้วลิงก์ไปสร้าง revision ใน Document Control</p>
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
                {zeroSale.map(t => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-700 truncate">{t.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                          t.status === 'published' ? 'bg-green-100 text-green-700' :
                          t.status === 'draft'     ? 'bg-neutral-100 text-neutral-500' :
                          'bg-amber-100 text-amber-700'
                        }`}>{t.status}</span>
                        <span className="text-[10px] text-neutral-400">฿{t.price_baht}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Link
                        href={`/admin/templates/${t.id}`}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-600 hover:bg-red-100 transition"
                      >
                        ปรับปรุง →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

      </div>
    </main>
  )
}
