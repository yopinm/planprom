// AFFNET-10: Cross-Network Payout Optimizer
// Shows accumulated commission vs withdrawal threshold per affiliate network.
// Recommends pushing traffic to networks near withdrawal threshold.

import type { PayoutProgress } from '@/lib/revenue-data'

interface Props {
  data: PayoutProgress
}

export function PayoutOptimizerWidget({ data }: Props) {
  if (data.networks.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
        <h2 className="text-sm font-black text-neutral-800">Payout Optimizer</h2>
        <p className="mt-2 text-xs text-neutral-400">ยังไม่มีข้อมูล commission จาก Involve Asia หรือ AccessTrade</p>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-neutral-800">Payout Optimizer (AFFNET-10)</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            ยอดสะสมต่อ network เทียบกับเกณฑ์ถอนเงิน — ดัน traffic ให้ network ที่ใกล้ถอนได้ก่อน
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {data.networks.map(n => (
          <div key={n.platform_key} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-neutral-800">{n.network}</span>
                {n.can_withdraw && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">
                    ถอนได้แล้ว ✓
                  </span>
                )}
                {n.is_near_threshold && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700">
                    ใกล้ถอนได้แล้ว ↑
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-neutral-600">
                ฿{n.accumulated_thb.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                <span className="font-normal text-neutral-400"> / ฿{n.threshold_thb.toLocaleString('th-TH')}</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className={`h-full rounded-full transition-all ${
                  n.can_withdraw ? 'bg-green-500' : n.is_near_threshold ? 'bg-orange-400' : 'bg-neutral-400'
                }`}
                style={{ width: `${n.progress_pct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-neutral-400">
              {n.progress_pct.toFixed(1)}% · เหลืออีก ฿{Math.max(0, n.threshold_thb - n.accumulated_thb).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>

            {n.is_near_threshold && !n.can_withdraw && (
              <p className="mt-1.5 rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-700">
                แนะนำ: ดัน traffic ไปที่ {n.network} ก่อนเพื่อถอนเงินได้เร็วขึ้น
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">
        อัปเดต {new Date(data.generated_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
        {' · '}รวมทุก conversion ที่ไม่ถูก reversed
      </p>
    </section>
  )
}
