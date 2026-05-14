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

const PM2_ERR = '/root/.pm2/logs/planprom-error.log'

function tailLog(path: string, lines: number): string {
  try {
    return execSync(`tail -n ${lines} "${path}" 2>/dev/null`, { encoding: 'utf8', timeout: 5000 }).trim()
  } catch {
    return '(log ไม่พบ หรืออยู่บน local dev)'
  }
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

  const exportedAt = new Date().toISOString()
  const pm2Errors = tailLog(PM2_ERR, 50)

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
      paid_orders:   Number(orderRows[0]?.paid_orders ?? 0),
      pending_orders: Number(orderRows[0]?.pending_orders ?? 0),
      total_revenue_baht: orderRows[0]?.total_revenue ? Number(orderRows[0].total_revenue) : 0,
      unique_buyers: Number(orderRows[0]?.unique_buyers ?? 0),
    },
    cart_stats: {
      active_carts:      Number(cartRows[0]?.active_carts ?? 0),
      total_cart_items:  Number(cartRows[0]?.total_cart_items ?? 0),
    },
    templates,
    categories,
    category_links: categoryLinks,
    template_performance: orderItemRows,
    pm2_errors_recent_50_lines: pm2Errors,
  }

  const json = JSON.stringify(snapshot, null, 2)

  return <LogExportClient json={json} exportedAt={exportedAt} />
}
