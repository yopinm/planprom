import postgres from '../node_modules/postgres/src/index.js'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL env var not set')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  connect_timeout: 15,
})

try {
  const result = await sql`SELECT current_database(), version()`
  console.log('Connected:', result[0])
} catch (e) {
  console.error('Error:', e.message)
} finally {
  await sql.end()
}
