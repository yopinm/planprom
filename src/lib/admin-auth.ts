import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { buildAdminLoginRedirectPath } from '@/lib/auth-redirect'
import { db } from '@/lib/db'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminToken, COOKIE_NAME, type AdminRole } from '@/lib/admin-rbac'

interface UserRoleRow { role: string | null }

// ---------------------------------------------------------------------------
// Resolve session — Tier 1: Supabase, Tier 2: _admin_token cookie
// ---------------------------------------------------------------------------

interface ResolvedSession {
  userId: string
  role: AdminRole
  permissions: string[]
}

async function resolveSession(): Promise<ResolvedSession | null> {
  // Tier 1: Supabase
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) {
      const [profile] = await db<UserRoleRow[]>`
        SELECT role FROM user_profiles WHERE id = ${user.id} LIMIT 1
      `
      if (profile?.role === 'admin') {
        return { userId: user.id, role: 'admin', permissions: [] }
      }
    }
  } catch {
    // Supabase unavailable — fall through to Tier 2
  }

  // Tier 2: RBAC JWT cookie
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (token) {
    const payload = await verifyAdminToken(token)
    if (payload) {
      return { userId: payload.id, role: payload.role, permissions: payload.permissions }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// For Server Components / Pages — redirects on failure
// ---------------------------------------------------------------------------

export async function requireAdminSession(nextPath?: string): Promise<string> {
  const session = await resolveSession()
  if (!session) redirect(buildAdminLoginRedirectPath(nextPath))
  return session.userId
}

// ---------------------------------------------------------------------------
// For API Route Handlers — returns null so caller can return 403
// ---------------------------------------------------------------------------

export async function getAdminUser(): Promise<string | null> {
  const session = await resolveSession()
  return session?.userId ?? null
}

// ---------------------------------------------------------------------------
// Role + permissions helpers
// ---------------------------------------------------------------------------

export async function getAdminRole(): Promise<AdminRole | null> {
  const session = await resolveSession()
  return session?.role ?? null
}

export async function getAdminSession(): Promise<{ role: AdminRole; permissions: string[] } | null> {
  const session = await resolveSession()
  if (!session) return null
  return { role: session.role, permissions: session.permissions }
}

export async function requireAdminRole(
  required: AdminRole,
  nextPath?: string
): Promise<string> {
  const session = await resolveSession()
  if (!session) redirect(buildAdminLoginRedirectPath(nextPath))
  if (required === 'admin' && session!.role !== 'admin') redirect('/admin')
  return session!.userId
}
