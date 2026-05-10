import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { execSync } from 'child_process'
import { LogViewer } from '../LogViewer'

export const metadata: Metadata = {
  title: 'Nginx Access — Admin Report',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const ACCESS_LOG = '/var/log/nginx/access.log'

function tailLog(path: string, lines: number): string {
  try {
    return execSync(`tail -n ${lines} "${path}" 2>/dev/null || echo "(ไฟล์ log ไม่พบ: ${path})"`, { encoding: 'utf8', timeout: 5000 })
  } catch {
    return `(ไม่สามารถอ่าน log ได้: ${path})`
  }
}

function parseSummary(raw: string) {
  const lines = raw.split('\n').filter(Boolean)
  const status4xx = lines.filter(l => / 4\d\d /.test(l)).length
  const status5xx = lines.filter(l => / 5\d\d /.test(l)).length
  const paths: Record<string, number> = {}
  for (const line of lines) {
    const m = line.match(/"(?:GET|POST|PUT|DELETE|PATCH) ([^\s"]+)/)
    if (m) paths[m[1]] = (paths[m[1]] ?? 0) + 1
  }
  const topPaths = Object.entries(paths).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return { total: lines.length, status4xx, status5xx, topPaths }
}

const LINES_MAP: Record<string, number> = { '1h': 500, '6h': 2000, '24h': 5000, all: 10000 }

export default async function NginxAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const window = (['1h', '6h', '24h', 'all'].includes(sp.window ?? '') ? sp.window : '6h') as string

  const lines = LINES_MAP[window] ?? 2000
  const content = tailLog(ACCESS_LOG, lines)
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
            <h1 className="text-2xl font-black text-black">🌐 Nginx Access Log</h1>
            <p className="mt-0.5 font-mono text-xs text-neutral-400">{ACCESS_LOG}</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">← Admin</Link>
        </div>

        {/* KPI */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-center shadow-sm">
            <p className="text-2xl font-black text-neutral-700">{summary.total.toLocaleString()}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Requests</p>
          </div>
          <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${summary.status4xx > 0 ? 'border-yellow-200' : 'border-neutral-200'}`}>
            <p className={`text-2xl font-black ${summary.status4xx > 0 ? 'text-yellow-600' : 'text-neutral-300'}`}>{summary.status4xx}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">4xx Errors</p>
          </div>
          <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${summary.status5xx > 0 ? 'border-red-200' : 'border-neutral-200'}`}>
            <p className={`text-2xl font-black ${summary.status5xx > 0 ? 'text-red-600' : 'text-neutral-300'}`}>{summary.status5xx}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">5xx Errors</p>
          </div>
        </div>

        {/* Top paths */}
        {summary.topPaths.length > 0 && (
          <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">Top Paths</p>
            <div className="space-y-2">
              {summary.topPaths.map(([path, count]) => (
                <div key={path} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="h-1.5 rounded-full bg-indigo-100">
                      <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (count / (summary.topPaths[0]?.[1] ?? 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-600 w-8 text-right shrink-0">{count}</span>
                  <span className="font-mono text-[10px] text-neutral-500 max-w-[280px] truncate">{path}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Window filter */}
        <div className="mt-5 flex flex-wrap gap-2">
          {WINDOWS.map(w => (
            <Link key={w.key} href={`/admin/report/log/nginx-access?window=${w.key}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${window === w.key ? 'bg-neutral-800 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-800'}`}>
              {w.label}
            </Link>
          ))}
        </div>

        <LogViewer content={content} title={`Nginx Access · ${lines} บรรทัดล่าสุด`} filename={`nginx-access-${window}.log`} />

      </div>
    </main>
  )
}
