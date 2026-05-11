import Link from 'next/link'
import Image from 'next/image'
import AddToCartButton from '@/components/cart/AddToCartButton'
import FreeDownloadButton from '@/components/templates/FreeDownloadButton'

export interface FeaturedTemplate {
  id: string
  slug: string
  title: string
  tier: string
  preview_path: string | null
  category_name: string | null
  category_emoji: string | null
}

export default function FeaturedTemplateCard({ template }: { template: FeaturedTemplate }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
      <p className="px-3 pt-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-amber-500">
        ✨ แนะนำสัปดาห์นี้
      </p>

      <Link href={`/templates/${template.slug}`} className="block mx-3 rounded-xl overflow-hidden bg-amber-50">
        <div className="relative h-24">
          {template.preview_path ? (
            <Image
              src={template.preview_path}
              alt={template.title}
              fill
              className="object-cover"
              sizes="140px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl">📄</div>
          )}
        </div>
      </Link>

      <div className="px-3 pt-2 pb-3 space-y-1.5">
        <p className="text-xs font-black text-neutral-900 leading-snug line-clamp-2">{template.title}</p>
        {template.category_emoji && (
          <p className="text-[10px] text-neutral-400">
            {template.category_emoji} {template.category_name}
          </p>
        )}
        <div className="pt-0.5">
          {template.tier === 'free' ? (
            <FreeDownloadButton
              templateId={template.id}
              label="รับฟรี"
              className="w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60 transition"
            />
          ) : (
            <AddToCartButton
              templateId={template.id}
              className="w-full rounded-lg bg-amber-500 py-1.5 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60 transition"
            />
          )}
        </div>
      </div>
    </div>
  )
}
