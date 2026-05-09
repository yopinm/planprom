// app/admin/templates/new/page.tsx — V15-ADMIN-3 Template creation wizard
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { WizardClient } from './WizardClient'
import type { Category, CloneSource } from './WizardClient'

export const metadata: Metadata = {
  title: 'New Template Wizard — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function NewTemplatePage() {
  await requireAdminSession('/admin/login')

  const [categories, cloneSources] = await Promise.all([
    db<Category[]>`SELECT slug, name, emoji FROM template_categories ORDER BY sort_order`.catch(() => [] as Category[]),
    db<CloneSource[]>`SELECT id, slug, title, tier, description FROM templates WHERE status = 'published' ORDER BY title`.catch(() => [] as CloneSource[]),
  ])

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="border-b border-neutral-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <Link href="/admin/templates" className="text-xs font-bold text-neutral-400 hover:text-black">← Template Manager</Link>
            <h1 className="mt-0.5 text-lg font-black text-black">New Template Wizard</h1>
          </div>
        </div>
      </div>

      <WizardClient categories={categories} cloneSources={cloneSources} />
    </main>
  )
}
