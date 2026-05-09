// POSTLIVE-33: influencer sub_id utilities

import { describe, expect, it } from 'vitest'
import { sanitizeHandle, buildInfluencerSubId } from '@/lib/influencer-subid-utils'

describe('influencer sub-id utilities — POSTLIVE-33', () => {
  it('sanitizeHandle lowercases and replaces special chars with underscore', () => {
    expect(sanitizeHandle('TechReviewer')).toBe('techreviewer')
    expect(sanitizeHandle('Tech Reviewer!')).toBe('tech_reviewer')
  })

  it('sanitizeHandle collapses consecutive underscores', () => {
    expect(sanitizeHandle('a  b')).toBe('a_b')
    expect(sanitizeHandle('my--handle')).toBe('my_handle')
  })

  it('sanitizeHandle strips leading and trailing underscores', () => {
    expect(sanitizeHandle('_handle_')).toBe('handle')
  })

  it('sanitizeHandle truncates to 24 characters', () => {
    const long = 'a'.repeat(30)
    expect(sanitizeHandle(long).length).toBe(24)
  })

  it('buildInfluencerSubId prepends inf_ prefix', () => {
    expect(buildInfluencerSubId('techreviewer')).toBe('inf_techreviewer')
    expect(buildInfluencerSubId('Review BKK')).toBe('inf_review_bkk')
  })
})
