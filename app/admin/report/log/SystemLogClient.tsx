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

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  function toggleCard(title: string) {
    setExpandedCards(prev => {
      const next = new Set(prev)
      next.has(title) ? next.delete(title) : next.add(title)
      return next
    })
  }

  // Build alert cards
  type AlertLevel = 'error' | 'warning' | 'info' | 'ok'
  interface Alert {
    level: AlertLevel
    icon: string
    title: string
    desc: string
    detail?: { trigger: string; meaning: string; fix: string }
    action?: { label: string; onClick?: () => void; href?: string }
  }
  const alerts: Alert[] = []

  if (data.ngxAccSummary.status_5xx > 0) {
    alerts.push({
      level: 'error',
      icon: '🔴',
      title: 'พบ 5xx Error',
      desc: `Nginx มี ${data.ngxAccSummary.status_5xx} รายการ — อาจมีปัญหา upstream`,
      detail: {
        trigger: `Nginx Access log มี HTTP 5xx ≥ 1 รายการในช่วงเวลาที่เลือก (ตอนนี้: ${data.ngxAccSummary.status_5xx})`,
        meaning: 'Server ตอบ error ให้ผู้เข้าชม — อาจเกิดจาก PM2 crash, DB หลุด, หรือ memory ล้น',
        fix: 'ดู tab "Nginx Error" → หา upstream fail → ถ้า PM2 crash ให้ restart · ถ้า DB หลุดให้ check connection string',
      },
      action: { label: 'ดู Nginx Error', onClick: () => setTab('nginx-error') },
    })
  }
  if (errorDigest.length > 0) {
    alerts.push({
      level: 'warning',
      icon: '⚠️',
      title: 'พบ Error ใน Log',
      desc: `Error Digest มี ${errorDigest.length} บรรทัด จาก PM2 + Nginx`,
      detail: {
        trigger: `พบคำว่า error / warn / fail / crash / unhandled ใน PM2 stdout, PM2 stderr, หรือ Nginx error (ตอนนี้: ${errorDigest.length} บรรทัด)`,
        meaning: 'อาจมี exception ที่ไม่ถูก handle, API ล้มเหลว, หรือ dependency ผิดพลาด',
        fix: 'ดู tab "Error Digest" → ระบุ error ที่ซ้ำมากที่สุด → แก้ต้นเหตุ → restart PM2 แล้ว refresh',
      },
      action: { label: 'ดู Error Digest', onClick: () => setTab('error-digest') },
    })
  }
  if (data.ngxAccSummary.status_4xx > 10) {
    alerts.push({
      level: 'warning',
      icon: '🟠',
      title: '4xx สูงผิดปกติ',
      desc: `Nginx มี ${data.ngxAccSummary.status_4xx} รายการ — มี broken link หรือ path ผิด`,
      detail: {
        trigger: `Nginx Access log มี HTTP 4xx > 10 รายการ (ตอนนี้: ${data.ngxAccSummary.status_4xx})`,
        meaning: 'มี path ที่ถูกเรียกแต่ไม่มีอยู่ — อาจเป็น broken link, bot scan, หรือ path เปลี่ยนหลัง deploy',
        fix: 'ดู tab "Nginx Access" → Top 10 Paths → หา path ที่ 404 มากที่สุด → เพิ่ม redirect หรือแก้ลิงก์',
      },
      action: { label: 'ดู Nginx Access', onClick: () => setTab('nginx-access') },
    })
  }
  if (data.summary.published === 0) {
    alerts.push({
      level: 'info',
      icon: '📋',
      title: 'ยังไม่มีเทมเพลต',
      desc: 'ยังไม่มี template ที่ publish — ลูกค้ายังซื้อไม่ได้',
      detail: {
        trigger: 'จำนวน template ที่มี status = "published" เป็น 0',
        meaning: 'หน้า catalog และ store จะว่างเปล่า ลูกค้าไม่สามารถซื้อได้',
        fix: 'ไปที่ Admin → Templates → เพิ่มเทมเพลตใหม่ หรือ publish template ที่อยู่ใน draft',
      },
      action: { label: '+ เพิ่มเทมเพลต', href: '/admin/templates/new' },
    })
  }
  if (data.cartStats.active_carts > 0) {
    alerts.push({
      level: 'info',
      icon: '🛒',
      title: 'มีตะกร้าค้างอยู่',
      desc: `${data.cartStats.active_carts} ตะกร้า · ${data.cartStats.total_cart_items} รายการ — ลูกค้ากำลังเรียกดู`,
      detail: {
        trigger: `มี cart ที่ expires_at > NOW() และมี cart_items อย่างน้อย 1 รายการ (ตอนนี้: ${data.cartStats.active_carts} ตะกร้า)`,
        meaning: 'ลูกค้ากำลังอยู่ในขั้นตอนซื้อ ตะกร้าจะหมดอายุเองตาม TTL ที่ตั้งไว้',
        fix: 'ปกติไม่ต้องทำอะไร — ถ้า cart ค้างนานผิดปกติ ตรวจสอบ TTL ใน DB หรือ payment flow',
      },
    })
  }
  if (alerts.length === 0) {
    alerts.push({
      level: 'ok',
      icon: '✅',
      title: 'ระบบทำงานปกติ',
      desc: 'ไม่พบ 5xx · ไม่มี error ใน log · มี template live แล้ว',
      detail: {
        trigger: 'ไม่มีเงื่อนไขใดใน 4 การ์ดด้านบนที่เป็นจริง',
        meaning: 'Nginx ไม่มี 5xx, log ไม่มี error keyword, มี template published, ไม่มีตะกร้าค้าง',
        fix: 'ไม่ต้องดำเนินการใดๆ — ตรวจสอบ analytics เพื่อติดตาม conversion',
      },
    })
  }

  const alertStyle: Record<AlertLevel, string> = {
    error:   'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info:    'border-blue-200 bg-blue-50',
    ok:      'border-emerald-200 bg-emerald-50',
  }
  const alertBtn: Record<AlertLevel, string> = {
    error:   'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-amber-600 text-white hover:bg-amber-700',
    info:    'bg-blue-600 text-white hover:bg-blue-700',
    ok:      'bg-emerald-600 text-white hover:bg-emerald-700',
  }

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

        {/* Alert cards */}
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">สถานะระบบ</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map(a => {
              const isExpanded = expandedCards.has(a.title)
              return (
                <div key={a.title} className={`rounded-2xl border ${alertStyle[a.level]}`}>
                  {/* Card header — clickable */}
                  <button
                    onClick={() => toggleCard(a.title)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-base leading-none mt-0.5">{a.icon}</span>
                      <p className="flex-1 text-sm font-black text-neutral-900 leading-snug">{a.title}</p>
                      {a.detail && (
                        <span className="text-[10px] text-neutral-400 mt-0.5 shrink-0">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{a.desc}</p>
                  </button>

                  {/* Expandable detail */}
                  {a.detail && isExpanded && (
                    <div className="mx-4 mb-4 rounded-xl bg-white/60 border border-white/80 px-3 py-3 space-y-2">
                      {[
                        { label: 'เงื่อนไข', value: a.detail.trigger },
                        { label: 'ความหมาย', value: a.detail.meaning },
                        { label: 'วิธีแก้', value: a.detail.fix },
                      ].map(row => (
                        <div key={row.label}>
                          <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-0.5">{row.label}</p>
                          <p className="text-[11px] text-neutral-700 leading-relaxed">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action button */}
                  {a.action && (
                    <div className="px-4 pb-4">
                      {a.action.href
                        ? <Link href={a.action.href}
                            className={`inline-block rounded-xl px-3 py-1.5 text-[11px] font-black transition ${alertBtn[a.level]}`}>
                            {a.action.label}
                          </Link>
                        : <button onClick={a.action.onClick}
                            className={`rounded-xl px-3 py-1.5 text-[11px] font-black transition ${alertBtn[a.level]}`}>
                            {a.action.label}
                          </button>
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Usage hint */}
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-xs font-black text-amber-800 mb-2">วิธีส่ง log ให้ Claude Code วิเคราะห์</p>
          <ol className="text-xs text-amber-700 space-y-1 list-none">
            <li><span className="font-black">1.</span> กด <span className="font-black">"📋 Export JSON"</span> ด้านบนขวา → ข้อมูลทั้งหมดถูก copy แล้ว</li>
            <li><span className="font-black">2.</span> เปิด Claude Code session ใหม่ → พิมพ์อธิบายปัญหา เช่น <span className="italic">"ระบบมีปัญหา X"</span></li>
            <li><span className="font-black">3.</span> Paste JSON ต่อท้ายข้อความ → Claude จะวิเคราะห์ DB + logs ได้ทันที</li>
          </ol>
          <div className="mt-3 flex items-start gap-1.5 rounded-xl border border-amber-300 bg-amber-100 px-3 py-2">
            <span className="text-[11px] shrink-0 mt-0.5">🔒</span>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              <span className="font-black">ความเป็นส่วนตัว:</span> IP ใน Nginx log ถูก mask อัตโนมัติ (3 octet แรกเท่านั้น) ก่อน export — ไม่มี IP จริงของผู้เข้าชมในข้อมูลนี้
            </p>
          </div>
          <p className="mt-2 text-[10px] text-amber-500">
            ต้องการเฉพาะ log ไฟล์เดียว → ไปที่ tab ที่ต้องการ → กด Copy ใต้ log นั้น
          </p>
        </div>

        {/* DB snapshot summary */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'เทมเพลต', value: `${data.summary.total_templates} (${data.summary.published} live)` },
            { label: 'หมวดหมู่', value: data.summary.categories },
            { label: 'ออเดอร์ 30 วัน', value: data.orders30d.paid_orders },
            { label: 'รายได้ 30 วัน', value: `฿${data.orders30d.total_revenue_baht.toLocaleString()}` },
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
