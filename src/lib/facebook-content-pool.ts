// POSTLIVE-30.1 — Facebook content pool
// Priority: campaign (date-aware) → product (image) → tip (always available)
// Coupons deferred until DB is populated.

import { db } from '@/lib/db'
import { getCampaignContext } from '@/lib/campaign-context'
import { detectActiveCampaign } from '@/lib/campaign-detector'

export type FbContentType = 'tip' | 'campaign' | 'product' | 'coupon'

export interface FbContent {
  type: FbContentType
  caption: string
  imageUrl?: string
  productId?: string
}

// ---------------------------------------------------------------------------
// Tip pool — pre-written, no DB needed
// ---------------------------------------------------------------------------

const TIP_POOL = [
  {
    title: 'รู้ไหม? คูปองส่งฟรี + คูปองร้าน ใช้พร้อมกันได้',
    body: 'ตอน checkout กด "ส่วนลด" → ใส่คูปองร้านก่อน แล้วเลือกคูปองส่งฟรีเพิ่ม\nลดได้สองชั้นโดยไม่ต้องเลือกอย่างใดอย่างหนึ่ง!',
  },
  {
    title: 'Flash Sale Shopee: เวลาทองที่ต้องรู้',
    body: 'Flash Sale รีเฟรชทุก 00:00 / 12:00 / 18:00 น.\nของถูกหมดเร็ว — เซ็ตนาฬิกาปลุกให้ทัน!',
  },
  {
    title: 'Payday Sale: ซื้อวันไหนได้ส่วนลดสูงสุด?',
    body: 'ทุกวันที่ 25 ของเดือน — Shopee & Lazada แจกคูปองพิเศษ Payday\nวางแผนล่วงหน้า เพิ่ม wishlist ไว้รอได้เลย!',
  },
  {
    title: 'LazCoins แลกได้เลย อย่าทิ้งไว้',
    body: 'Lazada → หน้า "Me" → LazCoins\nแลก 100 Coins = ลด ฿1 บาท — เช็คทุกวันก่อนสั่งซื้อ!',
  },
  {
    title: 'เพิ่มสินค้าใน Cart แล้วรอ — Shopee ส่งโค้ดให้เอง',
    body: 'เทคนิคลับ: เพิ่มสินค้าลง cart แล้วออกแอปโดยไม่สั่ง\nบางครั้ง Shopee ส่งโค้ดส่วนลด 10–20% ให้อัตโนมัติ!',
  },
  {
    title: 'คูปองธนาคาร — ลดได้อีกชั้น แม้ใช้คูปองอื่นแล้ว',
    body: 'KBank / SCB / Krungthai มีโปรเฉพาะบัตร\nใช้ได้พร้อมคูปองร้าน + คูปองส่งฟรี = ลด 3 ชั้นในออเดอร์เดียว!',
  },
  {
    title: 'วิธีดู Flash Deal ล่วงหน้า Shopee',
    body: 'เปิดแอป → กด Flash Sale → "กำลังจะมา"\nกด ♡ จองสินค้าไว้ก่อน — ถึงเวลากดซื้อได้ทันที!',
  },
  {
    title: 'Shopee Pay Cashback — จ่ายแล้วได้คืน',
    body: 'จ่ายด้วย Shopee Pay → รับ ShopeePay Coins คืนทุกออเดอร์\nสะสมไว้ใช้หักเงินรอบถัดไปได้เลย!',
  },
  {
    title: 'เปรียบราคาสินค้าเดียวกัน หลายร้าน ก่อนกดซื้อ',
    body: 'ก่อนกดซื้อ เช็ค 3 จุด:\n✓ ราคา Shopee vs Lazada\n✓ ค่าส่ง + คูปองส่งฟรี\n✓ คะแนนผู้ขาย (ควรเกิน 4.5)',
  },
  {
    title: 'Voucher Center Lazada — กดทุกวัน ได้ทุกวัน',
    body: 'เปิด Lazada → แตะ "Voucher" ด้านบน → กด Collect ทุกใบที่เห็น\nคูปองฟรี ไม่ต้องซื้อก่อน — กดสะสมไว้เลย!',
  },
  {
    title: 'ซื้อเป็นชุด ถูกกว่า — อย่าลืมดู Bundle Deal',
    body: 'Shopee & Lazada มีโปร "ซื้อ 2 ลด X" บ่อยมาก\nถ้าชอบสินค้าแล้ว ซื้อพร้อมกันทีเดียว — ประหยัดกว่าแน่นอน!',
  },
  {
    title: 'ตรวจ Shopee Coins ก่อนสั่ง — หมดอายุได้นะ',
    body: 'Shopee Coins และ LazCoins หมดอายุได้!\nเช็คก่อนทุกครั้งก่อนกดสั่ง — อย่าให้ Coins หายฟรีๆ',
  },
  {
    title: 'สั่งก่อนแมดไนท์ รับของเร็วกว่า 1 วัน',
    body: 'สั่งก่อน 24:00 น. — คลังส่งของรอบเช้าถัดไป\nได้ของเร็วกว่า และบางร้านมีโปรพิเศษสำหรับออเดอร์กลางคืน',
  },
  {
    title: 'โค้ดวันเกิด — อย่าลืมเช็ค inbox',
    body: 'Shopee & Lazada ส่งโค้ดวันเกิดให้ทาง email/notification\nลด 10–50% ใช้ได้ 7 วัน — เช็ค inbox ให้ดีนะ!',
  },
  {
    title: 'ลองกดติดตามร้านที่ชอบใน Shopee',
    body: 'กด "ติดตาม" ร้านในแอป Shopee → รับ notification เมื่อมีโปรโมชั่น\nร้านดังมักแจกโค้ดเฉพาะ follower ก่อนใคร!',
  },
  {
    title: 'รีวิวสินค้าหลังได้รับ — ได้ Coins คืน',
    body: 'รีวิวพร้อมรูปใน Shopee → รับ Coins เพิ่ม\nสินค้าถัดไปลดได้อีก และช่วยคนอื่นตัดสินใจด้วย!',
  },
]

export function getDailyTip(dayOfYear: number, lineOaId: string): FbContent {
  const tip = TIP_POOL[dayOfYear % TIP_POOL.length]
  const lineLink = `https://line.me/R/ti/p/${lineOaId}`
  return {
    type: 'tip',
    caption: [
      `💡 ${tip.title}`,
      '',
      tip.body,
      '',
      '👉 ดูคูปองเด็ดวันนี้: https://couponkum.com/wallet',
      `💬 ติดตามทาง LINE: ${lineLink}`,
    ].join('\n'),
  }
}

// Day of year (1–366) in ICT timezone
export function getDayOfYear(now: Date): number {
  const ict = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const start = new Date(ict.getFullYear(), 0, 0)
  return Math.floor((ict.getTime() - start.getTime()) / 86_400_000)
}

// ---------------------------------------------------------------------------
// Campaign content — auto-detect payday / double day
// ---------------------------------------------------------------------------

export function getCampaignContent(now: Date, lineOaId: string): FbContent | null {
  const ict      = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const active   = detectActiveCampaign(ict)
  const ctx      = getCampaignContext(ict)
  const lineLink = `https://line.me/R/ti/p/${lineOaId}`
  const wallet   = 'https://couponkum.com/wallet'

  if (active?.active) {
    return {
      type: 'campaign',
      caption: [
        `🔥 ${active.label} มาแล้ว!`,
        '',
        'วันนี้แพลตฟอร์มแจกคูปองพิเศษ — เก็บก่อนหมด',
        `🛒 ดูดีลทั้งหมด: ${wallet}`,
        '',
        `💬 รับโค้ดลับทาง LINE: ${lineLink}`,
      ].join('\n'),
    }
  }

  if (ctx.type === 'double_date' || ctx.type === 'payday') {
    return {
      type: 'campaign',
      caption: [
        `📅 ${ctx.label}`,
        '',
        ctx.type === 'payday'
          ? 'เตรียม wishlist ไว้เลย — คูปอง Payday จะออกเร็วๆ นี้!'
          : 'เพิ่มสินค้าใน cart รอไว้ — คูปองสูงสุดปล่อยตอนเที่ยงคืน',
        `🎯 ดูดีล: ${wallet}`,
        '',
        `💬 รับแจ้งเตือนทาง LINE: ${lineLink}`,
      ].join('\n'),
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Product content — with image from products table
// ---------------------------------------------------------------------------

interface ProductRow {
  id: string
  name: string
  platform: string
  price_current: number
  image_url: string
  affiliate_url: string | null
}

export async function getProductContent(
  lineOaId: string,
  postedProductIds: string[],
): Promise<FbContent | null> {
  const excludeClause = postedProductIds.length > 0
    ? postedProductIds
    : ['00000000-0000-0000-0000-000000000000'] // dummy to keep SQL valid

  const rows = await db<ProductRow[]>`
    SELECT id, name, platform, price_current, image_url, affiliate_url
    FROM products
    WHERE is_active = true
      AND image_url IS NOT NULL AND image_url != ''
      AND id != ALL(${excludeClause}::uuid[])
    ORDER BY sold_count DESC NULLS LAST, rating DESC NULLS LAST
    LIMIT 10
  `.catch(() => [] as ProductRow[])

  if (!rows.length) return null

  // Pick random from top 10 to add variety
  const product = rows[Math.floor(Math.random() * rows.length)]

  const platform = product.platform === 'shopee' ? 'Shopee' :
                   product.platform === 'lazada'  ? 'Lazada' : product.platform
  const lineLink   = `https://line.me/R/ti/p/${lineOaId}`
  const productUrl = product.affiliate_url ?? 'https://couponkum.com/wallet'

  return {
    type: 'product',
    imageUrl: product.image_url,
    productId: product.id,
    caption: [
      `🛍️ สินค้าแนะนำจาก ${platform}`,
      '',
      `📌 ${product.name}`,
      `💰 ราคา: ฿${Number(product.price_current).toLocaleString('th-TH')}`,
      '',
      `🔗 ดูสินค้า: ${productUrl}`,
      `💬 ติดตามโปรเพิ่มเติมทาง LINE: ${lineLink}`,
    ].join('\n'),
  }
}

// ---------------------------------------------------------------------------
// Master picker — campaign > product > tip
// ---------------------------------------------------------------------------

export async function pickContent(
  now: Date,
  lineOaId: string,
  alreadyPostedCampaignToday: boolean,
  postedProductIds: string[],
): Promise<FbContent> {
  if (!alreadyPostedCampaignToday) {
    const campaign = getCampaignContent(now, lineOaId)
    if (campaign) return campaign
  }

  const product = await getProductContent(lineOaId, postedProductIds)
  if (product) return product

  return getDailyTip(getDayOfYear(now), lineOaId)
}
