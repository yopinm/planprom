import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { execSync } from 'child_process'
import { LogViewer } from '../LogViewer'

export const metadata: Metadata = {
  title: 'Nginx Error — Admin Report',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const ERROR_LOG = '/var/log/nginx/error.log'

function tailLog(path: string, lines: number): string {
  try {
    return execSync(`tail -n ${lines} "${path}" 2>/dev/null || echo "(ไฟล์ log ไม่พบ: ${path})"`, { encoding: 'utf8', timeout: 5000 })
  } catch {
    return `(ไม่สามารถอ่าน log ได้: ${path})`
  }
}

function parseSummary(raw: string) {
  const lines = raw.split('\n').filter(Boolean)
  const errors502 = lines.filter(l => /502/.test(l)).length
  const errors504 = lines.filter(l => /504/.test(l)).length
  const upstream  = lines.filter(l => /upstream/.test(l)).length
  return { total: lines.length, errors502, errors504, upstream }
}

const LINES_MAP: Record<string, number> = { '1h': 200, '6h': 500, '24h': 1000, all: 3000 }

export default async function NginxErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const window = (['1h', '6h', '24h', 'all'].includes(sp.window ?? '') ? sp.window : '6h') as string

  const lines = LINES_MAP[window] ?? 500
  const content = tailLog(ERROR_LOG, lines)
  const summary = parseSummary(content)

  const WINDOWS = [
    { key: '1h', label: '~1 ชม.' },
    { key: '6h', label: '~6 ชม.' },
    { key: '24h', label: '~24 ชม.' },
    { key: 'all', label: 'ทั้งหมด' },
  ]

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report · VPS Log</p>
            <h1 className="text-2xl font-black text-black">⚠️ Nginx Error Log</h1>
            <p className="mt-0.5 font-mono text-xs text-neutral-400">{ERROR_LOG}</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">← Admin</Link>
        </div>

        {/* KPI */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            { label: 'Lines', value: summary.total, color: 'text-neutral-600', alert: false },
            { label: '502', value: summary.errors502, color: 'text-red-600', alert: summary.errors502 > 0 },
            { label: '504', value: summary.errors504, color: 'text-orange-600', alert: summary.errors504 > 0 },
            { label: 'Upstream', value: summary.upstream, color: 'text-yellow-600', alert: summary.upstream > 0 },
          ].map(k => (
            <div key={k.label} className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${k.alert ? 'border-red-200' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${k.value === 0 ? 'text-neutral-300' : k.color}`}>{k.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {WINDOWS.map(w => (
            <Link key={w.key} href={`/admin/report/log/nginx-error?window=${w.key}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${window === w.key ? 'bg-red-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-red-400'}`}>
              {w.label}
            </Link>
          ))}
        </div>

        <LogViewer content={content} title={`Nginx Error · ${lines} บรรทัดล่าสุด`} filename={`nginx-error-${window}.log`} />

      </div>
    </main>
  )
}
