import type { Metadata } from 'next'
import { spawnSync } from 'child_process'
import { db } from '@/lib/db'
import { requireAdminRole } from '@/lib/admin-auth'   // VULN-001: admin-only
import { SystemLogClient, type SystemLogData } from './SystemLogClient'

export const metadata: Metadata = {
  title: 'System Log — Admin Report',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const NGX_ACC = '/var/log/nginx/access.log'
const NGX_ERR = '/var/log/nginx/error.log'

const LINE_MAP: Record<string, { pm2Out: number; pm2Err: number; ngxAcc: number; ngxErr: number }> = {
  '1h':  { pm2Out: 200,  pm2Err: 100,  ngxAcc: 500,   ngxErr: 200  },
  '6h':  { pm2Out: 500,  pm2Err: 200,  ngxAcc: 2000,  ngxErr: 500  },
  '24h': { pm2Out: 1000, pm2Err: 500,  ngxAcc: 5000,  ngxErr: 1000 },
  'all': { pm2Out: 2000, pm2Err: 1000, ngxAcc: 10000, ngxErr: 3000 },
}

// VULN-004: spawnSync + array args — no shell interpolation
function findLog(glob: string): string {
  try {
    const r = spawnSync('sh', ['-c', `ls -t ${glob} 2>/dev/null | head -1`], { encoding: 'utf8', timeout: 3000 })
    return r.stdout.trim()
  } catch { return '' }
}

function tailLines(path: string, n: number): string[] {
  if (!path) return []
  try {
    const r = spawnSync('tail', ['-n', String(n), path], { encoding: 'utf8', timeout: 5000 })
    if (r.status !== 0 || r.error) return ['[LOG_READ_ERROR — ตรวจสอบ permission หรือ path]']
    return r.stdout.split('\n').filter(Boolean)
  } catch { return ['[LOG_READ_ERROR — ตรวจสอบ permission หรือ path]'] }
}

// VULN-002: mask last IPv4 octet before data reaches the client
function maskIpLines(lines: string[]): string[] {
  return lines.map(l => l.replace(/\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b/g, '$1.0'))
}

function parseAccessSummary(lines: string[]) {
  const status4xx = lines.filter(l => / 4\d\d /.test(l)).length
  const status5xx = lines.filter(l => / 5\d\d /.test(l)).length
  const paths: Record<string, number> = {}
  const paths4xx: Record<string, number> = {}
  for (const line of lines) {
    const m = line.match(/"(?:GET|POST|PUT|DELETE|PATCH) ([^\s"]+)/)
    if (m) {
      paths[m[1]] = (paths[m[1]] ?? 0) + 1
      if (/ 4\d\d /.test(line)) paths4xx[m[1]] = (paths4xx[m[1]] ?? 0) + 1
    }
  }
  const top_paths = Object.entries(paths).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([path, count]) => ({ path, count }))
  const top_4xx_paths = Object.entries(paths4xx).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([path, count]) => ({ path, count }))
  return { total_lines: lines.length, status_4xx: status4xx, status_5xx: status5xx, top_paths, top_4xx_paths }
}

export default async function SystemLogPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  // VULN-001: admin role only — clerk cannot access system logs
  await requireAdminRole('admin', '/admin/login')

  const sp = await searchParams
  const win = (['1h', '6h', '24h', 'all'].includes(sp.window ?? '') ? sp.window : '6h') as string
  const limits = LINE_MAP[win]

  const pm2OutPath = findLog('/root/.pm2/logs/planprom-out*.log')
  const pm2ErrPath = findLog('/root/.pm2/logs/planprom-error*.log')

  const [pm2Out, pm2Err, ngxAccRaw, ngxErr, dbRows] = await Promise.all([
    Promise.resolve(tailLines(pm2OutPath, limits.pm2Out)),
    Promise.resolve(tailLines(pm2ErrPath, limits.pm2Err)),
    Promise.resolve(tailLines(NGX_ACC, limits.ngxAcc)),
    Promise.resolve(tailLines(NGX_ERR, limits.ngxErr)),
    Promise.all([
      db<{ id: string; slug: string; title: string; tier: string; price_baht: number; status: string; document_type: string | null; engine_type: string | null; sale_count: number; created_at: string }[]>`
        SELECT id, slug, title, tier, price_baht, status, document_type, engine_type, sale_count, created_at
        FROM templates ORDER BY created_at DESC
      `.catch(() => []),
      db<{ id: string; slug: string; name: string; emoji: string | null }[]>`
        SELECT id, slug, name, emoji FROM template_categories ORDER BY name
      `.catch(() => []),
      db<{ paid_orders: string; pending_orders: string; total_revenue: string | null; unique_buyers: string }[]>`
        SELECT
          COUNT(*) FILTER (WHERE status = 'paid')::text        AS paid_orders,
          COUNT(*) FILTER (WHERE status = 'pending')::text     AS pending_orders,
          SUM(total_baht) FILTER (WHERE status = 'paid')::text AS total_revenue,
          COUNT(DISTINCT customer_line_id) FILTER (WHERE status = 'paid')::text AS unique_buyers
        FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'
      `.catch(() => []),
      db<{ active_carts: string; total_cart_items: string }[]>`
        SELECT COUNT(DISTINCT c.id)::text AS active_carts, COUNT(ci.id)::text AS total_cart_items
        FROM carts c JOIN cart_items ci ON ci.cart_id = c.id WHERE c.expires_at > NOW()
      `.catch(() => [{ active_carts: '0', total_cart_items: '0' }]),
    ]),
  ])

  // VULN-002: mask IPs before any client-bound data is assembled
  const ngxAcc        = maskIpLines(ngxAccRaw)
  const ngxAccSummary = parseAccessSummary(ngxAcc)

  const [templates, categories, orderRows, cartRows] = dbRows
  const exportedAt = new Date().toISOString()

  const snapshot = {
    exported_at: exportedAt,
    window: win,
    note: 'IP addresses masked (last octet) for privacy.',   // VULN-002: document masking
    summary: {
      total_templates: templates.length,
      published:       templates.filter(t => t.status === 'published').length,
      draft:           templates.filter(t => t.status === 'draft').length,
      categories:      categories.length,
    },
    orders_30d: {
      paid_orders:        Number(orderRows[0]?.paid_orders ?? 0),
      pending_orders:     Number(orderRows[0]?.pending_orders ?? 0),
      total_revenue_baht: orderRows[0]?.total_revenue ? Number(orderRows[0].total_revenue) : 0,
      unique_buyers:      Number(orderRows[0]?.unique_buyers ?? 0),
    },
    cart_stats: {
      active_carts:     Number(cartRows[0]?.active_carts ?? 0),
      total_cart_items: Number(cartRows[0]?.total_cart_items ?? 0),
    },
    templates,
    categories,
    logs: {
      pm2_stdout:           pm2Out,
      pm2_stderr:           pm2Err,
      nginx_access_summary: ngxAccSummary,
      nginx_access:         ngxAcc,      // masked
      nginx_error:          ngxErr,
    },
  }

  const data: SystemLogData = {
    exportedAt,
    window: win,
    summary: {
      total_templates: templates.length,
      published:       templates.filter(t => t.status === 'published').length,
      draft:           templates.filter(t => t.status === 'draft').length,
      categories:      categories.length,
    },
    orders30d: {
      paid_orders:        Number(orderRows[0]?.paid_orders ?? 0),
      pending_orders:     Number(orderRows[0]?.pending_orders ?? 0),
      total_revenue_baht: orderRows[0]?.total_revenue ? Number(orderRows[0].total_revenue) : 0,
      unique_buyers:      Number(orderRows[0]?.unique_buyers ?? 0),
    },
    cartStats: {
      active_carts:     Number(cartRows[0]?.active_carts ?? 0),
      total_cart_items: Number(cartRows[0]?.total_cart_items ?? 0),
    },
    pm2Out,
    pm2Err,
    ngxAcc,            // masked
    ngxAccSummary,
    ngxErr,
    // VULN-003: pass only filename, not full server path
    pm2OutPath: pm2OutPath ? pm2OutPath.split('/').pop() ?? '(ไม่พบ)' : '(ไม่พบ)',
    pm2ErrPath: pm2ErrPath ? pm2ErrPath.split('/').pop() ?? '(ไม่พบ)' : '(ไม่พบ)',
    json: JSON.stringify(snapshot, null, 2),
  }

  return <SystemLogClient data={data} />
}
