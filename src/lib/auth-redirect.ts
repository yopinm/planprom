// Safe redirect helpers for OAuth callback flows.

export function isSafeRelativePath(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.includes('\\')) return false
  if (/[\u0000-\u001F\u007F]/.test(path)) return false
  return true
}

export function resolveSafeNextPath(next: string | null): string {
  if (!next) return '/'
  return isSafeRelativePath(next) ? next : '/'
}

export function buildAdminLoginRedirectPath(nextPath?: string): string {
  const next = resolveSafeNextPath(nextPath ?? '/admin')
  if (next === '/admin') return '/admin/login'
  return `/admin/login?next=${encodeURIComponent(next)}`
}
