import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { FormBuilderClient } from './FormBuilderClient'

export const metadata: Metadata = {
  title: 'Form Builder — Admin',
  robots: { index: false, follow: false },
}

export default async function FormBuilderPage() {
  await requireAdminSession()
  return <FormBuilderClient />
}
