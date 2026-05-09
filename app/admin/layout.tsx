import { Suspense } from 'react'
import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={null}>
        <AdminNav />
      </Suspense>
      {children}
    </div>
  )
}
