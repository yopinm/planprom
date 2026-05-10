// /checkout/[slug] — deprecated direct flow, redirect to cart flow
import { redirect } from 'next/navigation'

interface Props { params: Promise<{ slug: string }> }

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params
  redirect(`/api/cart/quick-add?slug=${encodeURIComponent(slug)}`)
}
