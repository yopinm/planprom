import type { Metadata } from 'next'
import { execSync } from 'child_process'
import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-auth'
import { LogExportClient } from './LogExportClient'

export const metadata: Metadata = {
  title: 'System Log Export — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const PM2_OUT  = '/root/.pm2/logs/planprom-out.log'
const PM2_ERR  = '/root/.pm2/logs/planprom-error.log'
const NGX_ACC  = '/var/log/nginx/access.log'
const NGX_ERR  = '/var/log/nginx/error.log'

function tailLines(path: string, n: number): string[] {
  try {
    const out = execSync(`tail -n ${n} "${path}" 2>/dev/null`, { encoding: 'utf8', timeout: 5000 })
    return out.split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function isErrorLine(line: string): boolean {
  return /error|Error|ERROR|warn|WARN|fail|Fail|FAIL|exception|Exception|crash|502|504|unhandled|uncaught/i.test(line)
}

function parseNginxAccessSummary(lines: string[]) {
  const status4xx = lines.filter(l => / 4\d\d /.test(l)).length
  const status5xx = lines.filter(l => / 5\d\d /.test(l)).length
  const paths: Record<string, number> = {}
  for (const line of lines) {
    const m = line.match(/"(?:GET|POST|PUT|DELETE|PATCH) ([^\s"]+)/)
    if (m) paths[m[1]] = (paths[m[1]] ?? 0) + 1
  }
  const top_paths = Object.entries(paths).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([path, count]) => ({ path, count }))
  return { total_lines: lines.length, status_4xx: status4xx, status_5xx: status5xx, top_paths }
}

export default async function TemplateLogExportPage() {
  await requireAdminSession('/admin/login')

  const [templates, categories, categoryLinks, orderRows, cartRows, orderItemRows] = await Promise.all([
    db<{
      id: string; slug: string; title: string; tier: string; price_baht: number
      status: string; document_type: string | null; engine_type: string | null
      pdf_path: string | null; sale_count: number; created_at: string
    }[]>`
      SELECT id, slug, title, tier, price_baht, status, document_type, engine_type,
             pdf_path, sale_count, created_at
      FROM templates
      ORDER BY created_at DESC
    `.catch(() => []),

    db<{ id: string; slug: string; name: string; emoji: string | null }[]>`
      SELECT id, slug, name, emoji FROM template_categories ORDER BY name
    `.catch(() => []),

    db<{ template_id: string; category_id: string }[]>`
      SELECT template_id, category_id FROM template_category_links
    `.catch(() => []),

    db<{
      paid_orders: string; pending_orders: string
      total_revenue: string | null; unique_buyers: string
    }[]>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'paid')::text        AS paid_orders,
        COUNT(*) FILTER (WHERE status = 'pending')::text     AS pending_orders,
        SUM(total_baht) FILTER (WHERE status = 'paid')::text AS total_revenue,
        COUNT(DISTINCT customer_line_id) FILTER (WHERE status = 'paid')::text AS unique_buyers
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `.catch(() => []),

    db<{ active_carts: string; total_cart_items: string }[]>`
      SELECT
        COUNT(DISTINCT c.id)::text  AS active_carts,
        COUNT(ci.id)::text          AS total_cart_items
      FROM carts c
      JOIN cart_items ci ON ci.cart_id = c.id
      WHERE c.expires_at > NOW()
    `.catch(() => [{ active_carts: '0', total_cart_items: '0' }]),

    db<{ template_id: string; title: string; order_count: string; download_count: string }[]>`
      SELECT
        t.id       AS template_id,
        t.title,
        COUNT(oi.id)::text               AS order_count,
        SUM(oi.download_count)::text     AS download_count
      FROM templates t
      LEFT JOIN order_items oi ON oi.template_id = t.id
      LEFT JOIN orders o       ON o.id = oi.order_id AND o.status = 'paid'
      WHERE t.status = 'published'
      GROUP BY t.id, t.title
      ORDER BY COUNT(oi.id) DESC
    `.catch(() => []),
  ])

  // Read logs (parallel, non-blocking)
  const pm2OutLines  = tailLines(PM2_OUT, 200)
  const pm2ErrLines  = tailLines(PM2_ERR, 100)
  const ngxAccLines  = tailLines(NGX_ACC, 200)
  const ngxErrLines  = tailLines(NGX_ERR, 100)

  const exportedAt = new Date().toISOString()

  const snapshot = {
    exported_at: exportedAt,
    summary: {
      total_templates: templates.length,
      published: templates.filter(t => t.status === 'published').length,
      draft: templates.filter(t => t.status === 'draft').length,
      archived: templates.filter(t => t.status === 'archived').length,
      categories: categories.length,
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
    category_links: categoryLinks,
    template_performance: orderItemRows,
    logs: {
      pm2_stdout_errors:   pm2OutLines.filter(isErrorLine),
      pm2_stderr_last100:  pm2ErrLines,
      nginx_access_summary: parseNginxAccessSummary(ngxAccLines),
      nginx_access_last200: ngxAccLines,
      nginx_error_last100:  ngxErrLines,
    },
  }

  const json = JSON.stringify(snapshot, null, 2)

  return <LogExportClient json={json} exportedAt={exportedAt} />
}
