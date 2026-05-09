'use client'

import { useEffect, useState } from 'react'

function useNextHourCountdown() {
  const [label, setLabel] = useState('')

  useEffect(() => {
    function tick() {
      const now     = new Date()
      const elapsed = now.getMinutes() * 60 + now.getSeconds()
      const total   = (3600 - elapsed) % 3600 || 3599
      const mins    = Math.floor(total / 60)
      const secs    = total % 60
      setLabel(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return label
}

export function StatsBar() {
  const countdown = useNextHourCountdown()

  return (
    <div className="bg-orange-600 py-1.5">
      {/* Mobile: single compact line */}
      <p className="text-center text-[11px] font-bold text-white sm:hidden">
        ✓ ดีลสด AI คัดแล้ว · ใช้ฟรี 100%
      </p>
      {/* Desktop: full 3-item bar */}
      <div className="mx-auto hidden max-w-6xl items-center justify-center gap-5 px-6 text-[11px] font-bold text-white sm:flex">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          {countdown
            ? <>อัปเดตใหม่ใน <span className="font-mono tabular-nums">{countdown}</span></>
            : 'อัปเดตดีลทุก 1 ชั่วโมง'
          }
        </span>
        <span className="h-3 w-px bg-orange-400" aria-hidden="true" />
        <span>✓ คัดเฉพาะดีลที่ใช้ได้จริง</span>
        <span className="h-3 w-px bg-orange-400" aria-hidden="true" />
        <span>✓ ใช้ฟรี ไม่มีค่าสมัคร</span>
      </div>
    </div>
  )
}
