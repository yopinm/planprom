'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tab = 'pm2' | 'nginx-access' | 'nginx-error' | 'error-digest'

interface AccessSummary {
  total_lines: number
  status_4xx: number
  status_5xx: number
  top_paths: { path: string; count: number }[]
}

export interface SystemLogData {
  exportedAt:  string
  window:      string
  summary:     { total_templates: number; published: number; draft: number; categories: number }
  orders30d:   { paid_orders: number; pending_orders: number; total_revenue_baht: number; unique_buyers: number }
  cartStats:   { active_carts: number; total_cart_items: number }
  pm2Out:      string[]
  pm2Err:      string[]
  ngxAcc:      string[]
  ngxAccSummary: AccessSummary
  ngxErr:      string[]
  pm2OutPath:  string
  pm2ErrPath:  string
  json:        string
}

function isError(line: string) {
  return /error|Error|ERROR|warn|WARN|fail|Fail|FAIL|exception|Exception|crash|502|504|unhandled|uncaught/i.test(line)
}

const WINDOWS = [
  { key: '1h',  label: '~1 ชม.' },
  { key: '6h',  label: '~6 ชม.' },
  { key: '24h', label: '~24 ชม.' },
  { key: 'all', label: 'ทั้งหมด' },
]

const TABS: { key: Tab; label: string }[] = [
  { key: 'pm2',          label: '🖥 PM2 Log' },
  { key: 'nginx-access', label: '🌐 Nginx Access' },
  { key: 'nginx-error',  label: '⚠️ Nginx Error' },
  { key: 'error-digest', label: '📋 Error Digest' },
]

function LogBlock({ lines, empty = '(ว่างเปล่า)' }: { lines: string[]; empty?: string }) {
  const [copied, setCopied] = useState(false)
  const content = lines.join('\n')

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  function handleDownload() {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'log.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
          {lines.length} บรรทัด
        </p>
        <div className="flex gap-2">
          <button onClick={handleCopy}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-black text-neutral-600 hover:border-indigo-400 hover:text-indigo-600 transition">
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button onClick={handleDownload}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-black text-neutral-600 hover:border-indigo-400 hover:text-indigo-600 transition">
            ⬇ Download
          </button>
        </div>
      </div>
      <pre className="overflow-auto rounded-2xl border border-neutral-200 bg-neutral-950 p-5 text-[11px] leading-relaxed text-green-400 max-h-[60vh] whitespace-pre-wrap break-all font-mono">
        {lines.length ? lines.join('\n') : empty}
      </pre>
    </div>
  )
}

export function SystemLogClient({ data }: { data: SystemLogData }) {
  const [tab, setTab]         = useState<Tab>('pm2')
  const [pm2Type, setPm2Type] = useState<'stdout' | 'stderr'>('stdout')
  const [jsonCopied, setJsonCopied] = useState(false)

  const sizeKb = Math.round(data.json.length / 1024 * 10) / 10

  function handleJsonCopy() {
    navigator.clipboard.writeText(data.json)
    setJsonCopied(true)
    setTimeout(() => setJsonCopied(false), 2000)
  }
  function handleJsonDownload() {
    const blob = new Blob([data.json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planprom-log-${data.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const errorDigest = [
    ...data.pm2Out.filter(isError),
    ...data.pm2Err.filter(isError),
    ...data.ngxErr.filter(isError),
  ]

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report · VPS Log</p>
            <h1 className="text-2xl font-black text-black">📋 System Log</h1>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
              {data.exportedAt.replace('T', ' ').slice(0, 19)} UTC · {sizeKb} KB
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={handleJsonCopy}
              className={`rounded-2xl px-4 py-2 text-xs font-black transition ${jsonCopied ? 'bg-emerald-600 text-white' : 'bg-black text-white hover:bg-neutral-800'}`}>
              {jsonCopied ? '✅ Copied!' : '📋 Export JSON'}
            </button>
            <button onClick={handleJsonDownload}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black transition">
              ⬇ Download
            </button>
            <Link href="/admin"
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">
              ← Admin
            </Link>
          </div>
        </div>

        {/* DB snapshot summary */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Templates', value: `${data.summary.total_templates} (${data.summary.published} live)` },
            { label: 'Categories', value: data.summary.categories },
            { label: 'Orders 30d (paid)', value: data.orders30d.paid_orders },
            { label: 'Revenue 30d', value: `฿${data.orders30d.total_revenue_baht.toLocaleString()}` },
          ].map(c => (
            <div key={c.label} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">{c.label}</p>
              <p className="text-lg font-black text-neutral-900">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Window filter */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mr-1">ช่วงเวลา</span>
          {WINDOWS.map(w => (
            <Link key={w.key} href={`/admin/report/log?window=${w.key}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
                data.window === w.key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-800'
              }`}>
              {w.label}
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-neutral-200 mb-5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs font-black transition border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* PM2 Tab */}
        {tab === 'pm2' && (
          <div>
            <div className="flex gap-2 mb-4">
              {([['stdout', data.pm2OutPath], ['stderr', data.pm2ErrPath]] as const).map(([type, path]) => (
                <button key={type} onClick={() => setPm2Type(type as 'stdout' | 'stderr')}
                  className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
                    pm2Type === type
                      ? (type === 'stderr' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white')
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'
                  }`}>
                  {type}
                </button>
              ))}
              <span className="ml-2 font-mono text-[10px] text-neutral-400 self-center">
                {pm2Type === 'stdout' ? data.pm2OutPath : data.pm2ErrPath}
              </span>
            </div>
            <LogBlock lines={pm2Type === 'stdout' ? data.pm2Out : data.pm2Err} />
          </div>
        )}

        {/* Nginx Access Tab */}
        {tab === 'nginx-access' && (
          <div>
            {/* Summary cards */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Total Lines</p>
                <p className="text-2xl font-black">{data.ngxAccSummary.total_lines}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">4xx Errors</p>
                <p className="text-2xl font-black text-amber-700">{data.ngxAccSummary.status_4xx}</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-500">5xx Errors</p>
                <p className="text-2xl font-black text-red-700">{data.ngxAccSummary.status_5xx}</p>
              </div>
            </div>
            {/* Top paths */}
            {data.ngxAccSummary.top_paths.length > 0 && (
              <div className="mb-4 rounded-xl border border-neutral-200 bg-white overflow-hidden">
                <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Top 10 Paths</p>
                </div>
                <div className="divide-y divide-neutral-100">
                  {data.ngxAccSummary.top_paths.map(({ path, count }) => (
                    <div key={path} className="flex items-center justify-between px-4 py-2">
                      <span className="font-mono text-xs text-neutral-700 truncate max-w-[80%]">{path}</span>
                      <span className="text-xs font-black text-neutral-900 ml-2">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <LogBlock lines={data.ngxAcc} />
          </div>
        )}

        {/* Nginx Error Tab */}
        {tab === 'nginx-error' && (
          <div>
            <div className="mb-3 flex gap-3">
              {[
                { label: '502', count: data.ngxErr.filter(l => /502/.test(l)).length, color: 'text-red-700 bg-red-50 border-red-200' },
                { label: '504', count: data.ngxErr.filter(l => /504/.test(l)).length, color: 'text-orange-700 bg-orange-50 border-orange-200' },
                { label: 'upstream', count: data.ngxErr.filter(l => /upstream/.test(l)).length, color: 'text-amber-700 bg-amber-50 border-amber-200' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border px-4 py-2 ${s.color}`}>
                  <p className="text-[10px] font-black uppercase">{s.label}</p>
                  <p className="text-xl font-black">{s.count}</p>
                </div>
              ))}
            </div>
            <LogBlock lines={data.ngxErr} empty="(ไม่พบ error)" />
          </div>
        )}

        {/* Error Digest Tab */}
        {tab === 'error-digest' && (
          <div>
            <p className="mb-3 text-xs text-neutral-500">
              รวม error lines จาก PM2 stdout + PM2 stderr + Nginx error — {errorDigest.length} บรรทัด
            </p>
            <LogBlock lines={errorDigest} empty="(ไม่พบ error — ระบบทำงานปกติ)" />
          </div>
        )}

      </div>
    </main>
  )
}
