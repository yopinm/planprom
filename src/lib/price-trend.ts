import type { PriceHistory } from '@/types'

export type PriceTrendDirection = 'down' | 'up' | 'flat' | 'unknown'

export interface PriceTrendPoint {
  price: number
  captured_at: string
}

export interface PriceTrendSummary {
  points: PriceTrendPoint[]
  count: number
  currentPrice: number
  firstPrice: number
  latestHistoryPrice: number
  minPrice: number
  maxPrice: number
  averagePrice: number
  changeAmount: number
  changePercent: number
  direction: PriceTrendDirection
  isCurrentLow: boolean
  generatedAt: string
}

export interface SparklinePoint {
  x: number
  y: number
}

export function summarizePriceTrend(
  history: PriceTrendPoint[],
  currentPrice: number,
  generatedAt: Date = new Date(),
): PriceTrendSummary | null {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return null

  const points = history
    .filter(point => Number.isFinite(Number(point.price)) && Number(point.price) > 0)
    .map(point => ({
      price:       Number(point.price),
      captured_at: point.captured_at,
    }))
    .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime())

  if (points.length < 2) return null

  const firstPrice = points[0].price
  const latestHistoryPrice = points[points.length - 1].price
  const prices = [...points.map(point => point.price), currentPrice]
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const changeAmount = currentPrice - firstPrice
  const changePercent = firstPrice > 0 ? (changeAmount / firstPrice) * 100 : 0

  return {
    points,
    count: points.length,
    currentPrice,
    firstPrice,
    latestHistoryPrice,
    minPrice,
    maxPrice,
    averagePrice: Math.round(averagePrice * 100) / 100,
    changeAmount: Math.round(changeAmount * 100) / 100,
    changePercent: Math.round(changePercent * 10) / 10,
    direction: getTrendDirection(changePercent),
    isCurrentLow: currentPrice <= minPrice,
    generatedAt: generatedAt.toISOString(),
  }
}

export function priceHistoryRowsToTrendPoints(rows: PriceHistory[]): PriceTrendPoint[] {
  return rows.map(row => ({
    price:       Number(row.price),
    captured_at: row.captured_at,
  }))
}

export function buildSparklinePoints(
  prices: number[],
  width = 280,
  height = 72,
  padding = 6,
): SparklinePoint[] {
  const validPrices = prices.filter(price => Number.isFinite(price) && price > 0)
  if (validPrices.length === 0) return []
  if (validPrices.length === 1) return [{ x: padding, y: height / 2 }]

  const min = Math.min(...validPrices)
  const max = Math.max(...validPrices)
  const range = max - min
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2

  return validPrices.map((price, index) => {
    const x = padding + (usableWidth * index) / (validPrices.length - 1)
    const normalized = range === 0 ? 0.5 : (price - min) / range
    const y = padding + usableHeight - normalized * usableHeight
    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
    }
  })
}

function getTrendDirection(changePercent: number): PriceTrendDirection {
  if (changePercent <= -3) return 'down'
  if (changePercent >= 3) return 'up'
  return 'flat'
}
