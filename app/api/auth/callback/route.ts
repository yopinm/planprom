// app/api/auth/callback/route.ts
// OAuth callback handler for Google + Line login
// Supabase exchanges the code for a session and redirects the user

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { resolveSafeNextPath } from '@/lib/auth-redirect'
import { pushLine } from '@/src/lib/line-messaging'

async function alertAdminLineLoginFailed(errorMsg: string) {
  const ownerLineId = process.env.OWNER_LINE_USER_ID
  if (!ownerLineId) return
  const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
  await pushLine(ownerLineId, [{
    type: 'text',
    text: `🚨 LINE Login ล้มเหลว\n\nมีผู้ใช้พยายาม Login ด้วย LINE แต่ไม่สำเร็จ\n\n❌ Error: ${errorMsg}\n🕐 เวลา: ${now}`,
  }])
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = resolveSafeNextPath(searchParams.get('next'))

  // Use canonical site URL for redirects — behind Nginx reverse proxy, `origin`
  // may resolve to http://localhost:3000 which the user's browser cannot reach.
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? origin

  const cookieStore = await cookies()
  const isLineLogin = cookieStore.get('_auth_provider')?.value === 'line'

  if (code) {
    // Capture session cookies Supabase sets during code exchange and apply them
    // directly to the redirect response. cookieStore.set() does NOT propagate to
    // NextResponse.redirect() in Next.js 15+ Route Handlers.
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const response = NextResponse.redirect(`${siteOrigin}${next}`)
      pending.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
      )
      response.cookies.delete('_auth_provider')
      return response
    }

    console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error.status, JSON.stringify(error))
    if (isLineLogin) {
      void alertAdminLineLoginFailed(error.message)
    }
  } else if (isLineLogin) {
    // No code at all (user denied or LINE error)
    const errorParam = searchParams.get('error') ?? 'no_code'
    console.error('[auth/callback] no code, error param:', errorParam, 'full params:', searchParams.toString())
    void alertAdminLineLoginFailed(errorParam)
  } else {
    console.error('[auth/callback] no code, not LINE, params:', searchParams.toString())
  }

  // Auth failed — redirect to login with error param
  const failRes = NextResponse.redirect(`${siteOrigin}/auth/login?error=auth_failed`)
  failRes.cookies.delete('_auth_provider')
  return failRes
}
