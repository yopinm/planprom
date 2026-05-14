import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signAdminToken, COOKIE_NAME, EXPIRES_IN, type AdminRole } from '@/lib/admin-rbac'

interface AdminUserRow {
  id: string
  email: string
  password_hash: string
  role: AdminRole
  name: string | null
  permissions: string[]
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email?: string; password?: string }

  if (!email || !password) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const [user] = await db<AdminUserRow[]>`
    SELECT id, email, password_hash, role, name, permissions
    FROM admin_users
    WHERE email = ${email.toLowerCase().trim()}
    LIMIT 1
  `

  if (!user) {
    return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })
  }

  const token = await signAdminToken({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions ?? [],
  })

  const res = NextResponse.json({ ok: true, role: user.role })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRES_IN,
    path: '/',
  })
  return res
}
