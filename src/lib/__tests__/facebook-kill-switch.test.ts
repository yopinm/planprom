import { afterEach, describe, expect, it } from 'vitest'
import { getFacebookAutomationStatus } from '@/lib/facebook-kill-switch'

const ORIGINAL_ENV = { ...process.env }

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
})

describe('facebook kill switch', (): void => {
  it('defaults graph api posting to disabled unless settings enable it', (): void => {
    const status = getFacebookAutomationStatus('graph_api_posting', null)

    expect(status.enabled).toBe(false)
    expect(status.reason).toBe('settings_disabled')
  })

  it('allows graph api posting when settings enable it', (): void => {
    const status = getFacebookAutomationStatus('graph_api_posting', {
      graph_api_posting_enabled: true,
    })

    expect(status.enabled).toBe(true)
  })

  it('lets env force graph api posting off', (): void => {
    process.env.FB_DISABLE_GRAPH_API_POSTING = 'true'

    const status = getFacebookAutomationStatus('graph_api_posting', {
      graph_api_posting_enabled: true,
    })

    expect(status.enabled).toBe(false)
    expect(status.reason).toBe('env_disabled')
  })

  it('defaults auto-reply to disabled unless settings enable it', (): void => {
    const status = getFacebookAutomationStatus('auto_reply', null)

    expect(status.enabled).toBe(false)
    expect(status.reason).toBe('settings_disabled')
  })

  it('lets env force auto-reply off', (): void => {
    process.env.FB_DISABLE_AUTO_REPLY = '1'

    const status = getFacebookAutomationStatus('auto_reply', {
      auto_reply_enabled: true,
    })

    expect(status.enabled).toBe(false)
    expect(status.reason).toBe('env_disabled')
  })
})
