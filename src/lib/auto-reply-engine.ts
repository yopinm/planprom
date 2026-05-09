// src/lib/auto-reply-engine.ts — TASK 3.20
// Auto-Reply & Engagement Booster — pure intent detection + reply generation.
// Called by the Facebook webhook handler when a comment is received on a page post.

// ---------------------------------------------------------------------------
// Intent types
// ---------------------------------------------------------------------------

export type CommentIntent =
  | 'price_inquiry'   // ถามราคา
  | 'interest'        // แสดงความสนใจ / อยากซื้อ
  | 'friend_tag'      // แท็กเพื่อน
  | 'question'        // คำถามทั่วไป
  | 'generic'         // อื่นๆ

// ---------------------------------------------------------------------------
// Intent detection (keyword matching — no AI required at this stage)
// ---------------------------------------------------------------------------

const PRICE_KEYWORDS   = ['ราคา', 'เท่าไหร่', 'เท่าไร', 'กี่บาท', 'ราคาเท่า', 'cost', 'price']
const INTEREST_KEYWORDS = ['สนใจ', 'อยากได้', 'อยากซื้อ', 'จะซื้อ', 'ขอสั่ง', 'order', 'want']
const QUESTION_KEYWORDS = ['?', '？', 'ถาม', 'ทำไม', 'อย่างไร', 'ยังไง', 'แบบไหน', 'ดีไหม', 'โอเคไหม']

/** Detect the intent of a Facebook comment message. */
export function detectIntent(message: string): CommentIntent {
  const lower = message.toLowerCase()

  if (PRICE_KEYWORDS.some(kw => lower.includes(kw)))    return 'price_inquiry'
  if (INTEREST_KEYWORDS.some(kw => lower.includes(kw))) return 'interest'
  if (/@\w/.test(message))                               return 'friend_tag'
  if (QUESTION_KEYWORDS.some(kw => lower.includes(kw))) return 'question'
  return 'generic'
}

// ---------------------------------------------------------------------------
// Reply generation
// ---------------------------------------------------------------------------

export interface ReplyInput {
  intent:      CommentIntent
  productUrl:  string
  productName: string
  price?:      number | null
}

/** Generate a Thai-language reply for the detected intent. */
export function generateReply(input: ReplyInput): string {
  const { intent, productUrl, productName, price } = input
  const priceNote = price ? ` ราคา ฿${price.toLocaleString('th-TH')}` : ''
  const link = `👉 ${productUrl}`
  const disclosure = '# โฆษณา'

  switch (intent) {
    case 'price_inquiry':
      return [
        `สวัสดีครับ! 😊 ดูราคาและคูปองล่าสุดของ ${productName}${priceNote} ได้เลยที่`,
        link,
        'คำนวณโค้ดให้อัตโนมัติ จ่ายน้อยสุดเลยครับ 💰',
        disclosure,
      ].join('\n')

    case 'interest':
      return [
        `ยินดีมากครับ! 🎉 กดดูดีลเต็มและซื้อ ${productName} ได้เลยที่`,
        link,
        disclosure,
      ].join('\n')

    case 'friend_tag':
      return [
        `ขอบคุณที่ชวนเพื่อนมาครับ! 🤝 ดูดีลนี้ด้วยกันได้เลยที่`,
        link,
        disclosure,
      ].join('\n')

    case 'question':
      return [
        `สวัสดีครับ! มีคำถามเพิ่มเติมยินดีตอบเลยนะครับ 😊`,
        `ดูรายละเอียดสินค้าและคูปองครบที่`,
        link,
        disclosure,
      ].join('\n')

    case 'generic':
    default:
      return [
        `ขอบคุณที่สนใจครับ! 🙏 ดูดีลเต็มได้ที่`,
        link,
        disclosure,
      ].join('\n')
  }
}

// ---------------------------------------------------------------------------
// Cooldown guard — prevent spam replying
// ---------------------------------------------------------------------------

/** In-memory cooldown map: commentId → replied_at (ms) */
const repliedComments = new Map<string, number>()
const COOLDOWN_MS = 60 * 60 * 1000  // 1 hour

/** Returns true if this comment has already been replied to within the cooldown window. */
export function isOnCooldown(commentId: string): boolean {
  const last = repliedComments.get(commentId)
  return last !== undefined && Date.now() - last < COOLDOWN_MS
}

/** Mark a comment as replied. */
export function markReplied(commentId: string): void {
  repliedComments.set(commentId, Date.now())
}
