// src/lib/revenue-caption-engine.ts — TASK 3.19
// Revenue Caption Engine — 4-Template Strategy (P3-Ext extension of caption-engine.ts)
//
// Templates:
//   money_pain  — Pain: จ่ายแพง / Hook: ประหยัดเงิน  (default for payday/month_start)
//   rare_fomo   — Pain: กลัวหมด / Hook: รีบก่อนหมด   (when badge=rare/low_stock)
//   timing      — Pain: โปรหมด / Hook: วันนี้วันเดียว (double_date/peak_traffic)
//   lazy_buyer  — Pain: ตัดสินใจยาก / Hook: ซื้อเลย  (high post_score, simple deal)

import { type CaptionInput, type CaptionResult, type TemplateType, formatThaiNumber } from './caption-engine'
import { getCampaignContext } from './campaign-context'
import type { CampaignType } from './campaign-context'
import type { RareItemBadge } from '@/types'

// ---------------------------------------------------------------------------
// Template selection
// ---------------------------------------------------------------------------

export interface TemplateSelectInput {
  campaignType:  CampaignType
  badge?:        RareItemBadge | null
  postScore?:    number | null
}

/**
 * Pick the highest-engagement template for a given context.
 * Priority: rare signal > time signal > financial signal > confidence signal
 */
export function selectTemplate(opts: TemplateSelectInput): TemplateType {
  const { campaignType, badge, postScore } = opts

  // Scarcity signal dominates — FOMO converts
  if (badge === 'rare' || badge === 'low_stock') return 'rare_fomo'

  // Event-driven — timing creates urgency
  if (campaignType === 'double_date' || campaignType === 'peak_traffic') return 'timing'

  // Financial context — money pain resonates
  if (campaignType === 'payday' || campaignType === 'month_start') return 'money_pain'

  // High-confidence deal — reduce friction for indecisive buyer
  if (postScore !== null && postScore !== undefined && postScore >= 70) return 'lazy_buyer'

  return 'money_pain'
}

// ---------------------------------------------------------------------------
// Extended input type
// ---------------------------------------------------------------------------

export interface RevenueCaptionInput extends CaptionInput {
  templateType?: TemplateType
  badge?:        RareItemBadge | null
  postScore?:    number | null
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Generate a caption using the 4-template revenue strategy.
 * If `templateType` is not provided, `selectTemplate()` auto-picks based on context.
 */
export function generateRevenueCaption(input: RevenueCaptionInput): CaptionResult {
  const ctx = input.campaignContext ?? getCampaignContext()
  const templateType = input.templateType ?? selectTemplate({
    campaignType: ctx.type,
    badge:        input.badge,
    postScore:    input.postScore,
  })

  const baseUrl      = input.baseUrl ?? 'https://couponkum.com'
  const productUrl   = `${baseUrl}/product/${input.productSlug}`
  const disclosure   = input.disclosureTemplate ?? '# โฆษณา'
  const saving       = input.originalPrice - input.effectiveNet
  const priceStr     = formatThaiNumber(input.effectiveNet)
  const originalStr  = formatThaiNumber(input.originalPrice)
  const savingStr    = saving > 0 ? formatThaiNumber(saving) : null
  const couponLine   = input.couponCode   ? `\nโค้ด: ${input.couponCode}` : ''
  const bankLine     = input.bankPromoSnippet ? `\n${input.bankPromoSnippet}` : ''

  const params: BuildParams = {
    productName:   input.productName,
    productUrl,
    priceStr,
    originalStr,
    savingStr,
    couponLine,
    bankLine,
    disclosure,
    campaignLabel: ctx.label,
    badge:         input.badge ?? null,
  }

  let short: string
  let long:  string

  switch (templateType) {
    case 'money_pain':
      short = buildMoneyPainShort(params)
      long  = buildMoneyPainLong(params)
      break
    case 'rare_fomo':
      short = buildRareFomoShort(params)
      long  = buildRareFomoLong(params)
      break
    case 'timing':
      short = buildTimingShort(params)
      long  = buildTimingLong(params)
      break
    case 'lazy_buyer':
      short = buildLazyBuyerShort(params)
      long  = buildLazyBuyerLong(params)
      break
    default:
      // 'basic' — delegate to original logic via import
      short = buildMoneyPainShort(params)
      long  = buildMoneyPainLong(params)
  }

  return { short, long, templateType, productUrl }
}

// ---------------------------------------------------------------------------
// Shared param type
// ---------------------------------------------------------------------------

interface BuildParams {
  productName:   string
  productUrl:    string
  priceStr:      string
  originalStr:   string
  savingStr:     string | null
  couponLine:    string
  bankLine:      string
  disclosure:    string
  campaignLabel: string
  badge:         RareItemBadge | null
}

// ---------------------------------------------------------------------------
// money_pain — Hook: ประหยัดเงิน
// ---------------------------------------------------------------------------

function buildMoneyPainShort(p: BuildParams): string {
  const savingNote = p.savingStr ? ` (ประหยัด ${p.savingStr} บาท)` : ''
  return joinLines([
    `💸 รู้สึกว่าสินค้าแพงเกินไปไหม?`,
    `${p.productName} เหลือแค่ ${p.priceStr} บาท${savingNote}`,
    `${p.couponLine}${p.bankLine}`,
    `👉 ${p.productUrl}`,
    p.disclosure,
  ])
}

function buildMoneyPainLong(p: BuildParams): string {
  const savingBlock = p.savingStr
    ? `✅ ประหยัดได้ถึง ${p.savingStr} บาท — เงินที่เหลือไปทำอะไรดี?`
    : ''
  return joinLines([
    `💸 จ่ายน้อยกว่า ได้ของเหมือนกัน`,
    '',
    `🛒 ${p.productName}`,
    `ราคาเดิม ${p.originalStr} บาท → เหลือแค่ ${p.priceStr} บาท`,
    savingBlock,
    '',
    buildDiscountBlock(p),
    `👇 ดูดีลเต็มและหักคูปองอัตโนมัติที่นี่`,
    p.productUrl,
    '',
    p.disclosure,
  ])
}

// ---------------------------------------------------------------------------
// rare_fomo — Hook: รีบก่อนหมด
// ---------------------------------------------------------------------------

function buildRareFomoShort(p: BuildParams): string {
  const badgeLabel = p.badge === 'rare' ? '⚠️ สินค้าหายาก!' : '⚠️ สต็อกเหลือน้อย!'
  return joinLines([
    badgeLabel,
    `${p.productName} ราคา ${p.priceStr} บาท`,
    `รีบกดก่อนหมด 🔥${p.couponLine}`,
    `👉 ${p.productUrl}`,
    p.disclosure,
  ])
}

function buildRareFomoLong(p: BuildParams): string {
  const urgencyLine = p.badge === 'rare'
    ? `🔍 สินค้านี้หายาก หาไม่ได้บ่อยๆ`
    : `📦 สต็อกเหลือน้อยแล้ว คนสนใจเยอะมาก`
  return joinLines([
    `🔥 กำลังจะหมดแล้ว — รีบซื้อก่อนเสียดาย`,
    '',
    `🛒 ${p.productName}`,
    urgencyLine,
    `💰 ราคาตอนนี้ ${p.priceStr} บาท (เดิม ${p.originalStr} บาท)`,
    '',
    buildDiscountBlock(p),
    `👇 ดูก่อนหมด`,
    p.productUrl,
    '',
    p.disclosure,
  ])
}

// ---------------------------------------------------------------------------
// timing — Hook: วันนี้วันเดียว
// ---------------------------------------------------------------------------

function buildTimingShort(p: BuildParams): string {
  const savingNote = p.savingStr ? ` (ลด ${p.savingStr} บาท)` : ''
  return joinLines([
    `⏰ ${p.campaignLabel} — ลดวันนี้เท่านั้น!`,
    `${p.productName} เหลือ ${p.priceStr} บาท${savingNote}`,
    `${p.couponLine}${p.bankLine}`,
    `👉 ${p.productUrl}`,
    p.disclosure,
  ])
}

function buildTimingLong(p: BuildParams): string {
  return joinLines([
    `⏰ ${p.campaignLabel} — โปรนี้ไม่รอใคร`,
    '',
    `🛒 ${p.productName}`,
    `💸 ปกติ ${p.originalStr} บาท → วันนี้ ${p.priceStr} บาท`,
    p.savingStr ? `✅ ประหยัด ${p.savingStr} บาท` : '',
    '',
    buildDiscountBlock(p),
    `⚡ อย่าปล่อยให้โปรหมดก่อนกด`,
    p.productUrl,
    '',
    p.disclosure,
  ])
}

// ---------------------------------------------------------------------------
// lazy_buyer — Hook: ซื้อเลยไม่ต้องคิด
// ---------------------------------------------------------------------------

function buildLazyBuyerShort(p: BuildParams): string {
  return joinLines([
    `✅ ซื้อเลยไม่ต้องคิด — คุ้มมาก`,
    `${p.productName} แค่ ${p.priceStr} บาท`,
    `${p.couponLine}${p.bankLine}`,
    `👉 ${p.productUrl}`,
    p.disclosure,
  ])
}

function buildLazyBuyerLong(p: BuildParams): string {
  return joinLines([
    `✅ ไม่ต้องเสียเวลาเปรียบราคา — เราคำนวณให้แล้ว`,
    '',
    `🛒 ${p.productName}`,
    `💰 ราคาที่คุ้มที่สุด: ${p.priceStr} บาท`,
    p.savingStr ? `🎯 ประหยัด ${p.savingStr} บาท — ดีลนี้ผ่านการคัดมาแล้ว` : '',
    '',
    buildDiscountBlock(p),
    `👇 กดได้เลย — ไม่มีข้อจำกัดซับซ้อน`,
    p.productUrl,
    '',
    p.disclosure,
  ])
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildDiscountBlock(p: BuildParams): string {
  const lines: string[] = []
  if (p.couponLine.trim()) lines.push(`🏷️ ใส่โค้ด:${p.couponLine.replace(/\n/, '')}`)
  if (p.bankLine.trim())   lines.push(`💳 ${p.bankLine.replace(/\n/, '')}`)
  if (lines.length === 0)  return ''
  return `วิธีรับส่วนลด:\n${lines.join('\n')}`
}

function joinLines(lines: string[]): string {
  return lines
    .map(s => s.trimEnd())
    .filter((s, i, arr) => s !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .trim()
}
