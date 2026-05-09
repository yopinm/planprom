export type AdminControlFlagKey =
  | 'net_price_calculation'
  | 'ai_ranking'
  | 'lazada_real_data'
  | 'affiliate_redirect'
  | 'postback_tracking'
  | 'maintenance_mode'

export type AdminControlCategory = 'core' | 'ai' | 'data' | 'revenue' | 'ops'

export type AdminControlRiskLevel = 'low' | 'medium' | 'high'

export interface AdminControlFlagDefinition {
  flag_key: AdminControlFlagKey
  label: string
  description: string
  category: AdminControlCategory
  risk_level: AdminControlRiskLevel
  safe_default: boolean
}

export interface AdminControlFlag extends AdminControlFlagDefinition {
  is_enabled: boolean
  updated_by: string | null
  updated_at: string | null
}

export interface AdminControlFlagRow {
  flag_key: string
  label?: string | null
  description?: string | null
  category?: string | null
  risk_level?: string | null
  safe_default?: boolean | null
  is_enabled?: boolean | null
  updated_by?: string | null
  updated_at?: string | null
}

export interface AdminControlStatus {
  enabled: boolean
  reason: 'enabled' | 'settings_disabled' | 'lookup_failed'
  message: string
}

export const ADMIN_CONTROL_FLAGS: readonly AdminControlFlagDefinition[] = [
  {
    flag_key: 'net_price_calculation',
    label: 'Net Price Calculation',
    description: 'Use coupon stacker and bank-promotion math for effective net price.',
    category: 'core',
    risk_level: 'low',
    safe_default: true,
  },
  {
    flag_key: 'ai_ranking',
    label: 'AI Ranking',
    description: 'Allow AI ranking signals only after baseline approval.',
    category: 'ai',
    risk_level: 'high',
    safe_default: false,
  },
  {
    flag_key: 'lazada_real_data',
    label: 'Lazada Real Data',
    description: 'Use Lazada API or manual production import instead of mock data.',
    category: 'data',
    risk_level: 'medium',
    safe_default: false,
  },
  {
    flag_key: 'affiliate_redirect',
    label: 'Affiliate Redirect',
    description: 'Allow outbound affiliate handoff through /go and /api/r.',
    category: 'revenue',
    risk_level: 'high',
    safe_default: false,
  },
  {
    flag_key: 'postback_tracking',
    label: 'Postback Tracking',
    description: 'Accept partner postbacks and write revenue attribution events.',
    category: 'revenue',
    risk_level: 'high',
    safe_default: false,
  },
  {
    flag_key: 'maintenance_mode',
    label: 'Maintenance Mode',
    description: 'Enable public-flow maintenance controls while admin remains reachable.',
    category: 'ops',
    risk_level: 'medium',
    safe_default: false,
  },
]

export function isAdminControlFlagKey(value: string): value is AdminControlFlagKey {
  return ADMIN_CONTROL_FLAGS.some(flag => flag.flag_key === value)
}

export function getAdminControlFlagDefinition(
  flagKey: AdminControlFlagKey,
): AdminControlFlagDefinition {
  return ADMIN_CONTROL_FLAGS.find(flag => flag.flag_key === flagKey) ?? ADMIN_CONTROL_FLAGS[0]
}

export function getDefaultAdminControlFlags(nowIso: string | null = null): AdminControlFlag[] {
  return ADMIN_CONTROL_FLAGS.map((flag): AdminControlFlag => ({
    ...flag,
    is_enabled: flag.safe_default,
    updated_by: null,
    updated_at: nowIso,
  }))
}

export function mergeAdminControlFlags(rows: readonly AdminControlFlagRow[]): AdminControlFlag[] {
  const byKey = new Map(rows.map(row => [row.flag_key, row]))

  return ADMIN_CONTROL_FLAGS.map((definition): AdminControlFlag => {
    const row = byKey.get(definition.flag_key)

    return {
      ...definition,
      is_enabled: typeof row?.is_enabled === 'boolean' ? row.is_enabled : definition.safe_default,
      updated_by: row?.updated_by ?? null,
      updated_at: row?.updated_at ?? null,
    }
  })
}

export function countDisabledRiskyFlags(flags: readonly AdminControlFlag[]): number {
  return flags.filter(flag => flag.risk_level === 'high' && !flag.is_enabled).length
}

export function getAdminControlStatus(
  flagKey: AdminControlFlagKey,
  row: Pick<AdminControlFlagRow, 'is_enabled'> | null | undefined,
): AdminControlStatus {
  const definition = getAdminControlFlagDefinition(flagKey)
  const enabled = typeof row?.is_enabled === 'boolean' ? row.is_enabled : definition.safe_default

  if (enabled) {
    return {
      enabled: true,
      reason: 'enabled',
      message: `${definition.label} is enabled.`,
    }
  }

  return {
    enabled: false,
    reason: 'settings_disabled',
    message: `${definition.label} is disabled in admin control flags.`,
  }
}
