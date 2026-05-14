import { Suspense } from 'react'
import { AdminNav } from '@/components/admin/AdminNav'
import { getAdminRole } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getAdminRole()

  return (
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={null}>
        <AdminNav role={role} />
      </Suspense>
      {children}
    </div>
  )
}
