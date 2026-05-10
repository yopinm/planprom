import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Predict Engine — Admin Report',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// ── 4 core keywords เท่านั้น ──────────────────────────────────────────────────
const SEED_KEYWORDS: { key: string; label: string; color: string }[] = [
  { key: 'checklist', label: 'Checklist', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { key: 'planner',   label: 'Planner',   color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { key: 'ฟอร์ม',     label: 'ฟอร์ม',     color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'รายงาน',   label: 'รายงาน',   color: 'text-amber-600 bg-amber-50 border-amber-200' },
]

// ── Audience tags ──────────────────────────────────────────────────────────────
const AUDIENCE_RULES: { tag: string; color: string; pattern: RegExp }[] = [
  { tag: 'ส่วนตัว',    color: 'bg-sky-100 text-sky-700',      pattern: /เที่ยว|เดินทาง|งานแต่ง|ออกกำลัง|ชีวิต|สุขภาพ|ห้อง|บ้าน|เปิดเทอม|โรงเรียน|ไปเรียน/ },
  { tag: 'ธุรกิจ SME', color: 'bg-amber-100 text-amber-700',  pattern: /ร้าน|ธุรกิจ|ใบเสนอ|ราคา|ลูกค้า|invoice|สินค้า|ขาย|เปิดกิจการ|บริษัท|ใบส่ง/ },
  { tag: 'ราชการ/HR',  color: 'bg-red-100 text-red-700',      pattern: /ราชการ|หน่วยงาน|ประกัน|ว่างงาน|ปฏิบัติงาน|ลา|บันทึก|ประชุม|มอบอำนาจ|รายงานตัว/ },
  { tag: 'โครงการ',    color: 'bg-purple-100 text-purple-700', pattern: /โครงการ|ก่อสร้าง|timeline|แผนงาน|ประจำปี|งบ|ระยะเวลา|milestone/ },
  { tag: 'การศึกษา',   color: 'bg-green-100 text-green-700',  pattern: /นักเรียน|มหาวิทยาลัย|สอบ|เรียน|วิชา|semester|วิทยาลัย/ },
]

// ── Noise words ที่ไม่ใช่ template idea ──────────────────────────────────────
const NOISE = /^(แปลว่า|คือ|ภาษาอังกฤษ|pdf|ฟรี|goodnote|sut|a problem|speech|สรุป|one piece|marvel|resident evil|ฟอร์มาลิน|ฟอร์มาลดีไฮด์|ฟอร์มูลาวัน|formula 1|format factory|format$|formula$)$/i

async function fetchSuggestions(keyword: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(keyword)}&hl=th&gl=th`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json() as [string, string[]]
    return (json[1] ?? []).slice(0, 10)
  } catch {
    return []
  }
}

function analyzeKeyword(keyword: string, suggestions: string[]) {
  const joined = suggestions.join(' ')

  // Audience detection
  const audiences = AUDIENCE_RULES.filter(r => r.pattern.test(joined))

  // Template ideas: strip noise, strip seed prefix, keep what's meaningful
  const ideas: string[] = []
  for (const s of suggestions) {
    const stripped = s.replace(new RegExp(`^${keyword}\\s*`, 'i'), '').trim()
    if (!stripped || NOISE.test(stripped)) continue
    // Rebuild as "keyword + use-case"
    ideas.push(`${keyword} ${stripped}`)
    if (ideas.length >= 5) break
  }

  // Demand signal: ratio of actionable to total
  const actionable = suggestions.filter(s => {
    const stripped = s.replace(new RegExp(`^${keyword}\\s*`, 'i'), '').trim()
    return stripped && !NOISE.test(stripped)
  }).length
  const demand: 'สูง' | 'กลาง' | 'ต่ำ' =
    actionable >= 5 ? 'สูง' : actionable >= 3 ? 'กลาง' : 'ต่ำ'
  const demandColor =
    demand === 'สูง' ? 'bg-green-100 text-green-700' :
    demand === 'กลาง' ? 'bg-amber-100 text-amber-700' :
    'bg-neutral-100 text-neutral-500'

  return { audiences, ideas, demand, demandColor }
}

export default async function PredictPage() {
  await requireAdminSession('/admin/login')

  // Fetch all 4 keywords in parallel
  const keywordData = await Promise.all(
    SEED_KEYWORDS.map(async ({ key, label, color }) => {
      const suggestions = await fetchSuggestions(key)
      const analysis = analyzeKeyword(key, suggestions)
      return { key, label, color, suggestions, ...analysis }
    })
  )

  // Template sales ranking
  const ranking = await db<{
    id: string; title: string; slug: string
    price_baht: number; status: string
    orders: string; revenue: string; downloads: string
  }[]>`
    SELECT
      t.id, t.title, t.slug, t.price_baht, t.status,
      COUNT(o.id)                    AS orders,
      COALESCE(SUM(o.amount_baht),0) AS revenue,
      COALESCE(SUM(o.download_count),0) AS downloads
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
            <p className="mt-0.5 text-sm text-neutral-500">วิเคราะห์ trend → เลือก template ที่ควรสร้างต่อไป</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">← Admin</Link>
        </div>

        {/* ── Section 1: 4 Keyword Analysis ── */}
        <section>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-base font-black text-black">🔍 วิเคราะห์ Keyword</h2>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black text-indigo-700 uppercase">Google Suggest · TH · cache 1h</span>
          </div>
          <p className="mb-5 text-xs text-neutral-400">Suggestions = สิ่งที่คนไทยพิมพ์จริงบน Google · Template Ideas = โอกาสที่ควรสร้าง</p>

          <div className="space-y-4">
            {keywordData.map(kw => (
              <div key={kw.key} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${kw.color.split(' ').find(c => c.startsWith('border-')) ?? 'border-neutral-200'}`}>
                {/* Card header */}
                <div className={`px-5 py-3 flex items-center gap-3 border-b ${kw.color}`}>
                  <span className="font-mono font-black text-sm uppercase tracking-wider">{kw.label}</span>
                  <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-black ${kw.demandColor}`}>
                    demand {kw.demand}
                  </span>
                  {kw.audiences.map(a => (
                    <span key={a.tag} className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${a.color}`}>
                      {a.tag}
                    </span>
                  ))}
                </div>

                {/* Card body: 2 columns */}
                <div className="grid grid-cols-2 divide-x divide-neutral-100">

                  {/* Left: raw suggestions */}
                  <div className="p-4">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">Google Suggest</p>
                    <ol className="space-y-1.5">
                      {kw.suggestions.map((s, i) => {
                        const stripped = s.replace(new RegExp(`^${kw.key}\\s*`, 'i'), '').trim()
                        const isNoise = !stripped || NOISE.test(stripped)
                        return (
                          <li key={i} className={`flex items-start gap-2 text-xs ${isNoise ? 'opacity-30' : ''}`}>
                            <span className="shrink-0 w-4 text-right text-neutral-300 font-bold">{i + 1}</span>
                            <span className="text-neutral-700 leading-snug">{s}</span>
                          </li>
                        )
                      })}
                    </ol>
                  </div>

                  {/* Right: analysis */}
                  <div className="p-4 space-y-4">
                    {/* Template ideas */}
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

                    {/* Audience */}
                    {kw.audiences.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">🎯 กลุ่มเป้าหมาย</p>
                        <div className="flex flex-wrap gap-1.5">
                          {kw.audiences.map(a => (
                            <span key={a.tag} className={`rounded-full px-2.5 py-1 text-[10px] font-black ${a.color}`}>
                              {a.tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    <div className="pt-1">
                      <Link
                        href="/admin/templates/new"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-black text-neutral-500 hover:border-amber-400 hover:text-amber-600 transition"
                      >
                        + สร้าง template →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 2: Bestseller ── */}
        <section>
          <h2 className="mb-4 text-base font-black text-black">🏆 Template ขายดี</h2>
          {bestsellers.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400 italic">ยังไม่มียอดขาย</p>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
              {bestsellers.map((t, i) => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-neutral-100 text-neutral-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-neutral-50 text-neutral-400'
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-800 truncate">{t.title}</p>
                    <div className="mt-1.5 h-1 rounded-full bg-neutral-100">
                      <div className="h-1 rounded-full bg-indigo-400" style={{ width: `${Math.round((Number(t.orders) / maxOrders) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-black text-sm text-indigo-600">{Number(t.orders)} orders</p>
                    <p className="text-[10px] text-neutral-400">฿{Number(t.revenue).toLocaleString()} · {Number(t.downloads)} DL</p>
                  </div>
                  <Link href={`/admin/templates/${t.id}`} className="shrink-0 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-black text-neutral-500 hover:border-indigo-400 hover:text-indigo-600 transition">แก้ไข</Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 3: Zero-sale ── */}
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
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
              {zeroSale.map(t => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-700 truncate">{t.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        t.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                      }`}>{t.status}</span>
                      <span className="text-[10px] text-neutral-400">฿{t.price_baht}</span>
                    </div>
                  </div>
                  <Link href={`/admin/templates/${t.id}`} className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-600 hover:bg-red-100 transition">ปรับปรุง →</Link>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
