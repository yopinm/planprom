import { checkUrl, type HealthResult } from '@/lib/link-health'

export interface LinkCheckProduct {
  id: string
  url: string
  affiliate_url: string | null
}

export interface ProductLinkCheckResult {
  product_id: string
  target_url: string
  ok: boolean
  status: number
  final_url: string | null
  checked_at: string
}

export interface ProductLinkScanReport {
  scanned: number
  alive: number
  dead: number
  generated_at: string
  results: ProductLinkCheckResult[]
}

export function getProductLinkTarget(product: LinkCheckProduct): string {
  return product.affiliate_url ?? product.url
}

export function toProductLinkCheckResult(
  product: LinkCheckProduct,
  health: HealthResult,
): ProductLinkCheckResult {
  return {
    product_id: product.id,
    target_url: health.url,
    ok:         health.ok,
    status:     health.status,
    final_url:  health.final_url ?? null,
    checked_at: health.checked_at,
  }
}

export function summarizeProductLinkChecks(
  results: ProductLinkCheckResult[],
  generatedAt: Date = new Date(),
): ProductLinkScanReport {
  const alive = results.filter(result => result.ok).length
  const dead = results.length - alive

  return {
    scanned:      results.length,
    alive,
    dead,
    generated_at: generatedAt.toISOString(),
    results,
  }
}

export async function scanProductLinks(
  products: LinkCheckProduct[],
): Promise<ProductLinkScanReport> {
  const results = await Promise.all(
    products.map(async product => {
      const health = await checkUrl(getProductLinkTarget(product))
      return toProductLinkCheckResult(product, health)
    }),
  )

  return summarizeProductLinkChecks(results)
}
