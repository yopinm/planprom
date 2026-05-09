export type AdminAlertRuleKey =
  | 'postback_failure_count'
  | 'broken_link_count'
  | 'conversion_rate_floor'

export type AlertComparisonOperator = 'gte' | 'lt'

export type AlertRuleStatus = 'ok' | 'warning' | 'disabled'

export interface AdminAlertRuleDefinition {
  rule_key: AdminAlertRuleKey
  label: string
  description: string
  metric_source: string
  threshold_value: number
  comparison_operator: AlertComparisonOperator
  window_minutes: number
  is_enabled: boolean
}

export interface AdminAlertRule extends AdminAlertRuleDefinition {
  updated_by: string | null
  updated_at: string | null
}

export interface AdminAlertRuleRow {
  rule_key: string
  label?: string | null
  description?: string | null
  metric_source?: string | null
  threshold_value?: number | string | null
  comparison_operator?: string | null
  window_minutes?: number | null
  is_enabled?: boolean | null
  updated_by?: string | null
  updated_at?: string | null
}

export interface AlertRuleEvaluation {
  status: AlertRuleStatus
  current_value: number | null
  message: string
}

export const ADMIN_ALERT_RULES: readonly AdminAlertRuleDefinition[] = [
  {
    rule_key: 'postback_failure_count',
    label: 'Postback Failures',
    description: 'Blocked or failed partner postback attempts within the alert window.',
    metric_source: 'analytics_events.control_blocked',
    threshold_value: 3,
    comparison_operator: 'gte',
    window_minutes: 60,
    is_enabled: true,
  },
  {
    rule_key: 'broken_link_count',
    label: 'Broken Links',
    description: 'Product outbound links marked unhealthy by the latest link checks.',
    metric_source: 'product_link_checks.ok=false',
    threshold_value: 1,
    comparison_operator: 'gte',
    window_minutes: 1440,
    is_enabled: true,
  },
  {
    rule_key: 'conversion_rate_floor',
    label: 'Conversion Drop',
    description: 'Lowest funnel conversion rate must stay above this floor.',
    metric_source: 'v_funnel_flow.cvr_pct',
    threshold_value: 2,
    comparison_operator: 'lt',
    window_minutes: 1440,
    is_enabled: true,
  },
]

export function isAdminAlertRuleKey(value: string): value is AdminAlertRuleKey {
  return ADMIN_ALERT_RULES.some(rule => rule.rule_key === value)
}

export function getAdminAlertRuleDefinition(
  ruleKey: AdminAlertRuleKey,
): AdminAlertRuleDefinition {
  return ADMIN_ALERT_RULES.find(rule => rule.rule_key === ruleKey) ?? ADMIN_ALERT_RULES[0]
}

export function getDefaultAdminAlertRules(nowIso: string | null = null): AdminAlertRule[] {
  return ADMIN_ALERT_RULES.map((rule): AdminAlertRule => ({
    ...rule,
    updated_by: null,
    updated_at: nowIso,
  }))
}

function numericValue(value: number | string | null | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function comparisonOperator(
  value: string | null | undefined,
  fallback: AlertComparisonOperator,
): AlertComparisonOperator {
  if (value === 'gte' || value === 'lt') return value
  return fallback
}

export function mergeAdminAlertRules(rows: readonly AdminAlertRuleRow[]): AdminAlertRule[] {
  const byKey = new Map(rows.map(row => [row.rule_key, row]))

  return ADMIN_ALERT_RULES.map((definition): AdminAlertRule => {
    const row = byKey.get(definition.rule_key)

    return {
      ...definition,
      label: row?.label ?? definition.label,
      description: row?.description ?? definition.description,
      metric_source: row?.metric_source ?? definition.metric_source,
      threshold_value: numericValue(row?.threshold_value, definition.threshold_value),
      comparison_operator: comparisonOperator(
        row?.comparison_operator,
        definition.comparison_operator,
      ),
      window_minutes: typeof row?.window_minutes === 'number'
        ? row.window_minutes
        : definition.window_minutes,
      is_enabled: typeof row?.is_enabled === 'boolean'
        ? row.is_enabled
        : definition.is_enabled,
      updated_by: row?.updated_by ?? null,
      updated_at: row?.updated_at ?? null,
    }
  })
}

export function evaluateAdminAlertRule(
  rule: Pick<AdminAlertRule, 'is_enabled' | 'comparison_operator' | 'threshold_value' | 'label'>,
  currentValue: number | null,
): AlertRuleEvaluation {
  if (!rule.is_enabled) {
    return {
      status: 'disabled',
      current_value: currentValue,
      message: `${rule.label} alert is disabled.`,
    }
  }

  if (currentValue === null) {
    return {
      status: 'ok',
      current_value: null,
      message: `${rule.label} has no signal yet.`,
    }
  }

  const breached = rule.comparison_operator === 'gte'
    ? currentValue >= rule.threshold_value
    : currentValue < rule.threshold_value

  if (breached) {
    return {
      status: 'warning',
      current_value: currentValue,
      message: `${rule.label} crossed the configured threshold.`,
    }
  }

  return {
    status: 'ok',
    current_value: currentValue,
    message: `${rule.label} is within threshold.`,
  }
}
