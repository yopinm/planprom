'use client'

// src/components/alerts/AddAlertForm.tsx
// TASK 2.8 — Add alert form (client component)

import { useEffect, useState } from 'react'
import type { AlertType, AlertChannel } from '@/types'

const ALERT_TYPE_OPTIONS: { value: AlertType; label: string }[] = [
  { value: 'target_deal',   label: 'แจ้งเมื่อราคาถึงเป้า' },
  { value: 'price_drop',    label: 'แจ้งเมื่อราคาลดลง' },
  { value: 'coupon_expiry', label: 'แจ้งก่อนคูปองหมดอายุ' },
  { value: 'rare_item',     label: 'Rare item ผ่าน LINE Notify' },
]

const CHANNEL_OPTIONS: { value: AlertChannel; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'line',  label: 'LINE' },
  { value: 'line_notify', label: 'LINE Notify' },
  { value: 'push',  label: 'Push Notification' },
]

export function AddAlertForm() {
  const [open, setOpen] = useState(false)
  const [alertType, setAlertType] = useState<AlertType>('target_deal')
  const [targetPrice, setTargetPrice] = useState('')
  const [rareScoreThreshold, setRareScoreThreshold] = useState('70')
  const [productId, setProductId] = useState('')
  const [channel, setChannel] = useState<AlertChannel>('email')
  const [cooldown, setCooldown] = useState('60')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (alertType === 'rare_item') setChannel('line_notify')
  }, [alertType])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const price = parseFloat(targetPrice)
    if (alertType === 'target_deal') {
      if (!productId.trim()) {
        setError('กรุณาระบุ Product ID')
        return
      }
      if (isNaN(price) || price <= 0) {
        setError('กรุณาระบุราคาเป้าหมายที่ถูกต้อง')
        return
      }
    }
    const threshold = parseFloat(rareScoreThreshold)
    if (alertType === 'rare_item' && (isNaN(threshold) || threshold <= 0 || threshold > 100)) {
      setError('Rare item threshold ต้องอยู่ระหว่าง 1-100')
      return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        alert_type:       alertType,
        channel,
        cooldown_minutes: parseInt(cooldown) || 60,
      }
      if (productId.trim()) body.product_id   = productId.trim()
      if (!isNaN(price) && price > 0) body.target_price = price
      if (alertType === 'rare_item') body.rare_score_threshold = threshold

      const res = await fetch('/api/alerts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const { error: msg } = await res.json() as { error: string }
        throw new Error(msg ?? 'เกิดข้อผิดพลาด')
      }

      setSuccess(true)
      setTargetPrice('')
      setRareScoreThreshold('70')
      setProductId('')
      setTimeout(() => {
        setSuccess(false)
        setOpen(false)
        window.location.reload()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-3 text-sm font-semibold text-neutral-600 transition-colors hover:border-black hover:text-black"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        สร้างการแจ้งเตือนใหม่
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 text-base font-bold text-black">สร้างการแจ้งเตือน</h2>

      {/* Alert type */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold text-neutral-600">
          ประเภทการแจ้งเตือน
        </label>
        <select
          value={alertType}
          onChange={e => setAlertType(e.target.value as AlertType)}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-black focus:outline-none"
        >
          {ALERT_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Product ID (for target_deal / optional rare item) */}
      {alertType !== 'coupon_expiry' && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">
            Product ID{alertType === 'target_deal' ? ' *' : ' (optional)'}
          </label>
          <input
            type="text"
            value={productId}
            onChange={e => setProductId(e.target.value)}
            placeholder="e.g. abc123"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>
      )}

      {alertType === 'rare_item' && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">
            Rare score threshold *
          </label>
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={rareScoreThreshold}
            onChange={e => setRareScoreThreshold(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>
      )}

      {/* Target price (for target_deal) */}
      {alertType === 'target_deal' && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">
            ราคาเป้าหมาย (บาท) *
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={targetPrice}
            onChange={e => setTargetPrice(e.target.value)}
            placeholder="e.g. 299"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>
      )}

      {/* Channel */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold text-neutral-600">
          ช่องทางการแจ้งเตือน
        </label>
        <div className="flex gap-2">
          {CHANNEL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setChannel(opt.value)}
              className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                channel === opt.value
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cooldown */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-neutral-600">
          Cooldown (นาที) — ไม่แจ้งซ้ำภายใน
        </label>
        <select
          value={cooldown}
          onChange={e => setCooldown(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-black focus:outline-none"
        >
          <option value="30">30 นาที</option>
          <option value="60">1 ชั่วโมง</option>
          <option value="180">3 ชั่วโมง</option>
          <option value="360">6 ชั่วโมง</option>
          <option value="720">12 ชั่วโมง</option>
          <option value="1440">24 ชั่วโมง</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Success */}
      {success && (
        <p className="mb-3 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700 font-semibold">
          สร้างการแจ้งเตือนสำเร็จ
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-xl border border-neutral-200 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-black py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-neutral-800"
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </form>
  )
}
