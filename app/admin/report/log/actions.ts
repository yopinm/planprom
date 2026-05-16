'use server'
import { requireAdminRole } from '@/lib/admin-auth'
import { spawnSync } from 'child_process'

export async function flushPm2Logs(): Promise<{ ok: boolean; message: string }> {
  await requireAdminRole('admin', '/admin/login')
  try {
    const r = spawnSync('pm2', ['flush', 'planprom'], { encoding: 'utf-8', timeout: 10000 })
    if (r.status === 0) return { ok: true, message: 'PM2 logs cleared' }
    return { ok: false, message: r.stderr?.trim() || 'pm2 flush failed' }
  } catch (e) {
    return { ok: false, message: String(e) }
  }
}
