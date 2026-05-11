'use client'

import { useEffect, useState } from 'react'

export type PrefillData = {
  code: string; label: string
  discount_type: string; discount_value: number
  min_cart_value: number; starts_at: string; expires_at: string
}

type Signal = {
  engine: string; signal: boolean
  metric: string; reason: string
  suggested: PrefillData | null
}

const META: Record<string, { icon: string; name: string; desc: string }> = {
  slow_week:     { icon: '📉', name: 'Slow Week',      desc: 'ยอดต่ำกว่า avg 4 สัปดาห์ — flash sale กระตุ้น' },
  tier_uplift:   { icon: '⬆️', name: 'Tier Uplift',    desc: 'คนซื้อ 1 ชิ้นเยอะ — ดัน AOV ด้วยโค้ดซื้อ 2' },
  cart_recovery: { icon: '🛒', name: 'Cart Recovery',  desc: 'ตะกร้าค้าง — โค้ดดึงลูกค้ากลับมาจ่าย' },
  vps_breakeven: { icon: '🖥️', name: 'VPS Break-Even', desc: 'ต้นทุน ฿900/เดือน — ยอดถึงเป้า/สัปดาห์ไหม' },
}

export function PromoEngineCards({ onGenerate }: { onGenerate: (p: PrefillData) => void }) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/promo-suggest')
      .then(r => r.json() as Promise<Signal[]>)
      .then(data => { setSignals(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-44 animate-pulse rounded-2xl border border-neutral-200 bg-white" />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-6">
      <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-neutral-400">Revenue Engine · Auto Suggest</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {signals.map(s => {
          const m = META[s.engine]
          return (
            <div
              key={s.engine}
              className={`flex flex-col gap-2 rounded-2xl border bg-white p-4 shadow-sm transition ${
                s.signal ? 'border-amber-300 ring-1 ring-amber-200' : 'border-neutral-200 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-lg leading-none">{m.icon}</span>
                {s.signal && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700">
                    แนะนำสัปดาห์นี้
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-black text-neutral-900">{m.name}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-neutral-400">{m.desc}</p>
              </div>

              <p className={`text-[10px] font-semibold leading-snug ${s.signal ? 'text-amber-700' : 'text-neutral-500'}`}>
                {s.reason}
              </p>

              <p className="font-mono text-[10px] text-neutral-400">{s.metric}</p>

              <button
                onClick={() => s.suggested && onGenerate(s.suggested)}
                disabled={!s.signal || !s.suggested}
                className={`mt-auto rounded-lg py-1.5 text-[11px] font-black transition ${
                  s.signal
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                }`}
              >
                Generate โค้ด
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
