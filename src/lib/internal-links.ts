// src/lib/internal-links.ts — TASK 3.10 Internal Linking Graph
//
// Computes contextually relevant internal links for each page type.
// Used by RelatedLinks component to add SEO cross-links between pages.

import { KEYWORD_CLUSTERS } from '@/lib/seo-keywords'

export interface InternalLink {
  href:  string
  label: string
  desc?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLATFORM_LABEL: Record<string, string> = {
  shopee: 'Shopee',
  lazada: 'Lazada',
}

// All Tier-2 category clusters → /deals/[platform]/[category]
const CATEGORY_CLUSTERS = KEYWORD_CLUSTERS.filter(
  c => c.tier === 2 && c.targetUrlPattern.startsWith('/deals/'),
)

// ---------------------------------------------------------------------------
// Product page links
// product page → coupon page (same platform) + category deals + compare
// ---------------------------------------------------------------------------

export function getProductPageLinks(
  platform: string,
  category: string | null,
): InternalLink[] {
  const links: InternalLink[] = []
  const platLabel = PLATFORM_LABEL[platform] ?? platform

  // Coupon page for this platform
  if (platform === 'shopee' || platform === 'lazada') {
    links.push({
      href:  `/coupon/${platform}`,
      label: `คูปอง ${platLabel} ล่าสุด`,
      desc:  `รวมโค้ดส่วนลด ${platLabel} อัปเดตทุกวัน`,
    })
  }

  // Category deals page if category matches
  if (category) {
    const catCluster = CATEGORY_CLUSTERS.find(
      c => c.category === category &&
           (c.platform === platform || c.platform === 'both'),
    )
    if (catCluster) {
      links.push({
        href:  catCluster.targetUrlPattern,
        label: `ดีล ${category} ราคาดีสุด`,
        desc:  `สินค้าหมวด ${category} พร้อมคูปองส่วนลด`,
      })
    }
  }

  // Compare page
  links.push({
    href:  '/compare',
    label: 'เปรียบราคา Shopee vs Lazada',
    desc:  'หาที่ถูกสุดพร้อมหักคูปองอัตโนมัติ',
  })

  // Other platform coupon
  if (platform === 'shopee' || platform === 'lazada') {
    const otherPlatform = platform === 'shopee' ? 'lazada' : 'shopee'
    links.push({
      href:  `/coupon/${otherPlatform}`,
      label: `คูปอง ${PLATFORM_LABEL[otherPlatform]} ด้วย`,
      desc:  `เปรียบกับโค้ดส่วนลด ${PLATFORM_LABEL[otherPlatform]}`,
    })
  }

  return links
}

// ---------------------------------------------------------------------------
// Platform coupon page links (/coupon/shopee, /coupon/lazada)
// → category deals (same platform) + compare + other platform
// ---------------------------------------------------------------------------

export function getPlatformCouponPageLinks(
  platform: 'shopee' | 'lazada',
): InternalLink[] {
  const links: InternalLink[] = []
  const platLabel = PLATFORM_LABEL[platform] ?? platform

  // Top category clusters for this platform (max 4)
  const catLinks = CATEGORY_CLUSTERS
    .filter(c => c.platform === platform || c.platform === 'both')
    .slice(0, 4)
    .map(c => ({
      href:  c.targetUrlPattern,
      label: `ดีล ${c.category} ${platLabel}`,
      desc:  `สินค้าหมวด ${c.category} บน ${platLabel}`,
    }))

  links.push(...catLinks)

  // Compare
  links.push({
    href:  '/compare',
    label: 'เปรียบราคา Shopee vs Lazada',
    desc:  'หาที่ถูกสุดพร้อมหักคูปองอัตโนมัติ',
  })

  // Other platform
  const other = platform === 'shopee' ? 'lazada' : 'shopee'
  links.push({
    href:  `/coupon/${other}`,
    label: `คูปอง ${PLATFORM_LABEL[other]}`,
    desc:  `โค้ดส่วนลด ${PLATFORM_LABEL[other]} ล่าสุด`,
  })

  return links
}

// ---------------------------------------------------------------------------
// Category deals page links (/deals/[platform]/[category])
// → coupon page (same platform) + sibling categories + compare
// ---------------------------------------------------------------------------

export function getCategoryDealsPageLinks(
  platform: string,
  category: string,
): InternalLink[] {
  const links: InternalLink[] = []
  const platLabel = PLATFORM_LABEL[platform] ?? platform

  // Coupon page for this platform
  if (platform === 'shopee' || platform === 'lazada') {
    links.push({
      href:  `/coupon/${platform}`,
      label: `คูปอง ${platLabel} ทั้งหมด`,
      desc:  `รวมโค้ดส่วนลด ${platLabel} อัปเดตทุกวัน`,
    })
  }

  // Sibling categories (same platform, different category, max 3)
  const siblings = CATEGORY_CLUSTERS
    .filter(
      c => c.category !== category &&
           (c.platform === platform || c.platform === 'both'),
    )
    .slice(0, 3)
    .map(c => ({
      href:  c.targetUrlPattern,
      label: `ดีล ${c.category}`,
      desc:  `สินค้าหมวด ${c.category} ราคาดี`,
    }))

  links.push(...siblings)

  // Compare
  links.push({
    href:  '/compare',
    label: 'เปรียบราคา Shopee vs Lazada',
    desc:  'หาที่ถูกสุดพร้อมหักคูปองอัตโนมัติ',
  })

  return links
}
