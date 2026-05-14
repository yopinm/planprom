import type { Metadata } from 'next'
import { requireAdminRole } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { PERMISSION_MODULES } from '@/lib/admin-rbac'
import { createAdminUserAction, deleteAdminUserAction, updatePermissionsAction } from './actions'

export const metadata: Metadata = {
  title: 'Admin Users · Planprom',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type AdminUser = {
  id: string
  email: string
  role: string
  name: string | null
  permissions: string[]
  created_at: Date
}

const INPUT = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white'
const LABEL = 'mb-1 block text-[11px] font-black uppercase tracking-widest text-neutral-400'

export default async function AdminUsersPage() {
  await requireAdminRole('admin', '/admin/users')

  const users = await db<AdminUser[]>`
    SELECT id, email, role, name, permissions, created_at
    FROM admin_users
    ORDER BY created_at ASC
  `

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-3xl px-4 py-8">

        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            👤 Admin Users
          </div>
          <h1 className="mt-2 text-2xl font-black text-black">จัดการ Admin Accounts</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            สร้าง/ลบ admin และ clerk accounts — กำหนด permissions ต่อ clerk ได้
          </p>
        </div>

        {/* User list */}
        <div className="mb-10 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {users.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-400">ยังไม่มี account</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {users.map(u => (
                <div key={u.id}>
                  {/* User row */}
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-black text-white ${u.role === 'admin' ? 'bg-black' : 'bg-amber-500'}`}>
                      {u.role === 'admin' ? 'A' : 'C'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-neutral-900">{u.name ?? u.email}</p>
                      <p className="text-xs text-neutral-400">{u.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      u.role === 'admin' ? 'bg-black text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {u.role}
                    </span>
                    {u.role === 'clerk' && (
                      <span className="shrink-0 text-[10px] text-neutral-400">
                        {u.permissions.length === 0
                          ? 'ไม่มี permission'
                          : `${u.permissions.length} module`}
                      </span>
                    )}
                    <form action={deleteAdminUserAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-500 hover:bg-red-100 transition"
                      >
                        ลบ
                      </button>
                    </form>
                  </div>

                  {/* Permissions editor — clerk only */}
                  {u.role === 'clerk' && (
                    <form action={updatePermissionsAction} className="border-t border-neutral-50 bg-neutral-50 px-5 py-3">
                      <input type="hidden" name="id" value={u.id} />
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        Permissions
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {PERMISSION_MODULES.map(m => (
                          <label
                            key={m.key}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-amber-400 transition has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 has-[:checked]:text-amber-800"
                          >
                            <input
                              type="checkbox"
                              name="permissions"
                              value={m.key}
                              defaultChecked={u.permissions.includes(m.key)}
                              className="accent-amber-500"
                            />
                            {m.label}
                          </label>
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-black text-white hover:bg-amber-600 transition"
                      >
                        บันทึก Permissions
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add form */}
        <div>
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-neutral-500">
            เพิ่ม Account ใหม่
          </h2>
          <form action={createAdminUserAction} className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={LABEL}>ชื่อ (optional)</label>
                <input name="name" placeholder="เช่น Clerk 1" className={INPUT} />
              </div>
              <div className="w-32">
                <label className={LABEL}>Role *</label>
                <select name="role" required className={INPUT}>
                  <option value="clerk">clerk</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Email *</label>
              <input name="email" type="email" required placeholder="clerk@example.com" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Password * (min 8 ตัวอักษร)</label>
              <input name="password" type="password" required minLength={8} placeholder="••••••••" className={INPUT} />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-black px-5 py-2.5 text-xs font-black text-white hover:bg-neutral-800 transition"
            >
              เพิ่ม Account
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}
