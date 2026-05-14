import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-rbac'

// Routes clerk ไม่มีสิทธิ์เข้าเลย (admin-only)
const ADMIN_ONLY: RegExp[] = [
  /^\/admin\/promo-codes/,
  /^\/admin\/report/,
  /^\/admin\/users/,
]

// Routes ที่ต้องมี permission เฉพาะ (clerk)
const CLERK_PERMISSION_MAP: Array<[RegExp, string]> = [
  [/^\/admin\/templates/,          'templates'],
  [/^\/admin\/field-templates/,    'templates'],
  [/^\/admin\/catalogs/,           'catalog'],
  [/^\/admin\/template-analytics/, 'analytics'],
  [/^\/admin\/seo/,                'blog_seo'],
  [/^\/admin\/form-builder/,       'form_builder'],
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ไม่ใช่ admin route หรือเป็นหน้า login → ผ่านเลย
  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    // ไม่มี _admin_token → Supabase session จัดการต่อที่ page
    return NextResponse.next()
  }

  const payload = await verifyAdminToken(token)
  if (!payload) {
    // Token หมดอายุหรือ invalid → ผ่าน (page จะ redirect login เอง)
    return NextResponse.next()
  }

  // admin role → ผ่านทุก route
  if (payload.role === 'admin') return NextResponse.next()

  // clerk role → ตรวจ admin-only routes
  if (ADMIN_ONLY.some(p => p.test(pathname))) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // clerk role → ตรวจ permission-gated routes
  for (const [pattern, permission] of CLERK_PERMISSION_MAP) {
    if (pattern.test(pathname)) {
      if (!payload.permissions.includes(permission)) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      break
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
