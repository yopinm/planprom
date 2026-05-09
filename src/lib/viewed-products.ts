// Viewed-product price tracker — POSTLIVE-29
// Stores up to MAX_ITEMS products in localStorage; preserves original price
// so we can detect when effectiveNet drops since first view.

const LS_KEY = 'ck_viewed_products'
const MAX_ITEMS = 5

export interface ViewedProduct {
  id: string
  price: number  // effectiveNet at first view
  name: string
  viewedAt: number
}

function safe<T>(fn: () => T, fallback: T): T {
  try { return fn() } catch { return fallback }
}

export function getViewedProducts(): ViewedProduct[] {
  if (typeof window === 'undefined') return []
  return safe(() => {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ViewedProduct[]
  }, [])
}

export function recordView(id: string, price: number, name: string): void {
  if (typeof window === 'undefined') return
  safe(() => {
    const items = getViewedProducts()
    const existing = items.findIndex(x => x.id === id)
    if (existing !== -1) {
      // Bring to front; preserve original price
      const [item] = items.splice(existing, 1)
      items.unshift({ ...item, viewedAt: Date.now() })
    } else {
      items.unshift({ id, price, name, viewedAt: Date.now() })
    }
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  }, undefined)
}

// Returns the stored price if it's higher than currentPrice (i.e. price dropped), else null.
export function getPriceDrop(id: string, currentPrice: number): number | null {
  const stored = getViewedProducts().find(x => x.id === id)
  if (!stored) return null
  return stored.price > currentPrice ? stored.price : null
}
