import type { ReactElement } from 'react'
import {
  buildSparklinePoints,
  type PriceTrendSummary,
} from '@/lib/price-trend'

const DIRECTION_LABEL: Record<PriceTrendSummary['direction'], string> = {
  down:    'ราคาลดลง',
  up:      'ราคาสูงขึ้น',
  flat:    'ราคาใกล้เคียงเดิม',
  unknown: 'ข้อมูลยังไม่พอ',
}

const DIRECTION_CLASS: Record<PriceTrendSummary['direction'], string> = {
  down:    'bg-green-100 text-green-700',
  up:      'bg-red-100 text-red-700',
  flat:    'bg-neutral-100 text-neutral-700',
  unknown: 'bg-neutral-100 text-neutral-500',
}

function fmtPrice(value: number): string {
  return value.toLocaleString('th-TH', { maximumFractionDigits: 0 })
}

function fmtPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%`
}

function buildPath(points: { x: number; y: number }[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}

export function PriceTrendPanel({ summary }: { summary: PriceTrendSummary | null }): ReactElement {
  if (!summary) {
    return (
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-black">แนวโน้มราคา</h2>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-500">
            ข้อมูลยังไม่พอ
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          ต้องมีประวัติราคาอย่างน้อย 2 จุดก่อนแสดงกราฟย้อนหลัง
        </p>
      </section>
    )
  }

  const prices = [...summary.points.map(point => point.price), summary.currentPrice]
  const chartPoints = buildSparklinePoints(prices)
  const path = buildPath(chartPoints)

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-black">แนวโน้มราคา</h2>
          <p className="mt-1 text-sm text-neutral-500">
            จากประวัติราคา {summary.count} จุดล่าสุด
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${DIRECTION_CLASS[summary.direction]}`}>
          {DIRECTION_LABEL[summary.direction]} {fmtPercent(summary.changePercent)}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl bg-neutral-50 px-3 py-4">
        <svg
          viewBox="0 0 280 72"
          role="img"
          aria-label={`Price trend ${DIRECTION_LABEL[summary.direction]}`}
          className="h-20 w-full"
        >
          <line x1="6" y1="66" x2="274" y2="66" stroke="#e5e5e5" strokeWidth="1" />
          <path d={path} fill="none" stroke="#16a34a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          {chartPoints.map((point, index) => (
            <circle
              key={`${point.x}-${point.y}-${index}`}
              cx={point.x}
              cy={point.y}
              r={index === chartPoints.length - 1 ? 4 : 3}
              fill={index === chartPoints.length - 1 ? '#111827' : '#16a34a'}
            />
          ))}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs font-bold uppercase text-neutral-400">ต่ำสุด</p>
          <p className="mt-1 font-black text-black">฿{fmtPrice(summary.minPrice)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-neutral-400">เฉลี่ย</p>
          <p className="mt-1 font-black text-black">฿{fmtPrice(summary.averagePrice)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-neutral-400">สูงสุด</p>
          <p className="mt-1 font-black text-black">฿{fmtPrice(summary.maxPrice)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-neutral-400">ตอนนี้</p>
          <p className="mt-1 font-black text-black">฿{fmtPrice(summary.currentPrice)}</p>
        </div>
      </div>

      {summary.isCurrentLow && (
        <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
          ราคาปัจจุบันอยู่ใกล้จุดต่ำสุดของช่วงที่เก็บข้อมูล
        </p>
      )}
    </section>
  )
}
