import { SignJWT, jwtVerify } from 'jose'

export type AdminRole = 'admin' | 'clerk'

export interface AdminTokenPayload {
  id: string
  email: string
  role: AdminRole
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
      return { id: payload.id, email: payload.email, role: payload.role }
    }
    return null
  } catch {
    return null
  }
}

export { COOKIE_NAME, EXPIRES_IN }
