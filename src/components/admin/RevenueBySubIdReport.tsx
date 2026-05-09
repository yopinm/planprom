'use client'

// POSTLIVE-03: Revenue by Sub-ID Report — time-to-conversion per platform
// Shows Shopee vs Lazada avg latency so AI Revenue Weighting does not
// over-penalise platforms whose postbacks arrive late during campaigns.

import { useEffect, useState } from 'react'
import type { RevenueBySubIdReport as ReportData } from '@/lib/revenue-data'

function fmtLatency(seconds: number | null): string {
  if (seconds === null) return '—'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('th-TH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function RevenueBySubIdReport() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/revenue/by-subid')
      .then(r => r.ok ? r.json() : r.json().then((b: { error?: string }) => Promise.reject(b.error ?? `HTTP ${r.status}`)))
      .then((d: ReportData) => setData(d))
      .catch((e: unknown) => setError(typeof e === 'string' ? e : 'Load error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <section className="mt-8 rounded-2xl border border-neutral-100 bg-white p-5 animate-pulse">
      <div className="h-4 w-48 rounded bg-neutral-100" />
    </section>
  )

  if (error) return (
    <section className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4">
      <p className="text-xs font-bold text-red-600">{error}</p>
    </section>
  )

  if (!data || data.rows.length === 0) return (
    <section className="mt-8 rounded-2xl border border-neutral-100 bg-white p-5">
      <h2 className="text-sm font-black text-neutral-800">Revenue by Sub-ID (POSTLIVE-03)</h2>
      <p className="mt-2 text-xs text-neutral-400">ยังไม่มีข้อมูล conversion — รอหลัง Go-Live</p>
    </section>
  )

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-neutral-800">Revenue by Sub-ID (POSTLIVE-03)</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Time-to-conversion แยก Shopee / Lazada — ใช้ calibrate AI Revenue Weighting
          </p>
        </div>
        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-600">
          {data.rows.length} conversions
        </span>
      </div>

      {/* Per-platform latency summary */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.platform_latency.map(p => (
          <div key={p.platform} className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{p.platform}</p>
            <p className="mt-0.5 text-lg font-black text-neutral-800">
              {fmtLatency(p.avg_latency_seconds)}
            </p>
            <p className="text-[10px] text-neutral-400">avg · {p.sample_count} rows</p>
          </div>
        ))}
      </div>

      {/* Conversion rows table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="pb-1.5 pr-3 font-black text-neutral-500">Sub-ID</th>
              <th className="pb-1.5 pr-3 font-black text-neutral-500">Platform</th>
              <th className="pb-1.5 pr-3 text-right font-black text-neutral-500">Commission</th>
              <th className="pb-1.5 pr-3 text-right font-black text-neutral-500">Latency</th>
              <th className="pb-1.5 pr-3 font-black text-neutral-500">Converted</th>
              <th className="pb-1.5 font-black text-neutral-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-neutral-50 last:border-0">
                <td className="py-1.5 pr-3 font-mono text-[10px] text-neutral-600 max-w-[120px] truncate">
                  {row.sub_id ?? '—'}
                </td>
                <td className="py-1.5 pr-3 capitalize text-neutral-700">{row.platform}</td>
                <td className="py-1.5 pr-3 text-right font-black text-green-700">
                  ฿{row.commission.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 pr-3 text-right text-neutral-600">
                  {fmtLatency(row.latency_seconds)}
                </td>
                <td className="py-1.5 pr-3 text-neutral-500">
                  {fmtTime(row.converted_at ?? row.received_at)}
                </td>
                <td className="py-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                    row.payout_status === 'settled'
                      ? 'bg-green-100 text-green-700'
                      : row.payout_status === 'reversed'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {row.payout_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
