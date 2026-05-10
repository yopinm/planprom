import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { execSync } from 'child_process'
import { LogViewer } from '../LogViewer'

export const metadata: Metadata = {
  title: 'PM2 Log — Admin Report',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const PM2_OUT   = '/root/.pm2/logs/planprom-out.log'
const PM2_ERR   = '/root/.pm2/logs/planprom-error.log'

function tailLog(path: string, lines: number): string {
  try {
    return execSync(`tail -n ${lines} "${path}" 2>/dev/null || echo "(ไฟล์ log ไม่พบ: ${path})"`, { encoding: 'utf8', timeout: 5000 })
  } catch {
    return `(ไม่สามารถอ่าน log ได้: ${path})`
  }
}

const LINES_MAP: Record<string, number> = { '1h': 200, '6h': 500, '24h': 1000, all: 2000 }

export default async function Pm2LogPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; type?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const window = (['1h', '6h', '24h', 'all'].includes(sp.window ?? '') ? sp.window : '6h') as string
  const logType = sp.type === 'error' ? 'error' : 'out'

  const lines = LINES_MAP[window] ?? 500
  const logPath = logType === 'error' ? PM2_ERR : PM2_OUT
  const content = tailLog(logPath, lines)

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
            <h1 className="text-2xl font-black text-black">🖥 PM2 Log</h1>
            <p className="mt-0.5 font-mono text-xs text-neutral-400">{logPath}</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">← Admin</Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {/* Log type */}
          {[{ key: 'out', label: 'stdout' }, { key: 'error', label: 'stderr / error' }].map(t => (
            <Link key={t.key} href={`/admin/report/log/pm2?window=${window}&type=${t.key}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${logType === t.key ? (t.key === 'error' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white') : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'}`}>
              {t.label}
            </Link>
          ))}
          <span className="mx-1 text-neutral-300">|</span>
          {/* Window */}
          {WINDOWS.map(w => (
            <Link key={w.key} href={`/admin/report/log/pm2?window=${w.key}&type=${logType}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${window === w.key ? 'bg-neutral-800 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-800'}`}>
              {w.label}
            </Link>
          ))}
        </div>

        <LogViewer content={content} title={`PM2 ${logType} · ${LINES_MAP[window]} บรรทัดล่าสุด`} filename={`pm2-${logType}-${window}.log`} />

      </div>
    </main>
  )
}
