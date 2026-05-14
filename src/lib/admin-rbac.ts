import { SignJWT, jwtVerify } from 'jose'

export type AdminRole = 'admin' | 'clerk'

export const PERMISSION_MODULES = [
  { key: 'templates',    label: 'Templates',     desc: 'New Template · Templates · Field Templates' },
  { key: 'catalog',      label: 'Catalog',        desc: 'Catalog manager' },
  { key: 'analytics',    label: 'Analytics',      desc: 'Template Analytics' },
  { key: 'blog_seo',     label: 'Blog SEO',       desc: 'Blog Manager' },
  { key: 'form_builder', label: 'Form Builder',   desc: 'Form Builder' },
] as const

export type PermissionKey = typeof PERMISSION_MODULES[number]['key']

export interface AdminTokenPayload {
  id: string
  email: string
  role: AdminRole
  permissions: string[]
}

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? 'fallback-dev-secret-change-in-prod'
)

const COOKIE_NAME = '_admin_token'
const EXPIRES_IN  = 60 * 60 * 8 // 8 hours

export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN}s`)
    .sign(SECRET)
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (
      typeof payload.id === 'string' &&
      typeof payload.email === 'string' &&
      (payload.role === 'admin' || payload.role === 'clerk')
    ) {
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        permissions: Array.isArray(payload.permissions) ? payload.permissions as string[] : [],
      }
    }
    return null
  } catch {
    return null
  }
}

export { COOKIE_NAME, EXPIRES_IN }
