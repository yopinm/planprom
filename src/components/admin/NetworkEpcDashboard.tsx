// AFFNET-8: Network-Aware EPC Dashboard
// Compares EPC, CVR, commission across affiliate networks.
// EPC for Involve Asia / AccessTrade is estimated (clicks log as destination platform).

import type { NetworkEpcReport } from '@/lib/epc'

interface Props {
  data: NetworkEpcReport
}

function thb(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function NetworkEpcDashboard({ data }: Props) {
  if (data.rows.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
        <h2 className="text-sm font-black text-neutral-800">Network EPC Dashboard (AFFNET-8)</h2>
        <p className="mt-2 text-xs text-neutral-400">ยังไม่มีข้อมูล conversion — รอ postback จาก network ก่อน</p>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-neutral-800">Network EPC Dashboard (AFFNET-8)</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            เปรียบ EPC / CVR / Commission ระหว่าง affiliate networks
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.best_by_epc && (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black text-green-700">
              Best EPC: {data.best_by_epc}
            </span>
          )}
          {data.best_by_commission && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-600">
              Best Revenue: {data.best_by_commission}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-[10px] font-black text-neutral-400">
              <th className="pb-2 pr-3">Network</th>
              <th className="pb-2 pr-3 text-right">Clicks</th>
              <th className="pb-2 pr-3 text-right">Conv.</th>
              <th className="pb-2 pr-3 text-right">CVR%</th>
              <th className="pb-2 pr-3 text-right">EPC (฿)</th>
              <th className="pb-2 pr-3 text-right">Avg Conv. (฿)</th>
              <th className="pb-2 text-right">Total (฿)</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map(r => (
              <tr key={r.platform_key} className="border-b border-neutral-50 hover:bg-neutral-50">
                <td className="py-2 pr-3 font-bold text-neutral-800">
                  {r.network}
                  {r.platform_key === 'involve_asia' || r.platform_key === 'accesstrade' ? (
                    <span className="ml-1 text-[9px] font-normal text-neutral-400">~EPC</span>
                  ) : null}
                </td>
                <td className="py-2 pr-3 text-right text-neutral-600">{r.click_count.toLocaleString('th-TH')}</td>
                <td className="py-2 pr-3 text-right text-neutral-600">{r.conversion_count}</td>
                <td className={`py-2 pr-3 text-right font-bold ${r.cvr >= 1 ? 'text-green-700' : r.cvr > 0 ? 'text-yellow-600' : 'text-neutral-400'}`}>
                  {r.click_count > 0 ? `${r.cvr.toFixed(2)}%` : '—'}
                </td>
                <td className={`py-2 pr-3 text-right font-bold ${r.epc > 0 ? 'text-neutral-800' : 'text-neutral-400'}`}>
                  {r.click_count > 0 ? thb(r.epc) : '—'}
                </td>
                <td className="py-2 pr-3 text-right text-neutral-600">
                  {r.conversion_count > 0 ? thb(r.avg_commission) : '—'}
                </td>
                <td className="py-2 text-right font-black text-neutral-800">
                  {thb(r.total_commission)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-neutral-400">
        ~EPC = EPC ประมาณการ (Involve Asia / AccessTrade บันทึก click เป็น destination platform)
        · อัปเดต {new Date(data.generated_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
      </p>
    </section>
  )
}
