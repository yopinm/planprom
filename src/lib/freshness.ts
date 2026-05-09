import type { Coupon, Product } from '@/types'

export type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'unknown'

export interface FreshnessInfo {
  status: FreshnessStatus
  checkedAt: string | null
  ageMinutes: number | null
  source: 'verified' | 'unknown'
  mobileLabel: string
  desktopLabel: string
  badgeLabel: string
  isReliable: boolean
}

const FRESH_MINUTES = 24 * 60   // 🟢 <24h
const STALE_MINUTES = 72 * 60   // 🟡 24-72h → 🔴 >72h (3d)

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getAgeMinutes(checkedAt: Date, referenceDate: Date): number {
  const diffMs = Math.max(0, referenceDate.getTime() - checkedAt.getTime())
  return Math.floor(diffMs / 60_000)
}

function getStatus(ageMinutes: number | null): FreshnessStatus {
  if (ageMinutes === null) return 'unknown'
  if (ageMinutes <= FRESH_MINUTES) return 'fresh'
  if (ageMinutes <= STALE_MINUTES) return 'aging'
  return 'stale'
}

function formatRelative(ageMinutes: number | null): string {
  if (ageMinutes === null) return 'ไม่ทราบเวลาอัปเดต'
  if (ageMinutes < 1) return 'เมื่อสักครู่'
  if (ageMinutes < 60) return `${ageMinutes} นาทีที่แล้ว`

  const hours = Math.floor(ageMinutes / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`

  const days = Math.floor(hours / 24)
  return `${days} วันที่แล้ว`
}

function formatTime(checkedAt: Date | null): string {
  if (!checkedAt) return 'ไม่ทราบเวลาอัปเดต'
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  }).format(checkedAt)
}

function getBadgeLabel(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':   return '🟢 ข้อมูลสด'
    case 'aging':   return '🟡 เช็กล่าสุด'
    case 'stale':   return '🔴 เกิน 3 วัน'
    case 'unknown': return '⚪ ไม่ทราบเวลา'
  }
}

function getPrefixLabel(source: FreshnessInfo['source']): string {
  return source === 'verified'
    ? 'ยืนยันล่าสุด'
    : 'ยังไม่มีเวลาเช็กยืนยัน'
}

export function getProductFreshnessTimestamp(product: Product): string | null {
  return product.price_checked_at ?? null
}

export function getCouponFreshnessTimestamp(coupon: Coupon): string | null {
  return coupon.source_checked_at ?? null
}

export function getFreshnessInfo(
  checkedAtValue: string | null | undefined,
  referenceDate: Date,
): FreshnessInfo {
  const checkedAt = parseDate(checkedAtValue)
  const ageMinutes = checkedAt ? getAgeMinutes(checkedAt, referenceDate) : null
  const status = getStatus(ageMinutes)
  const source: FreshnessInfo['source'] = checkedAt ? 'verified' : 'unknown'
  const prefix = getPrefixLabel(source)

  return {
    status,
    checkedAt: checkedAt?.toISOString() ?? null,
    ageMinutes,
    source,
    mobileLabel: `${prefix}: ${formatRelative(ageMinutes)}`,
    desktopLabel: `${prefix}: ${formatTime(checkedAt)}`,
    badgeLabel: getBadgeLabel(status),
    isReliable: status === 'fresh' || status === 'aging',
  }
}

export function getLatestTimestamp(values: Array<string | null | undefined>): string | null {
  let latest: Date | null = null

  for (const value of values) {
    const parsed = parseDate(value)
    if (!parsed) continue
    if (!latest || parsed.getTime() > latest.getTime()) latest = parsed
  }

  return latest?.toISOString() ?? null
}
