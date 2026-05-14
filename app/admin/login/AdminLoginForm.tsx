'use client'

import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { resolveSafeNextPath } from '@/lib/auth-redirect'
import { createClient } from '@/lib/supabase/client'

export function AdminLoginForm() {
  const searchParams = useSearchParams()
  const next         = resolveSafeNextPath(searchParams.get('next') ?? '/admin')
  const resetSuccess = searchParams.get('reset') === 'success'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Tier 1 — try Supabase (owner account)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (!signInError) {
      window.location.href = next
      return
    }

    // Tier 2 — try RBAC custom auth (admin / clerk accounts)
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      window.location.href = next
      return
    }

    setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8">
        <h1 className="text-xl font-black text-black">Admin Login</h1>
        <p className="mt-1 text-xs text-neutral-500">แพลนพร้อม Admin Area</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {resetSuccess && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
              Password updated. Please sign in again.
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </main>
  )
}
