// src/lib/caption-engine.ts
// TASK 2.5.3 — Caption Engine [WS4][P2.5]
//
// Generates short + long Facebook post captions for Manual Mode (Admin copy).
// Structure: Hook → Pain → Solution → CTA
//
// P3-Ext will extend this file with the 4-Template Strategy:
//   money_pain | rare_fomo | timing | lazy_buyer
//
// Rules (CLAUDE.md):
//   - server-side only — never import in client components
//   - short + long variants always returned
//   - disclosure appended to every caption
//   - Link: couponkum.com/product/[slug] only (no direct affiliate URL)

import { getCampaignContext } from './campaign-context'
import type { CampaignContext } from './campaign-context'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** P2.5 uses 'basic'. P3-Ext (TASK 3.19) adds money_pain | rare_fomo | timing | lazy_buyer */
export type TemplateType = 'basic' | 'money_pain' | 'rare_fomo' | 'timing' | 'lazy_buyer'

export interface CaptionInput {
  productName: string
  /** Used to build couponkum.com/product/[slug] */
  productSlug: string
  originalPrice: number
  effectiveNet: number
  /** Coupon code to highlight (optional) */
  couponCode?: string | null
  /** Short bank promo description, e.g. "KBank ลด 5% เพิ่ม" (optional) */
  bankPromoSnippet?: string | null
  /** Provide to pin caption to a specific campaign context; defaults to now */
  campaignContext?: CampaignContext
  /** Disclosure line; defaults to '# โฆษณา' */
  disclosureTemplate?: string
  /** Defaults to https://couponkum.com */
  baseUrl?: string
}

export interface CaptionResult {
  /** ~100-150 chars — suitable for FB mobile preview */
  short: string
  /** ~350-500 chars — full post body */
  long: string
  templateType: TemplateType
  productUrl: string
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

export function generateCaption(input: CaptionInput): CaptionResult {
  const {
    productName,
    productSlug,
    originalPrice,
    effectiveNet,
    couponCode       = null,
    bankPromoSnippet = null,
    campaignContext  = getCampaignContext(),
    disclosureTemplate = '# โฆษณา',
    baseUrl          = 'https://couponkum.com',
  } = input

  const saving     = originalPrice - effectiveNet
  const productUrl = `${baseUrl}/product/${productSlug}`

  const headline     = campaignContext.label
  const priceFormatted    = formatThaiNumber(effectiveNet)
  const originalFormatted = formatThaiNumber(originalPrice)
  const savingFormatted   = saving > 0 ? formatThaiNumber(saving) : null

  const short = buildShort({
    headline, productName, priceFormatted, savingFormatted,
    couponCode, bankPromoSnippet, productUrl, disclosureTemplate,
  })

  const long = buildLong({
    headline, productName, priceFormatted, originalFormatted, savingFormatted,
    effectiveNet, couponCode, bankPromoSnippet, productUrl, disclosureTemplate,
  })

  return { short, long, templateType: 'basic', productUrl }
}

// ---------------------------------------------------------------------------
// Template builders
// ---------------------------------------------------------------------------

interface ShortParams {
  headline:          string
  productName:       string
  priceFormatted:    string
  savingFormatted:   string | null
  couponCode:        string | null
  bankPromoSnippet:  string | null
  productUrl:        string
  disclosureTemplate: string
}

function buildShort(p: ShortParams): string {
  const savingNote = p.savingFormatted ? ` (ประหยัด ${p.savingFormatted} บาท)` : ''
  const couponLine = p.couponCode ? `\nโค้ด: ${p.couponCode}` : ''
  const bankLine   = p.bankPromoSnippet ? `\n${p.bankPromoSnippet}` : ''

  return [
    `${p.headline}! 💰`,
    `${p.productName} เหลือแค่ ${p.priceFormatted} บาท${savingNote}`,
    `${couponLine}${bankLine}`,
    `👉 ${p.productUrl}`,
    p.disclosureTemplate,
  ]
    .map(s => s.trim())
    .filter(Boolean)
    .join('\n')
}

interface LongParams extends ShortParams {
  originalFormatted: string
  effectiveNet:      number
}

function buildLong(p: LongParams): string {
  const savingLine = p.effectiveNet <= 0
    ? '✅ ฟรีเลย! (cashback เกินราคา)'
    : p.savingFormatted
      ? `✅ ประหยัดไป ${p.savingFormatted} บาท — ไม่ต้องรอเซลใหญ่!`
      : ''

  const couponBlock = p.couponCode
    ? `\n🏷️ ใส่โค้ด: ${p.couponCode}\n`
    : ''

  const bankBlock = p.bankPromoSnippet
    ? `💳 ${p.bankPromoSnippet}\n`
    : ''

  const discountBlock = (couponBlock || bankBlock)
    ? `${couponBlock}${bankBlock}`
    : ''

  return [
    `${p.headline} ✨`,
    '',
    `🛒 ${p.productName}`,
    `💸 ปกติ ${p.originalFormatted} บาท → ตอนนี้ ${p.priceFormatted} บาท`,
    savingLine,
    '',
    discountBlock.trim()
      ? `วิธีรับส่วนลด:\n${discountBlock.trim()}`
      : '',
    `👇 ดูดีลนี้ก่อนหมด`,
    p.productUrl,
    '',
    p.disclosureTemplate,
  ]
    .map(s => s.trimEnd())
    .filter((s, i, arr) => {
      // collapse consecutive blank lines to one
      if (s === '') return i === 0 || arr[i - 1] !== ''
      return true
    })
    .join('\n')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatThaiNumber(value: number): string {
  return value.toLocaleString('th-TH')
}
