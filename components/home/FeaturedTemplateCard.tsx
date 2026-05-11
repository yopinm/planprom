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
    <div className="group rounded-xl border border-amber-200 bg-white px-4 py-4 shadow-sm transition hover:border-amber-400 hover:shadow-md">
      <p className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-2">
        ✨ แนะนำสัปดาห์นี้
      </p>
      <div className="flex items-center gap-3">
        {/* Preview thumbnail */}
        <Link href={`/templates/${template.slug}`} className="shrink-0">
          <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-amber-50">
            {template.preview_path ? (
              <Image
                src={template.preview_path}
                alt={template.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl">📄</div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-neutral-900">{template.title}</p>
          {template.category_emoji && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {template.category_emoji} {template.category_name}
            </p>
          )}
          <div className="mt-2">
            {template.tier === 'free' ? (
              <FreeDownloadButton
                templateId={template.id}
                label="รับฟรี"
                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60 transition"
              />
            ) : (
              <AddToCartButton
                templateId={template.id}
                className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60 transition"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
