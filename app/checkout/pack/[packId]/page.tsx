// /checkout/pack/[packId] — pack info + checkout (login required only at payment step)
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PACKS } from '@/lib/packs'
import CheckoutPackClient from './CheckoutPackClient'

interface Props { params: Promise<{ packId: string }> }

export default async function CheckoutPackPage({ params }: Props) {
  const { packId } = await params
  const pack = PACKS.find(p => p.id === packId)
  if (!pack) redirect('/templates')

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Pass isLoggedIn to client — login is required only when the user clicks "ชำระเงิน"
  return (
    <CheckoutPackClient
      pack={{ id: pack.id, price: pack.price, count: pack.count, label: pack.label, perItem: pack.perItem }}
      isLoggedIn={!!user}
    />
  )
}
