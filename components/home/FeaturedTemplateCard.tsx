import Link from 'next/link'
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
    <div className="rounded-xl border border-amber-200 bg-white px-5 py-4 shadow-sm transition hover:border-amber-400 hover:shadow-md">
      <p className="text-sm font-black text-amber-500 mb-3">
        ✨ แนะนำสัปดาห์นี้
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {/* Title */}
        <p className="font-black text-neutral-900 text-sm flex-1 min-w-0 truncate">
          {template.title}
        </p>

        {/* Category */}
        {template.category_emoji && (
          <span className="shrink-0 text-xs text-neutral-400">
            {template.category_emoji} {template.category_name}
          </span>
        )}

        {/* Preview button */}
        <Link
          href={`/templates/${template.slug}`}
          className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:border-neutral-400"
        >
          ดูพรีวิวสินค้า
        </Link>

        {/* Add to cart / free download */}
        {template.tier === 'free' ? (
          <FreeDownloadButton
            templateId={template.id}
            label="รับฟรี"
            className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60 transition"
          />
        ) : (
          <AddToCartButton
            templateId={template.id}
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60 transition"
          />
        )}
      </div>
    </div>
  )
}
