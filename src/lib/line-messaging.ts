// WALLET-LINE-1: LINE Messaging API helpers
// Reply API (free) + Push API (quota-limited, used for daily deal alerts — POSTLIVE-15)

import { createHmac } from 'crypto'

const REPLY_ENDPOINT = 'https://api.line.me/v2/bot/message/reply'
const PUSH_ENDPOINT  = 'https://api.line.me/v2/bot/message/push'

// LINE signature: base64(HMAC-SHA256(channelSecret, rawBody))
export function verifyLineSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('base64')
  return expected === signature
}

export interface LineTextMessage {
  type: 'text'
  text: string
}

export async function replyLine(replyToken: string, messages: LineTextMessage[]): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return

  await fetch(REPLY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
}

/** Push a message to a single LINE user (uses monthly quota). */
export async function pushLine(
  lineUid: string,
  messages: LineTextMessage[],
): Promise<{ ok: boolean; status: number }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return { ok: false, status: 503 }

  const res = await fetch(PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ to: lineUid, messages }),
  })
  return { ok: res.ok, status: res.status }
}

export function formatCouponMessage(coupon: {
  title: string
  platform: string
  discountValue: number
  discountType: string
  code: string
  expireAt: string | null
}): string {
  const discount =
    coupon.discountType === 'percent'  ? `ลด ${coupon.discountValue}%` :
    coupon.discountType === 'cashback' ? `คืน ${coupon.discountValue}%` :
    coupon.discountType === 'fixed'    ? `ลด ฿${coupon.discountValue.toLocaleString('th-TH')}` :
    'ฟรีค่าส่ง'

  const platform = coupon.platform === 'shopee' ? 'Shopee' :
                   coupon.platform === 'lazada'  ? 'Lazada' : coupon.platform

  const expire = coupon.expireAt
    ? `⏰ หมด: ${new Date(coupon.expireAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}`
    : '⏰ ไม่จำกัดเวลา'

  return [
    '🎁 คูปองเด็ดวันนี้จาก คูปองคุ้ม!',
    '',
    `📌 ${coupon.title}`,
    `🏪 ${platform}  ·  💰 ${discount}`,
    `🔑 โค้ด: ${coupon.code}`,
    expire,
    '',
    '👉 ดูคูปองเพิ่มเติม: https://couponkum.com/wallet',
  ].join('\n')
}

export function formatDealMessage(deal: {
  name: string
  platform: string
  priceOriginal: number
  priceNet: number
  couponCode: string | null
  productUrl: string
}): string {
  const platform = deal.platform === 'shopee' ? 'Shopee' :
                   deal.platform === 'lazada'  ? 'Lazada' : deal.platform
  const saved = deal.priceOriginal - deal.priceNet
  const pct   = deal.priceOriginal > 0 ? Math.round((saved / deal.priceOriginal) * 100) : 0

  const lines = [
    '🔥 ดีลเด็ดวันนี้จาก คูปองคุ้ม!',
    '',
    `📦 ${deal.name}`,
    `🏪 ${platform}`,
    `💰 ราคาสุทธิ ฿${deal.priceNet.toLocaleString('th-TH')} (ลด ${pct}%)`,
  ]
  if (deal.couponCode) lines.push(`🎟️ โค้ด: ${deal.couponCode}`)
  lines.push('', `👉 ดูดีลนี้: https://couponkum.com`)
  return lines.join('\n')
}

export function welcomeMessage(): string {
  return [
    '👋 สวัสดี! ยินดีต้อนรับสู่ คูปองคุ้ม',
    '',
    'พิมพ์ "คูปอง" เพื่อรับโค้ดส่วนลดล่าสุดได้เลย',
    'หรือ ดูคูปองทั้งหมดที่: https://couponkum.com/wallet',
  ].join('\n')
}
