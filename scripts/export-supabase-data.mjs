/**
 * Export all data from Supabase public tables as SQL INSERT statements.
 * Runs from local machine using existing @supabase/supabase-js setup.
 * Usage: node scripts/export-supabase-data.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, appendFileSync } from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars. Run: set -a && source .env.local && set +a && node scripts/export-supabase-data.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TABLES = [
  'products',
  'coupons',
  'price_history',
  'bank_promotions',
  'click_logs',
  'search_logs',
  'alerts',
  'alert_logs',
  'revenue_tracking',
  'analytics_events',
  'user_profiles',
  'coupon_wallet',
  'coupon_votes',
  'facebook_posts',
  'facebook_post_logs',
  'facebook_settings',
  'facebook_comment_receipts',
  'product_tips',
  'product_link_checks',
  'product_views',
  'rare_item_scores',
  'coupon_stack_rules',
  'tiktok_trends',
  'admin_alert_rules',
  'admin_alert_rule_audit_logs',
  'admin_control_flags',
  'admin_control_audit_logs',
  'daily_featured_coupons',
  'daily_coupon_reveals',
  'push_subscriptions',
]

const OUT = 'D:/couponkum/scripts/supabase_data.sql'

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (Array.isArray(val)) {
    // PostgreSQL array literal: ARRAY['a','b'] or '{}'
    if (val.length === 0) return "'{}'"
    const items = val.map(v => {
      if (v === null) return 'NULL'
      if (typeof v === 'number') return String(v)
      return `"${String(v).replace(/"/g, '\\"')}"`
    })
    return `'{${items.join(',')}}'`
  }
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`
  return `'${String(val).replace(/'/g, "''")}'`
}

writeFileSync(OUT, '-- Supabase data export\nSET session_replication_role = replica; -- disable triggers during import\n\n')

let total = 0

for (const table of TABLES) {
  process.stdout.write(`Exporting ${table}... `)

  const PAGE = 1000
  let offset = 0
  let rows = []
  let page

  do {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(offset, offset + PAGE - 1)

    if (error) {
      console.log(`SKIP (${error.message})`)
      rows = null
      break
    }

    page = data ?? []
    rows = rows.concat(page)
    offset += PAGE
  } while (page.length === PAGE)

  if (!rows || rows.length === 0) {
    console.log('0 rows')
    continue
  }

  const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(', ')
  const inserts = rows.map(row => {
    const vals = Object.values(row).map(escapeValue).join(', ')
    return `INSERT INTO "${table}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;`
  })

  appendFileSync(OUT, `-- ${table}: ${rows.length} rows\n${inserts.join('\n')}\n\n`)
  total += rows.length
  console.log(`${rows.length} rows`)
}

appendFileSync(OUT, 'SET session_replication_role = DEFAULT;\n')
console.log(`\nDone. Total: ${total} rows → ${OUT}`)
