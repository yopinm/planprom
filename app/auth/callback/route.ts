// app/auth/callback/route.ts
// OAuth callback สำหรับ LINE login test (localhost)
// รับ code จาก Supabase → exchange เป็น session → redirect

import { NextResponse } from 'next/server'
import { resolveSafeNextPath } from '@/lib/auth-redirect'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = resolveSafeNextPath(searchParams.get('next'))
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // OAuth error from provider (e.g. user denied)
  if (error) {
    console.error('[auth/callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}`
    )
  }

  if (code) {
    const supabase = await createServerClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[auth/callback] Exchange error:', exchangeError.message)
      return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // No code — redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
