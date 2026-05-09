// BuyOrWaitBadge — Traffic Light badge for Buy-or-Wait signal (TASK 2.6)
// Server component — no 'use client'
// Used by: ProductCard

import type { BuyOrWaitSignal } from '@/features/engine/buy-or-wait'

interface BuyOrWaitBadgeProps {
  signal: BuyOrWaitSignal
  label: string
  reason: string
  priceDrop: number
}

const SIGNAL_CONFIG: Record<
  BuyOrWaitSignal,
  { dot: string; badge: string; border: string; icon: string; prominent: boolean }
> = {
  STRONG_BUY:    { dot: 'bg-green-500',   badge: 'bg-green-50 text-green-800',   border: 'border-2 border-green-400', icon: '🟢', prominent: true },
  BUY_NOW:       { dot: 'bg-green-400',   badge: 'bg-green-50 text-green-700',   border: 'border border-green-200',   icon: '✅', prominent: false },
  WAIT:          { dot: 'bg-yellow-400',  badge: 'bg-yellow-50 text-yellow-700', border: 'border border-yellow-200',  icon: '⏳', prominent: false },
  LOW_CONFIDENCE:{ dot: 'bg-neutral-300', badge: 'bg-neutral-50 text-neutral-500', border: 'border border-neutral-200', icon: '—', prominent: false },
}

export function BuyOrWaitBadge({ signal, label, reason, priceDrop }: BuyOrWaitBadgeProps) {
  const cfg = SIGNAL_CONFIG[signal]

  return (
    <div className={`mt-3 flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${cfg.badge} ${cfg.border}`}>
      <span className="mt-px text-base leading-none" aria-hidden="true">{cfg.icon}</span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-extrabold ${cfg.prominent ? 'text-sm' : 'text-xs'}`}>{label}</span>
          {priceDrop !== 0 && signal !== 'LOW_CONFIDENCE' && (
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold">
              {priceDrop > 0
                ? `ถูกกว่าเฉลี่ย ${priceDrop.toFixed(1)}%`
                : `แพงกว่าเฉลี่ย ${Math.abs(priceDrop).toFixed(1)}%`}
            </span>
          )}
        </div>
        <p className={`mt-0.5 leading-snug opacity-80 ${cfg.prominent ? 'text-xs' : 'text-[11px]'}`}>{reason}</p>
      </div>
    </div>
  )
}
