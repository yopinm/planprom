import { describe, it, expect } from 'vitest'
import { generateTikTokScript } from '../tiktok-script-generator'

describe('generateTikTokScript — TASK T.4', () => {
  it('generates a complete script with hook, body, and CTA', () => {
    const input = {
      productName: 'iPhone 15 Pro',
      originalPrice: 41900,
      effectiveNet: 38900
    }

    const result = generateTikTokScript(input)

    expect(result.script).toContain('iPhone 15 Pro')
    expect(result.script).toContain('38,900')
    expect(result.script).toContain('41,900')
    expect(result.script).toContain('3,000') // saving
    expect(result.script).toContain('กดติดตาม "คูปองคุ้ม"')
    
    expect(result.visualHints.length).toBeGreaterThan(0)
    expect(result.estimatedDurationSeconds).toBeGreaterThan(15)
  })

  it('provides visual hints for the creator', () => {
    const result = generateTikTokScript({
      productName: 'Sony WH-1000XM5',
      originalPrice: 14990,
      effectiveNet: 11490
    })

    expect(result.visualHints[0]).toContain('Sony WH-1000XM5')
    expect(result.visualHints[1]).toContain('11,490')
  })
})
