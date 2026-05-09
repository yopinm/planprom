import { describe, expect, it } from 'vitest'
import {
  ADMIN_ALERT_RULES,
  evaluateAdminAlertRule,
  getDefaultAdminAlertRules,
  isAdminAlertRuleKey,
  mergeAdminAlertRules,
} from '@/lib/admin-alert-rules'

describe('admin alert rules', (): void => {
  it('defines the required launch alert thresholds', (): void => {
    const keys = ADMIN_ALERT_RULES.map(rule => rule.rule_key)

    expect(keys).toEqual([
      'postback_failure_count',
      'broken_link_count',
      'conversion_rate_floor',
    ])
  })

  it('merges stored rule rows over safe defaults', (): void => {
    const rules = mergeAdminAlertRules([
      {
        rule_key: 'postback_failure_count',
        threshold_value: '5.5',
        window_minutes: 120,
        is_enabled: false,
      },
    ])
    const postbackRule = rules.find(rule => rule.rule_key === 'postback_failure_count')
    const brokenLinkRule = rules.find(rule => rule.rule_key === 'broken_link_count')

    expect(postbackRule?.threshold_value).toBe(5.5)
    expect(postbackRule?.window_minutes).toBe(120)
    expect(postbackRule?.is_enabled).toBe(false)
    expect(brokenLinkRule?.is_enabled).toBe(true)
  })

  it('evaluates max-style count thresholds as warnings when crossed', (): void => {
    const [rule] = getDefaultAdminAlertRules()

    expect(evaluateAdminAlertRule(rule, 2).status).toBe('ok')
    expect(evaluateAdminAlertRule(rule, 3).status).toBe('warning')
  })

  it('evaluates min-style conversion floors as warnings below threshold', (): void => {
    const rule = getDefaultAdminAlertRules()
      .find(item => item.rule_key === 'conversion_rate_floor')

    expect(rule).toBeDefined()
    expect(evaluateAdminAlertRule(rule!, 2.1).status).toBe('ok')
    expect(evaluateAdminAlertRule(rule!, 1.9).status).toBe('warning')
  })

  it('validates rule keys', (): void => {
    expect(isAdminAlertRuleKey('broken_link_count')).toBe(true)
    expect(isAdminAlertRuleKey('facebook_post_count')).toBe(false)
  })
})
