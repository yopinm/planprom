// /checkout/[slug] — LINE auth gate + template fetch + credit balance → CheckoutClient
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import CheckoutClient from './CheckoutClient'

interface Props { params: Promise<{ slug: string }> }

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/api/auth/line?next=${encodeURIComponent(`/checkout/${slug}`)}`)
  }

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  const [[tmpl], [creditRow]] = await Promise.all([
    db<{
      id: string; title: string; price_baht: number; tier: string
      description: string; thumbnail_path: string | null
    }[]>`
      SELECT id, title, price_baht, tier, description, thumbnail_path
      FROM templates WHERE slug = ${slug} AND status = 'published' LIMIT 1
    `,
    db<{ available: string }[]>`
      SELECT COALESCE(SUM(total_credits - used_credits), 0) AS available
      FROM pack_credits
      WHERE customer_line_id = ${lineId}
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    `,
  ])

  if (!tmpl) redirect('/templates')

  return (
    <CheckoutClient
      templateSlug={slug}
      template={{
        id:            tmpl.id,
        title:         tmpl.title,
        priceBaht:     tmpl.price_baht,
        tier:          tmpl.tier,
        description:   tmpl.description,
        thumbnailPath: tmpl.thumbnail_path,
      }}
      creditBalance={Number(creditRow?.available ?? 0)}
    />
  )
}
