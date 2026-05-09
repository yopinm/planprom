'use client'

import { useCallback, useEffect, useState } from 'react'

interface DbPreflightTable {
  name: string
  rows: number
}

export interface DbPreflightResult {
  ok: boolean
  tables: DbPreflightTable[]
  missing: string[]
  checked_at: string
  error?: string
}

interface PreflightBadge {
  label: string
  className: string
}

interface PreflightStatusViewProps {
  result: DbPreflightResult | null
  status: 'idle' | 'loading' | 'done' | 'error'
  onRecheck: () => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPreflightTable(value: unknown): value is DbPreflightTable {
  if (!isRecord(value)) return false

  return typeof value.name === 'string' && typeof value.rows === 'number'
}

function isDbPreflightResult(value: unknown): value is DbPreflightResult {
  if (!isRecord(value)) return false

  const hasError = value.error === undefined || typeof value.error === 'string'

  return (
    typeof value.ok === 'boolean' &&
    Array.isArray(value.tables) &&
    value.tables.every(isPreflightTable) &&
    Array.isArray(value.missing) &&
    value.missing.every(item => typeof item === 'string') &&
    typeof value.checked_at === 'string' &&
    hasError
  )
}

export function getPreflightBadge(result: DbPreflightResult | null): PreflightBadge {
  if (result?.ok === true) {
    return {
      label: '✅ พร้อม migrate',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }

  return {
    label: '🚨 พบปัญหา',
    className: 'border-red-200 bg-red-50 text-red-700',
  }
}

export function formatCheckedAt(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
}

function getTableStatus(tableName: string, result: DbPreflightResult): string {
  return result.missing.includes(tableName) ? '🔴 Missing' : '🟢 Found'
}

export function PreflightStatusView({
  result,
  status,
  onRecheck,
}: PreflightStatusViewProps): React.JSX.Element {
  const badge = getPreflightBadge(result)
  const isLoading = status === 'loading'

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
                Admin Ops
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-black">
                DB Preflight
              </h1>
              <p className="mt-2 text-sm font-semibold text-neutral-500">
                ตรวจสอบ schema ก่อนย้าย business database ไป VPS PostgreSQL
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className={`rounded-full border px-4 py-2 text-sm font-black ${badge.className}`}>
                {badge.label}
              </span>
              <button
                type="button"
                onClick={onRecheck}
                disabled={isLoading}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-black text-black transition hover:border-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                ตรวจสอบอีกครั้ง
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            {isLoading ? (
              <p className="text-sm font-bold text-neutral-500">กำลังตรวจสอบ...</p>
            ) : result ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs font-black uppercase tracking-widest text-neutral-400">
                      <th className="px-3 py-3">Table</th>
                      <th className="px-3 py-3 text-right">Rows</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {result.tables.map(table => (
                      <tr key={table.name}>
                        <td className="px-3 py-3 font-black text-black">{table.name}</td>
                        <td className="px-3 py-3 text-right font-semibold text-neutral-600">
                          {table.rows.toLocaleString('th-TH')}
                        </td>
                        <td className="px-3 py-3 font-bold text-neutral-600">
                          {getTableStatus(table.name, result)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm font-bold text-neutral-500">รอเริ่มตรวจสอบ...</p>
            )}
          </div>

          {result ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-bold text-neutral-400">
                Checked at: {formatCheckedAt(result.checked_at)}
              </p>

              {result.missing.length > 0 ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-black text-red-700">Missing tables</p>
                  <p className="mt-1 text-sm font-semibold text-red-700">
                    {result.missing.join(', ')}
                  </p>
                </div>
              ) : null}

              {result.error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-black text-red-700">Preflight error</p>
                  <p className="mt-1 text-sm font-semibold text-red-700">{result.error}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

export function PreflightClient(): React.JSX.Element {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<DbPreflightResult | null>(null)

  const loadPreflight = useCallback(async (): Promise<void> => {
    setStatus('loading')

    try {
      const response = await fetch('/api/admin/db-preflight', { cache: 'no-store' })
      const payload: unknown = await response.json()

      if (!isDbPreflightResult(payload)) {
        throw new Error('Invalid preflight response')
      }

      setResult(payload)
      setStatus(response.ok ? 'done' : 'error')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown preflight error'

      setResult({
        ok: false,
        tables: [],
        missing: [],
        checked_at: new Date().toISOString(),
        error: message,
      })
      setStatus('error')
    }
  }, [])

  useEffect((): void => {
    void loadPreflight()
  }, [loadPreflight])

  return <PreflightStatusView result={result} status={status} onRecheck={loadPreflight} />
}
