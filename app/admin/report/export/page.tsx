import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OrderExportPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; status?: string }>
}) {
  const sp = await searchParams
  const params = new URLSearchParams()
  if (sp.range)  params.set('range',  sp.range)
  if (sp.from)   params.set('from',   sp.from)
  if (sp.to)     params.set('to',     sp.to)
  if (sp.status) params.set('status', sp.status)
  const qs = params.toString()
  redirect(`/admin/report/payments${qs ? `?${qs}` : ''}`)
}
