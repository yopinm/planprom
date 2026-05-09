import type { ReactElement } from 'react'
import { createAdminClient } from '@/lib/supabase/server'

interface StaleProductRow {
  id: string
  name: string | null
  platform: string | null
  price_checked_at: string | null
}

interface StaleCouponRow {
  id: string
  title: string | null
  code: string | null
  platform: string | null
  source_checked_at: string | null
}

interface BrokenLinkRow {
  product_id: string
  target_url: string
  status: number | null
  checked_at: string | null
}

interface DealQualityData {
  staleProducts: StaleProductRow[]
  staleProductCount: number
  staleCoupons: StaleCouponRow[]
  staleCouponCount: number
  brokenLinks: BrokenLinkRow[]
  brokenLinkCount: number
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('th-TH', {
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute: '2-digit',
  })
}

function cutoffIso(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
}

async function fetchDealQualityData(): Promise<DealQualityData> {
  try {
    const supabase = createAdminClient()
    const staleCutoff = cutoffIso()

    const [
      staleProductsResult,
      staleProductCountResult,
      staleCouponsResult,
      staleCouponCountResult,
      brokenLinksResult,
      brokenLinkCountResult,
    ] = await Promise.all([
      supabase
        .from('products')
        .select('id,name,platform,price_checked_at')
        .lt('price_checked_at', staleCutoff)
        .order('price_checked_at', { ascending: false })
        .limit(5),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .lt('price_checked_at', staleCutoff),
      supabase
        .from('coupons')
        .select('id,title,code,platform,source_checked_at')
        .lt('source_checked_at', staleCutoff)
        .order('source_checked_at', { ascending: false })
        .limit(5),
      supabase
        .from('coupons')
        .select('id', { count: 'exact', head: true })
        .lt('source_checked_at', staleCutoff),
      supabase
        .from('product_link_checks')
        .select('product_id,target_url,status,checked_at')
        .eq('ok', false)
        .order('checked_at', { ascending: false })
        .limit(5),
      supabase
        .from('product_link_checks')
        .select('product_id', { count: 'exact', head: true })
        .eq('ok', false),
    ])

    return {
      staleProducts: staleProductsResult.error ? [] : (staleProductsResult.data ?? []) as StaleProductRow[],
      staleProductCount: staleProductCountResult.count ?? 0,
      staleCoupons: staleCouponsResult.error ? [] : (staleCouponsResult.data ?? []) as StaleCouponRow[],
      staleCouponCount: staleCouponCountResult.count ?? 0,
      brokenLinks: brokenLinksResult.error ? [] : (brokenLinksResult.data ?? []) as BrokenLinkRow[],
      brokenLinkCount: brokenLinkCountResult.count ?? 0,
    }
  } catch {
    return {
      staleProducts: [],
      staleProductCount: 0,
      staleCoupons: [],
      staleCouponCount: 0,
      brokenLinks: [],
      brokenLinkCount: 0,
    }
  }
}

function QualityList({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactElement | ReactElement[]
}): ReactElement {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-black text-neutral-700">{title}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-neutral-600">
          {count.toLocaleString('th-TH')}
        </span>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  )
}

function EmptyRow(): ReactElement {
  return <p className="py-3 text-center text-[11px] text-neutral-400">No data</p>
}

export async function DealQualityReport(): Promise<ReactElement> {
  const data = await fetchDealQualityData()

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-neutral-800">Daily Deal Quality Report (POSTLIVE-05)</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Stale products, stale coupons, and broken product links
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-600">
          24h freshness
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <QualityList title="Stale products" count={data.staleProductCount}>
          {data.staleProducts.length === 0 ? <EmptyRow /> : data.staleProducts.map(row => (
            <div key={row.id} className="border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
              <p className="truncate text-[11px] font-black text-neutral-800">{row.name ?? row.id}</p>
              <p className="mt-0.5 text-[10px] text-neutral-400">
                {row.platform ?? 'unknown'} / {formatDate(row.price_checked_at)}
              </p>
            </div>
          ))}
        </QualityList>

        <QualityList title="Stale coupons" count={data.staleCouponCount}>
          {data.staleCoupons.length === 0 ? <EmptyRow /> : data.staleCoupons.map(row => (
            <div key={row.id} className="border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
              <p className="truncate text-[11px] font-black text-neutral-800">
                {row.title ?? row.code ?? row.id}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-400">
                {row.platform ?? 'all'} / {formatDate(row.source_checked_at)}
              </p>
            </div>
          ))}
        </QualityList>

        <QualityList title="Broken links" count={data.brokenLinkCount}>
          {data.brokenLinks.length === 0 ? <EmptyRow /> : data.brokenLinks.map(row => (
            <div key={row.product_id} className="border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
              <p className="truncate text-[11px] font-black text-neutral-800">{row.target_url}</p>
              <p className="mt-0.5 text-[10px] text-neutral-400">
                HTTP {row.status ?? '-'} / {formatDate(row.checked_at)}
              </p>
            </div>
          ))}
        </QualityList>
      </div>
    </section>
  )
}
