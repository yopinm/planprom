'use client'

// POSTLIVE-00.2: End-to-End Revenue Tracer panel
// AFFNET-7: extended with network label + outgoing param per click/conversion
// Auto-hides when all tested platforms show SUCCESS_LOOP.

import { useState } from 'react'

interface TraceClick {
  clicked_at: string
  platform: string
  network: string
  outgoing_param: string
}

interface TraceConversion {
  received_at: string
  event_type: string
  commission: number
  payout_status: string
  order_id: string | null
  platform: string
  network: string
  outgoing_param: string
}

interface NetworkSummary {
  network: string
  outgoing_param: string
  click_count: number
  conversion_count: number
}

interface TraceResult {
  sub_id: string
  click_found: boolean
  clicks: TraceClick[]
  postback_found: boolean
  conversions: TraceConversion[]
  network_summary: NetworkSummary[]
  status: 'SUCCESS_LOOP' | 'WAITING_POSTBACK'
}

export function RevenueTracerPanel() {
  const [subId, setSubId] = useState('')
  const [result, setResult] = useState<TraceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrace = async () => {
    if (!subId.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/revenue/trace?sub_id=${encodeURIComponent(subId.trim())}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Record<string, unknown>
        throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${res.status}`)
      }
      setResult(await res.json() as TraceResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = result?.status === 'SUCCESS_LOOP'

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-neutral-800">Revenue Tracer (AFFNET-7)</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            ตรวจสอบ sub_id — click บันทึกแล้ว, postback กลับมาครบ, และ network + param ที่ใช้
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-600">
          Go-Live Validator
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={subId}
          onChange={e => setSubId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleTrace()}
          placeholder="เช่น live_test_shopee_001"
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={handleTrace}
          disabled={loading || !subId.trim()}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-700 disabled:opacity-40"
        >
          {loading ? 'กำลังตรวจ…' : 'Trace'}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</p>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          {/* Status banner */}
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${isSuccess ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <span className={`text-lg ${isSuccess ? 'text-green-600' : 'text-yellow-500'}`}>
              {isSuccess ? '✓' : '⏳'}
            </span>
            <div>
              <p className={`text-xs font-black ${isSuccess ? 'text-green-700' : 'text-yellow-700'}`}>
                {result.status}
              </p>
              <p className="text-[11px] text-neutral-500">
                {isSuccess
                  ? 'ลูปสมบูรณ์ — Click บันทึกแล้ว + Postback กลับมาแล้ว'
                  : 'บันทึก Click สำเร็จ — รอ Postback จาก Platform'}
              </p>
            </div>
          </div>

          {/* Click + Postback summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-xl border px-3 py-2.5 ${result.click_found ? 'border-green-200 bg-green-50' : 'border-neutral-100 bg-neutral-50'}`}>
              <p className="text-[10px] font-black text-neutral-500">CLICK FOUND</p>
              <p className={`mt-0.5 text-sm font-black ${result.click_found ? 'text-green-700' : 'text-neutral-400'}`}>
                {result.click_found ? `✓ ${result.clicks.length} click` : '— ไม่พบ'}
              </p>
              {result.clicks[0] && (
                <p className="mt-0.5 text-[10px] text-neutral-400">
                  {result.clicks[0].network} · param: <span className="font-mono">{result.clicks[0].outgoing_param}</span>
                </p>
              )}
            </div>
            <div className={`rounded-xl border px-3 py-2.5 ${result.postback_found ? 'border-green-200 bg-green-50' : 'border-neutral-100 bg-neutral-50'}`}>
              <p className="text-[10px] font-black text-neutral-500">POSTBACK</p>
              <p className={`mt-0.5 text-sm font-black ${result.postback_found ? 'text-green-700' : 'text-neutral-400'}`}>
                {result.postback_found ? `✓ ${result.conversions.length} conversion` : '— รอ postback'}
              </p>
              {result.conversions[0] && (
                <p className="mt-0.5 text-[10px] text-neutral-400">
                  ฿{Number(result.conversions[0].commission).toLocaleString('th-TH')} · {result.conversions[0].network}
                </p>
              )}
            </div>
          </div>

          {/* Network summary table */}
          {result.network_summary.length > 0 && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3">
              <p className="mb-2 text-[10px] font-black text-neutral-500">NETWORK BREAKDOWN</p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-neutral-400">
                    <th className="pb-1 font-bold">Network</th>
                    <th className="pb-1 font-bold">Param</th>
                    <th className="pb-1 text-right font-bold">Clicks</th>
                    <th className="pb-1 text-right font-bold">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {result.network_summary.map(n => (
                    <tr key={n.network} className="border-t border-neutral-100">
                      <td className="py-1 font-bold text-neutral-700">{n.network}</td>
                      <td className="py-1 font-mono text-neutral-500">{n.outgoing_param}=</td>
                      <td className="py-1 text-right text-neutral-700">{n.click_count}</td>
                      <td className={`py-1 text-right font-bold ${n.conversion_count > 0 ? 'text-green-700' : 'text-neutral-400'}`}>
                        {n.conversion_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
