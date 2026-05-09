'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'

import { parseRecoveryHash, validateNewPassword } from '@/lib/auth-recovery'
import { createClient } from '@/lib/supabase/client'

type RecoveryStatus = 'checking' | 'ready' | 'invalid' | 'done'

export function ResetPasswordForm(): React.JSX.Element {
  const supabase = useMemo(() => createClient(), [])
  const [status, setStatus] = useState<RecoveryStatus>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function prepareRecoverySession(): Promise<void> {
      const recovery = parseRecoveryHash(window.location.hash)
      if (!recovery || recovery.type !== 'recovery') {
        if (mounted) setStatus('invalid')
        return
      }

      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      )

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: recovery.accessToken,
        refresh_token: recovery.refreshToken,
      })

      if (!mounted) return

      if (sessionError) {
        setError('This reset link is expired or invalid. Please send a new reset email.')
        setStatus('invalid')
        return
      }

      setStatus('ready')
    }

    void prepareRecoverySession()

    return () => {
      mounted = false
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)

    const validation = validateNewPassword(password, confirmPassword)
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Could not update password. Please send a new reset email and try again.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    setStatus('done')
    window.location.href = '/admin/login?reset=success'
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8">
        <h1 className="text-xl font-black text-black">Set New Password</h1>
        <p className="mt-1 text-xs text-neutral-500">Couponkum Admin Recovery</p>

        {status === 'checking' && (
          <p className="mt-6 rounded-lg bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-600">
            Checking reset link...
          </p>
        )}

        {status === 'invalid' && (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {error ?? 'This reset link is invalid or already used.'}
            </p>
            <Link
              href="/admin/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-black py-2.5 text-sm font-bold text-white"
            >
              Back to Admin Login
            </Link>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-700">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-black"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-700">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-black"
                autoComplete="new-password"
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
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        )}

        {status === 'done' && (
          <p className="mt-6 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
            Password updated. Redirecting to admin login...
          </p>
        )}
      </div>
    </main>
  )
}
