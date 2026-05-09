import type { Provider } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { resolveSafeNextPath } from '@/lib/auth-redirect'

const LINE_PROVIDER = 'custom:line' as unknown as Provider

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const next = resolveSafeNextPath(searchParams.get('next'))
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? origin

  const cookieStore = await cookies()

  // Capture cookies Supabase sets (PKCE verifier) in a local array so we can
  // apply them directly to the redirect response. cookieStore.set() alone does
  // NOT propagate to NextResponse.redirect() in Next.js 15+ Route Handlers.
  const pending: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(c => pending.push(c))
        },
      },
    }
  )

  const redirectTo = `${siteOrigin}/api/auth/callback?next=${encodeURIComponent(next)}`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: LINE_PROVIDER,
    options: {
      redirectTo,
      scopes: 'profile openid',
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(
      `${siteOrigin}/auth/login?next=${encodeURIComponent(next)}&error=auth_failed`
    )
  }

  const response = NextResponse.redirect(data.url)
  pending.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )
  // Tag this attempt as LINE so the callback can alert admin on failure
  response.cookies.set('_auth_provider', 'line', {
    maxAge: 120, httpOnly: true, sameSite: 'lax', path: '/',
  })
  return response
}
