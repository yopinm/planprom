// src/lib/json-ld.ts
// TASK 2.12 — JSON-LD Schema Markup helpers
//
// Pure functions — no DB, no side effects, safe to import anywhere.
//
// Schemas:
//   buildProductJsonLd      — Product + Offer + AggregateRating
//   buildBreadcrumbJsonLd   — BreadcrumbList
//   buildWebSiteJsonLd      — WebSite + SearchAction (for homepage)

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://couponkum.com'

// ---------------------------------------------------------------------------
// Types (minimal subset of schema.org)
// ---------------------------------------------------------------------------

export interface ProductJsonLdInput {
  id:            string
  name:          string
  description?:  string | null
  imageUrl?:     string | null
  priceCurrent:  number
  priceOriginal?: number | null
  currency:      string
  platform:      string
  shopName?:     string | null
  rating?:       number | null
  soldCount?:    number
  category?:     string | null
  url:           string
}

export interface BreadcrumbItem {
  name:     string
  href:     string
}

export interface ItemListEntry {
  id:        string
  name:      string
  imageUrl?: string | null
  price:     number
  currency:  string
}

// ---------------------------------------------------------------------------
// Product + Offer + AggregateRating
// ---------------------------------------------------------------------------

/**
 * Build a schema.org/Product JSON-LD object.
 * Includes Offer (current price) and AggregateRating when available.
 */
export function buildProductJsonLd(input: ProductJsonLdInput): object {
  const productUrl = `${BASE_URL}/product/${input.id}`

  const offer: Record<string, unknown> = {
    '@type':          'Offer',
    url:              productUrl,
    price:            input.priceCurrent.toFixed(2),
    priceCurrency:    input.currency,
    availability:     'https://schema.org/InStock',
    seller: input.shopName
      ? { '@type': 'Organization', name: input.shopName }
      : undefined,
  }

  // Include price_original as highPrice when cheaper
  if (input.priceOriginal && input.priceOriginal > input.priceCurrent) {
    offer['highPrice'] = input.priceOriginal.toFixed(2)
    offer['priceType'] = 'https://schema.org/SalePrice'
  }

  const schema: Record<string, unknown> = {
    '@context':   'https://schema.org',
    '@type':      'Product',
    name:         input.name,
    url:          productUrl,
    description:  input.description ?? `ราคาดีที่สุดสำหรับ ${input.name} บน ${input.platform}`,
    offers:       offer,
  }

  if (input.imageUrl) {
    schema['image'] = input.imageUrl
  }

  if (input.category) {
    schema['category'] = input.category
  }

  if (input.shopName) {
    schema['brand'] = { '@type': 'Brand', name: input.shopName }
  }

  // AggregateRating — only when we have meaningful rating + sold count
  if (input.rating !== null && input.rating !== undefined && (input.soldCount ?? 0) >= 5) {
    schema['aggregateRating'] = {
      '@type':       'AggregateRating',
      ratingValue:   input.rating.toFixed(1),
      bestRating:    '5',
      worstRating:   '1',
      reviewCount:   input.soldCount ?? 5,
    }
  }

  return schema
}

// ---------------------------------------------------------------------------
// ItemList (Product Carousel) — for landing pages listing multiple products
// ---------------------------------------------------------------------------

/**
 * Build a schema.org/ItemList for a product listing page (carousel rich result).
 * Each entry includes a Product + Offer so Google can show price in the carousel.
 * Use on /coupon/*, /deals/*, and similar pSEO pages.
 */
export function buildItemListJsonLd(items: ItemListEntry[]): object {
  return {
    '@context':       'https://schema.org',
    '@type':          'ItemList',
    itemListElement:  items.map((item, index) => {
      const productUrl = `${BASE_URL}/product/${item.id}`
      const listItem: Record<string, unknown> = {
        '@type':   'ListItem',
        position:  index + 1,
        item: {
          '@type':  'Product',
          name:     item.name,
          url:      productUrl,
          offers: {
            '@type':        'Offer',
            url:            productUrl,
            price:          item.price.toFixed(2),
            priceCurrency:  item.currency,
            availability:   'https://schema.org/InStock',
          },
          ...(item.imageUrl ? { image: item.imageUrl } : {}),
        },
      }
      return listItem
    }),
  }
}

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

/**
 * Build a schema.org/BreadcrumbList JSON-LD object.
 *
 * @example
 * buildBreadcrumbJsonLd([
 *   { name: 'หน้าแรก', href: '/' },
 *   { name: 'ค้นหา', href: '/search?q=iphone' },
 *   { name: 'iPhone 15', href: '/product/xyz' },
 * ])
 */
export function buildBreadcrumbJsonLd(crumbs: BreadcrumbItem[]): object {
  return {
    '@context':        'https://schema.org',
    '@type':           'BreadcrumbList',
    itemListElement:   crumbs.map((crumb, index) => ({
      '@type':  'ListItem',
      position: index + 1,
      name:     crumb.name,
      item:     crumb.href.startsWith('http')
        ? crumb.href
        : `${BASE_URL}${crumb.href}`,
    })),
  }
}

// ---------------------------------------------------------------------------
// WebSite + SearchAction (homepage only)
// ---------------------------------------------------------------------------

/**
 * Build a schema.org/WebSite JSON-LD with SearchAction for the homepage.
 * Enables Google's Sitelinks Search Box.
 */
export function buildWebSiteJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    name:       'คูปองคุ้ม',
    url:        BASE_URL,
    description: 'ค้นหาคูปองส่วนลดและเปรียบราคาสินค้าจาก Shopee, Lazada',
    inLanguage: 'th',
    potentialAction: {
      '@type':       'SearchAction',
      target:        {
        '@type':        'EntryPoint',
        urlTemplate:    `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ---------------------------------------------------------------------------
// JSON-LD script tag helper
// ---------------------------------------------------------------------------

/**
 * Serialize one or more JSON-LD objects for use in a <script> tag.
 * Pass a single object or an array for multiple schemas.
 */
export function toJsonLdString(schema: object | object[]): string {
  return JSON.stringify(schema)
}
