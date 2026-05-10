import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { execSync } from 'child_process'
import { LogViewer } from '../LogViewer'

export const metadata: Metadata = {
  title: 'Error Digest — Admin Report',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function tailLog(path: string, lines: number): string[] {
  try {
    const out = execSync(`tail -n ${lines} "${path}" 2>/dev/null`, { encoding: 'utf8', timeout: 5000 })
    return out.split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function isError(line: string): boolean {
  return /error|Error|ERROR|warn|WARN|fail|Fail|FAIL|exception|Exception|crash|502|504|unhandled|uncaught/i.test(line)
}

export default async function ErrorDigestPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const window = (['1h', '6h', '24h', 'all'].includes(sp.window ?? '') ? sp.window : '6h') as string

  const linesMap: Record<string, number> = { '1h': 300, '6h': 800, '24h': 2000, all: 5000 }
  const n = linesMap[window] ?? 800

  const pm2Out   = tailLog('/root/.pm2/logs/planprom-out.log',   n)
  const pm2Err   = tailLog('/root/.pm2/logs/planprom-error.log', n)
  const nginxErr = tailLog('/var/log/nginx/error.log',           n)

  const pm2Errors    = pm2Out.filter(isError)
  const pm2ErrLines  = pm2Err.filter(isError)
  const nginxErrors  = nginxErr.filter(isError)

  const digest = [
    `# Error Digest — แพลนพร้อม`,
    `Generated: ${new Date().toLocaleString('th-TH')}`,
    `Window: ${window}`,
    '',
    `## PM2 stdout errors (${pm2Errors.length} lines)`,
    pm2Errors.length ? pm2Errors.join('\n') : '(ไม่พบ)',
    '',
    `## PM2 stderr (${pm2ErrLines.length} lines)`,
    pm2ErrLines.length ? pm2ErrLines.join('\n') : '(ไม่พบ)',
    '',
    `## Nginx error log (${nginxErrors.length} lines)`,
    nginxErrors.length ? nginxErrors.join('\n') : '(ไม่พบ)',
  ].join('\n')

  const totalErrors = pm2Errors.length + pm2ErrLines.length + nginxErrors.length

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
            <h1 className="text-2xl font-black text-black">📋 Error Digest</h1>
            <p className="mt-0.5 text-sm text-neutral-500">รวม errors ทุก source — copy-paste ให้ Claude วิเคราะห์ได้เลย</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">← Admin</Link>
        </div>

        {/* KPI */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            { label: 'Total Errors', value: totalErrors, color: totalErrors > 0 ? 'text-red-600' : 'text-neutral-300' },
            { label: 'PM2 stdout', value: pm2Errors.length, color: pm2Errors.length > 0 ? 'text-orange-600' : 'text-neutral-300' },
            { label: 'PM2 stderr', value: pm2ErrLines.length, color: pm2ErrLines.length > 0 ? 'text-red-600' : 'text-neutral-300' },
            { label: 'Nginx', value: nginxErrors.length, color: nginxErrors.length > 0 ? 'text-yellow-600' : 'text-neutral-300' },
          ].map(k => (
            <div key={k.label} className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${k.value > 0 ? 'border-red-100' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
            </div>
          ))}
        </div>

        {totalErrors === 0 && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center">
            <p className="font-black text-green-700">✅ ไม่พบ errors ในช่วงนี้</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {WINDOWS.map(w => (
            <Link key={w.key} href={`/admin/report/log/errors?window=${w.key}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${window === w.key ? 'bg-neutral-800 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-800'}`}>
              {w.label}
            </Link>
          ))}
        </div>

        <LogViewer
          content={digest}
          title={`Error Digest · ${totalErrors} errors พบ`}
          filename={`error-digest-${window}-${new Date().toISOString().slice(0, 10)}.md`}
        />

      </div>
    </main>
  )
}
