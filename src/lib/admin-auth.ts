// Admin Authentication — Security Fix #1 + #2
//
// Replaces the insecure ?key=ADMIN_KEY pattern with Supabase session checks.
// Every admin page and API route must call one of these helpers.
//
// requireAdminSession() — Server Components / pages (redirects on failure)
// getAdminUser()        — API routes (returns null on failure, caller handles 403)

import { redirect } from 'next/navigation'
import { buildAdminLoginRedirectPath } from '@/lib/auth-redirect'
import { db } from '@/lib/db'
import { createServerClient } from '@/lib/supabase/server'

interface UserRoleRow {
  role: string | null
}

// ---------------------------------------------------------------------------
// Core check — shared by both helpers
// ---------------------------------------------------------------------------

async function resolveAdminUserId(): Promise<string | null> {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const [profile] = await db<UserRoleRow[]>`
    SELECT role
    FROM user_profiles
    WHERE id = ${user.id}
    LIMIT 1
  `

  if (profile?.role !== 'admin') return null
  return user.id
}

// ---------------------------------------------------------------------------
// For Server Components and Pages — throws redirect on failure
// ---------------------------------------------------------------------------

export async function requireAdminSession(nextPath?: string): Promise<string> {
  const userId = await resolveAdminUserId()
  if (!userId) redirect(buildAdminLoginRedirectPath(nextPath))
  return userId
}

// ---------------------------------------------------------------------------
// For API Route Handlers — returns null so caller can return 403
// ---------------------------------------------------------------------------

export async function getAdminUser(): Promise<string | null> {
  return resolveAdminUserId()
}
