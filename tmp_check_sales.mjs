import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const env = readFileSync('/var/www/planprom/.env.local', 'utf8')
const dbUrl = env.match(/DATABASE_URL=(.+)/)[1].trim()
const postgres = require('/var/www/planprom/node_modules/postgres/src/index.js')
const sql = postgres(dbUrl, { ssl: 'require' })

const orders = await sql`SELECT order_number, status, total_baht, discount_baht, created_at FROM orders ORDER BY created_at DESC`
console.log('=== ORDERS ===')
orders.forEach(o => console.log(o.order_number, o.status, 'total:', o.total_baht, 'disc:', o.discount_baht, String(o.created_at).slice(0,10)))

const [kpi] = await sql`SELECT COUNT(*) FILTER (WHERE status='paid') as paid_orders, COALESCE(SUM(total_baht) FILTER (WHERE status='paid'),0) as revenue, COALESCE(SUM(discount_baht) FILTER (WHERE status='paid'),0) as discount_total, COUNT(*) FILTER (WHERE status='pending_payment') as pending, COUNT(*) FILTER (WHERE fraud_flag='revoked') as revoked FROM orders`
console.log('\n=== KPI (all time) ===')
console.log(JSON.stringify(kpi, null, 2))

const byType = await sql`WITH item_share AS (SELECT oi.id, oi.template_id, oi.order_id, o.status, ROUND(o.total_baht::numeric / COUNT(*) OVER (PARTITION BY o.id)) AS share FROM order_items oi JOIN orders o ON o.id = oi.order_id) SELECT CASE WHEN t.engine_type IN ('planner','planner-pipeline','pipeline') THEN 'planner' WHEN t.engine_type IN ('checklist','form','report') THEN t.engine_type ELSE 'other' END AS type_group, COUNT(DISTINCT s.order_id) as orders, COUNT(DISTINCT s.order_id) FILTER (WHERE s.status='paid') as paid, COALESCE(SUM(s.share) FILTER (WHERE s.status='paid'),0) as revenue FROM item_share s JOIN templates t ON t.id = s.template_id GROUP BY type_group`
console.log('\n=== BY ENGINE TYPE ===')
byType.forEach(r => console.log(r.type_group.padEnd(12), '| orders:', String(r.orders).padStart(3), '| paid:', String(r.paid).padStart(3), '| revenue: ฿'+r.revenue))

const items = await sql`SELECT o.order_number, o.status, o.total_baht, t.title, t.engine_type FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN templates t ON t.id = oi.template_id ORDER BY o.created_at DESC`
console.log('\n=== ORDER ITEMS ===')
items.forEach(r => console.log(r.order_number, r.status.padEnd(16), 'thb:'+r.total_baht, r.engine_type.padEnd(18), '-', String(r.title).slice(0,35)))

await sql.end()
