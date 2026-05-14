import { Suspense } from 'react'
import { AdminNav } from '@/components/admin/AdminNav'
import { getAdminSession } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()

  return (
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={null}>
        <AdminNav role={session?.role} permissions={session?.permissions ?? []} />
      </Suspense>
      {children}
    </div>
  )
}
