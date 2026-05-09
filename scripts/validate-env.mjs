#!/usr/bin/env node
// scripts/validate-env.mjs - TASK S3
// Run before next build to catch insecure / missing env vars.

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local so prebuild can read vars Next.js hasn't loaded yet
const __dir = dirname(fileURLToPath(import.meta.url))
const envFile = join(__dir, '..', '.env.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
}

const errors = []

// Block default admin key in production
const adminKey = process.env.ADMIN_KEY ?? ''
if (!adminKey || adminKey === 'dev-admin-key') {
  errors.push('ADMIN_KEY is missing or still set to the default "dev-admin-key". Set a strong random value.')
}

// Require Supabase connection vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  errors.push('NEXT_PUBLIC_SUPABASE_URL is not set.')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  errors.push('SUPABASE_SERVICE_ROLE_KEY is not set.')
}

// Warn if mock mode is on in production
if (process.env.USE_MOCK_DATA === 'true' && process.env.NODE_ENV === 'production') {
  errors.push('USE_MOCK_DATA=true in a production build. Set it to false.')
}

// Warn when only one FB var is set. Both or neither is valid.
const fbPageId = process.env.FB_PAGE_ID
const fbPageToken = process.env.FB_PAGE_ACCESS_TOKEN
const fbAppSecret = process.env.FB_APP_SECRET
const fbAppSecretRotatedAt = process.env.FB_APP_SECRET_ROTATED_AT
if (!!fbPageId !== !!fbPageToken) {
  errors.push('FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN must both be set or both be empty.')
}

if (errors.length > 0) {
  console.error('\nEnv validation failed - fix before deploying:\n')
  for (const e of errors) console.error(`  - ${e}`)
  console.error('')
  process.exit(1)
}

// Optional reminders for Facebook automation.
if (!fbPageId) {
  console.warn('WARNING: FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN not set - Graph API posting (TASK 3.18+) will be disabled.')
}

if (fbPageId && !process.env.FB_WEBHOOK_VERIFY_TOKEN) {
  console.warn('WARNING: FB_WEBHOOK_VERIFY_TOKEN not set - Facebook webhook hub verification will fail.')
}

if (fbPageId && !fbAppSecret) {
  console.warn('WARNING: FB_APP_SECRET not set - Facebook webhook POST signatures (X-Hub-Signature-256) will be rejected.')
}

if (fbAppSecret && !fbAppSecretRotatedAt) {
  console.warn('WARNING: FB_APP_SECRET_ROTATED_AT not set - app secret rotation after exposure cannot be confirmed.')
}

if (process.env.FB_DISABLE_GRAPH_API_POSTING === 'true') {
  console.warn('WARNING: FB_DISABLE_GRAPH_API_POSTING=true - live Facebook Page posting is force-disabled.')
}

if (process.env.FB_DISABLE_AUTO_REPLY === 'true') {
  console.warn('WARNING: FB_DISABLE_AUTO_REPLY=true - Facebook auto-reply is force-disabled.')
}

if (fbPageId && !process.env.FB_PAGE_ACCESS_TOKEN_ISSUED_AT) {
  console.warn('WARNING: FB_PAGE_ACCESS_TOKEN_ISSUED_AT not set - admin token rotation warning cannot calculate the 60-day reminder.')
}

console.log('Env validation passed.')
