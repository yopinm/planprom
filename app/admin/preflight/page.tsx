import type { Metadata } from 'next'

import { requireAdminSession } from '@/lib/admin-auth'

import { PreflightClient } from './PreflightClient'

export const metadata: Metadata = {
  title: 'DB Preflight — Admin | คูปองคุ้ม',
  robots: { index: false, follow: false },
}

export default async function AdminPreflightPage(): Promise<React.JSX.Element> {
  await requireAdminSession('/admin/preflight')

  return <PreflightClient />
}
