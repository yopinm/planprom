'use client'

import { useState } from 'react'

interface Props {
  configured: boolean
  status: 'active' | 'expired' | 'error' | null
  error: string | null
  checkedAt: string | null
}

function statusLabel(status: Props['status'], configured: boolean): string {
  if (!configured) return 'ยังไม่ได้ตั้งค่า'
  if (status === 'expired') return 'Token หมดอายุ'
  if (status === 'error') return 'ส่งไม่สำเร็จ'
  return 'พร้อมใช้งาน'
}

export function LineNotifyTokenForm(props: Props) {
  const [token, setToken] = useState('')
  const [configured, setConfigured] = useState(props.configured)
  const [status, setStatus] = useState<Props['status']>(props.status)
  const [error, setError] = useState<string | null>(props.error)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveToken(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    setError(null)

    try {
      const res = await fetch('/api/user/line-notify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() || null }),
      })

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Save failed')
      }

      setConfigured(Boolean(token.trim()))
      setStatus(token.trim() ? 'active' : null)
      setSaved(true)
      setToken('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-black">LINE Notify</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {statusLabel(status, configured)}
            {props.checkedAt && ` · checked ${new Date(props.checkedAt).toLocaleDateString('th-TH')}`}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
          configured && status !== 'expired' && status !== 'error'
            ? 'bg-green-50 text-green-700'
            : 'bg-orange-50 text-orange-700'
        }`}>
          {configured ? 'Configured' : 'Required'}
        </span>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {saved && (
        <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
          บันทึก LINE Notify token แล้ว
        </p>
      )}

      <form onSubmit={saveToken} className="mt-3 flex gap-2">
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="LINE Notify token"
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-black focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </section>
  )
}
