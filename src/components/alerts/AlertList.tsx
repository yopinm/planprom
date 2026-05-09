'use client'

// src/components/alerts/AlertList.tsx
// TASK 2.8 — Alert list with toggle enable/disable + delete

import { useState } from 'react'
import type { Alert } from '@/types'

const ALERT_TYPE_LABEL: Record<string, string> = {
  target_deal:    'แจ้งเมื่อราคาถึงเป้า',
  price_drop:     'แจ้งเมื่อราคาลดลง',
  coupon_expiry:  'แจ้งก่อนคูปองหมดอายุ',
  rare_item:      'Rare item alert',
}

const CHANNEL_LABEL: Record<string, string> = {
  email: 'Email',
  line:  'LINE',
  line_notify: 'LINE Notify',
  push:  'Push',
}

interface Props {
  initialAlerts: Alert[]
}

export function AlertList({ initialAlerts }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleToggle(alert: Alert) {
    setLoadingId(alert.id)
    try {
      const res = await fetch(`/api/alerts/${alert.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_active: !alert.is_active }),
      })
      if (!res.ok) throw new Error('Toggle failed')
      const { alert: updated } = await res.json() as { alert: Alert }
      setAlerts(prev => prev.map(a => a.id === updated.id ? updated : a))
    } catch {
      window.alert('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('ลบการแจ้งเตือนนี้?')) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setAlerts(prev => prev.filter(a => a.id !== id))
    } catch {
      window.alert('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
    } finally {
      setLoadingId(null)
    }
  }

  if (alerts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400">
        ยังไม่มีการแจ้งเตือน — สร้างแจ้งเตือนราคาสินค้าที่คุณต้องการด้านบน
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {alerts.map(alert => (
        <li
          key={alert.id}
          className={`rounded-2xl border px-4 py-3 transition-opacity ${
            alert.is_active
              ? 'border-neutral-200 bg-white'
              : 'border-neutral-100 bg-neutral-50 opacity-60'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left — info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-black">
                {ALERT_TYPE_LABEL[alert.alert_type] ?? alert.alert_type}
              </p>

              {alert.target_price !== null && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  ราคาเป้าหมาย:{' '}
                  <span className="font-bold text-black">
                    ฿{alert.target_price.toLocaleString()}
                  </span>
                </p>
              )}

              {alert.alert_type === 'rare_item' && alert.rare_score_threshold !== null && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  Rare score threshold:{' '}
                  <span className="font-bold text-black">
                    {alert.rare_score_threshold}/100
                  </span>
                </p>
              )}

              <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-400">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                  {CHANNEL_LABEL[alert.channel] ?? alert.channel}
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                  cooldown {alert.cooldown_minutes} นาที
                </span>
                {alert.last_triggered_at && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
                    แจ้งล่าสุด:{' '}
                    {new Date(alert.last_triggered_at).toLocaleDateString('th-TH')}
                  </span>
                )}
              </div>
            </div>

            {/* Right — actions */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Toggle */}
              <button
                onClick={() => handleToggle(alert)}
                disabled={loadingId === alert.id}
                title={alert.is_active ? 'ปิดการแจ้งเตือน' : 'เปิดการแจ้งเตือน'}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                  alert.is_active ? 'bg-black' : 'bg-neutral-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    alert.is_active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(alert.id)}
                disabled={loadingId === alert.id}
                title="ลบการแจ้งเตือน"
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
