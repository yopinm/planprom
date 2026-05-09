// src/lib/tiktok-script-generator.ts
// TASK T.4 — TikTok "Short-Video" Script Generator (AI)
//
// Generates 30-60s video scripts for TikTokปั้น Follower.
// Strategy: Hook → Price Comparison → CTA (Follow-First)

import { formatThaiNumber } from './caption-engine'
import { getCampaignContext } from './campaign-context'
import type { CampaignContext } from './campaign-context'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TikTokScriptInput {
  productName: string
  originalPrice: number
  effectiveNet: number
  /** Provide to pin script to a specific campaign context; defaults to now */
  campaignContext?: CampaignContext
}

export interface TikTokScriptResult {
  /** The spoken script for the video */
  script: string
  /** Visual hints for the creator (what to show on screen) */
  visualHints: string[]
  /** Predicted duration in seconds */
  estimatedDurationSeconds: number
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

export function generateTikTokScript(input: TikTokScriptInput): TikTokScriptResult {
  const {
    productName,
    originalPrice,
    effectiveNet,
    campaignContext = getCampaignContext(),
  } = input

  const saving = originalPrice - effectiveNet
  const priceFormatted = formatThaiNumber(effectiveNet)
  const originalFormatted = formatThaiNumber(originalPrice)
  const savingFormatted = formatThaiNumber(saving)

  const hook = generateHook(productName, priceFormatted, campaignContext)
  const body = generateBody(productName, originalFormatted, priceFormatted, savingFormatted)
  const cta  = generateCTA()

  const script = [hook, body, cta].join('\n\n')

  const visualHints = [
    `[ฉาก 1] ภาพสินค้า ${productName} และข้อความ Hook ตัวใหญ่ๆ`,
    `[ฉาก 2] แคปหน้าจอแอป Shopee/Lazada โชว์ราคาที่ลดเหลือ ${priceFormatted}`,
    `[ฉาก 3] ข้อความ "ประหยัดไป ${savingFormatted}.-" กะพริบๆ`,
    `[ฉาก 4] ภาพนิ้วชี้ไปที่ปุ่มติดตาม หรือลิงก์หน้าโปรไฟล์`,
  ]

  // Rule of thumb: ~3 words per second for Thai speech
  const wordCount = script.split(/\s+/).length
  const estimatedDurationSeconds = Math.round(wordCount * 0.8 + 15) // Rough estimate for Thai

  return { script, visualHints, estimatedDurationSeconds }
}

// ---------------------------------------------------------------------------
// Component builders
// ---------------------------------------------------------------------------

function generateHook(productName: string, price: string, context: CampaignContext): string {
  const hooks = [
    `ใครกำลังจะซื้อ ${productName} อย่าเพิ่งรีบกดนะครับ!`,
    `ราคา ${productName} ลงมาเหลือแค่ ${price} บาทได้ยังไง?`,
    `ดีลเด็ด ${context.label} มาแล้ว! ${productName} เหลือแค่ ${price} บาทเองครับ`,
    `ประหยัดเงินได้เป็นพัน! ถ้าคุณรู้ว่า ${productName} ลดเหลือเท่านี้`,
  ]
  
  // Pick one based on simple hash of product name to keep it deterministic but varied
  const index = productName.length % hooks.length
  return hooks[index]
}

function generateBody(product: string, original: string, current: string, saving: string): string {
  return `ปกติ ${product} เห็นขายกันอยู่ที่ ${original} บาทใช่ไหมครับ แต่ตอนนี้ถ้ากดคูปองตามที่เราบอก จะเหลือแค่ ${current} บาทเองนะ ประหยัดไปได้ตั้ง ${saving} บาทเลยครับ`
}

function generateCTA(): string {
  return `ใครไม่อยากพลาดดีลคุ้มๆ แบบนี้ อย่าลืมกดติดตาม "คูปองคุ้ม" ไว้ด้วยนะครับ หรือจะกดดูรายละเอียดที่ดีลนี้เลย ไปที่ลิงก์หน้าโปรไฟล์ได้เลยครับ`
}
