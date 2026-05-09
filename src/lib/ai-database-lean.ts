// TASK 6.5 - Database Lean Management (Anti-Bloat, dormant / dry-run)
//
// Produces review-only cleanup recommendations. This module never executes SQL
// and must be treated as an advisory report until an admin explicitly applies a
// separate migration or maintenance job.

export type AiDatabaseLeanMode = 'disabled' | 'waiting_for_baseline' | 'dry_run_ready' | 'active_ready'
export type AiDatabaseLeanAction = 'archive' | 'purge' | 'monitor'

export interface AiDatabaseLeanThresholds {
  minTableStats: number
  minTotalRows: number
}

export interface AiDatabaseLeanConfig {
  enabled: boolean
  dryRun: boolean
  thresholds: AiDatabaseLeanThresholds
}

export interface TableRetentionPolicy {
  tableName: string
  timestampColumn: string
  action: AiDatabaseLeanAction
  retainDays: number
  minRowsBeforeAction: number
}

export interface TableLeanStat {
  tableName: string
  rowCount: number
  estimatedSizeMb: number
  oldestRowAt: string | null
  newestRowAt: string | null
  queryP95Ms?: number | null
}

export interface AiDatabaseLeanRecommendation {
  tableName: string
  action: AiDatabaseLeanAction
  riskScore: number
  candidateRows: number
  estimatedRecoverableMb: number
  cutoffDate: string | null
  dryRunSql: string | null
  reasons: string[]
}

export interface AiDatabaseLeanReadiness {
  baselineReady: boolean
  canApply: boolean
  mode: AiDatabaseLeanMode
  reasons: string[]
  totals: {
    tableStats: number
    totalRows: number
  }
  thresholds: AiDatabaseLeanThresholds
}

export interface AiDatabaseLeanReport {
  readiness: AiDatabaseLeanReadiness
  recommendations: AiDatabaseLeanRecommendation[]
  generatedAt: string
}

export interface AiDatabaseLeanInput {
  stats: TableLeanStat[]
  policies?: TableRetentionPolicy[]
  config?: AiDatabaseLeanConfig
  now?: Date
}

const DEFAULT_THRESHOLDS: AiDatabaseLeanThresholds = {
  minTableStats: 2,
  minTotalRows:  1000,
}

export const DEFAULT_RETENTION_POLICIES: TableRetentionPolicy[] = [
  {
    tableName:           'price_history',
    timestampColumn:     'captured_at',
    action:              'archive',
    retainDays:          180,
    minRowsBeforeAction: 50_000,
  },
  {
    tableName:           'click_logs',
    timestampColumn:     'clicked_at',
    action:              'purge',
    retainDays:          90,
    minRowsBeforeAction: 100_000,
  },
  {
    tableName:           'product_views',
    timestampColumn:     'viewed_at',
    action:              'purge',
    retainDays:          14,
    minRowsBeforeAction: 20_000,
  },
  {
    tableName:           'search_logs',
    timestampColumn:     'searched_at',
    action:              'purge',
    retainDays:          90,
    minRowsBeforeAction: 10_000,
  },
  {
    tableName:           'analytics_events',
    timestampColumn:     'created_at',
    action:              'purge',
    retainDays:          90,
    minRowsBeforeAction: 10_000,
  },
]

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  return value.trim().toLowerCase() === 'true'
}

function parsePositiveIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getAiDatabaseLeanConfig(env: Record<string, string | undefined> = process.env): AiDatabaseLeanConfig {
  return {
    enabled: parseBooleanEnv(env.AI_DB_LEAN_ENABLED, false),
    dryRun:  parseBooleanEnv(env.AI_DB_LEAN_DRY_RUN, true),
    thresholds: {
      minTableStats: parsePositiveIntEnv(env.AI_DB_LEAN_MIN_TABLE_STATS, DEFAULT_THRESHOLDS.minTableStats),
      minTotalRows:  parsePositiveIntEnv(env.AI_DB_LEAN_MIN_TOTAL_ROWS, DEFAULT_THRESHOLDS.minTotalRows),
    },
  }
}

export function computeAiDatabaseLeanReadiness(
  stats: TableLeanStat[],
  config: AiDatabaseLeanConfig = getAiDatabaseLeanConfig(),
): AiDatabaseLeanReadiness {
  const totals = {
    tableStats: stats.length,
    totalRows:  stats.reduce((sum, row) => sum + Number(row.rowCount), 0),
  }

  const reasons: string[] = []

  if (totals.tableStats < config.thresholds.minTableStats) {
    reasons.push(`Need at least ${config.thresholds.minTableStats} table stats; currently ${totals.tableStats}.`)
  }
  if (totals.totalRows < config.thresholds.minTotalRows) {
    reasons.push(`Need at least ${config.thresholds.minTotalRows} total rows; currently ${totals.totalRows}.`)
  }

  const baselineReady = reasons.length === 0
  let mode: AiDatabaseLeanMode = 'waiting_for_baseline'

  if (!config.enabled) {
    mode = 'disabled'
  } else if (!baselineReady) {
    mode = 'waiting_for_baseline'
  } else if (config.dryRun) {
    mode = 'dry_run_ready'
  } else {
    mode = 'active_ready'
  }

  return {
    baselineReady,
    canApply: config.enabled && baselineReady && !config.dryRun,
    mode,
    reasons: baselineReady ? [] : reasons,
    totals,
    thresholds: config.thresholds,
  }
}

function daysBetween(from: string | null, to: Date): number {
  if (!from) return 0
  const ms = to.getTime() - new Date(from).getTime()
  if (!Number.isFinite(ms) || ms < 0) return 0
  return Math.floor(ms / 86_400_000)
}

function isoDateDaysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString()
}

function clampScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)))
}

function estimateCandidateRows(stat: TableLeanStat, policy: TableRetentionPolicy, now: Date): number {
  const ageDays = daysBetween(stat.oldestRowAt, now)
  if (ageDays <= policy.retainDays || stat.rowCount < policy.minRowsBeforeAction) return 0

  const staleRatio = Math.min(0.95, (ageDays - policy.retainDays) / Math.max(ageDays, 1))
  return Math.floor(stat.rowCount * staleRatio)
}

const ALLOWED_TABLE_NAMES = new Set(
  DEFAULT_RETENTION_POLICIES.map(p => p.tableName),
)
const ALLOWED_TIMESTAMP_COLUMNS = new Set(
  DEFAULT_RETENTION_POLICIES.map(p => p.timestampColumn),
)

function buildDryRunSql(policy: TableRetentionPolicy, cutoffDate: string): string {
  if (!ALLOWED_TABLE_NAMES.has(policy.tableName) || !ALLOWED_TIMESTAMP_COLUMNS.has(policy.timestampColumn)) {
    return `-- DRY RUN: table/column not in allowlist; skipping ${policy.tableName}`
  }
  if (policy.action === 'archive') {
    return [
      `-- DRY RUN: inspect rows before archiving ${policy.tableName}`,
      `SELECT count(*) FROM ${policy.tableName} WHERE ${policy.timestampColumn} < '${cutoffDate}';`,
    ].join('\n')
  }
  if (policy.action === 'purge') {
    return [
      `-- DRY RUN: inspect rows before purging ${policy.tableName}`,
      `SELECT count(*) FROM ${policy.tableName} WHERE ${policy.timestampColumn} < '${cutoffDate}';`,
    ].join('\n')
  }
  return `-- DRY RUN: monitor ${policy.tableName}; no cleanup SQL suggested.`
}

function buildReasons(
  stat: TableLeanStat,
  policy: TableRetentionPolicy,
  candidateRows: number,
  riskScore: number,
): string[] {
  const reasons: string[] = []
  if (candidateRows > 0) reasons.push(`${candidateRows.toLocaleString('en-US')} stale rows estimated`)
  if (stat.estimatedSizeMb >= 500) reasons.push('large table size')
  if ((stat.queryP95Ms ?? 0) >= 500) reasons.push('slow p95 query latency')
  if (stat.rowCount >= policy.minRowsBeforeAction) reasons.push('row count above retention threshold')
  if (riskScore < 30) reasons.push('monitor only')
  return reasons
}

export function generateAiDatabaseLeanReport(input: AiDatabaseLeanInput): AiDatabaseLeanReport {
  const config = input.config ?? getAiDatabaseLeanConfig()
  const policies = input.policies ?? DEFAULT_RETENTION_POLICIES
  const now = input.now ?? new Date()
  const readiness = computeAiDatabaseLeanReadiness(input.stats, config)
  const policyMap = new Map(policies.map(policy => [policy.tableName, policy]))

  const recommendations = input.stats
    .map((stat): AiDatabaseLeanRecommendation => {
      const policy = policyMap.get(stat.tableName) ?? {
        tableName:           stat.tableName,
        timestampColumn:     'created_at',
        action:              'monitor' as const,
        retainDays:          365,
        minRowsBeforeAction: Number.POSITIVE_INFINITY,
      }
      const cutoffDate = policy.action === 'monitor' ? null : isoDateDaysAgo(now, policy.retainDays)
      const candidateRows = estimateCandidateRows(stat, policy, now)
      const candidateRatio = stat.rowCount > 0 ? candidateRows / stat.rowCount : 0
      const sizeRisk = Math.min(1, stat.estimatedSizeMb / 1000)
      const latencyRisk = Math.min(1, (stat.queryP95Ms ?? 0) / 1000)
      const riskScore = clampScore(candidateRatio * 45 + sizeRisk * 30 + latencyRisk * 25)
      const estimatedRecoverableMb = Number((stat.estimatedSizeMb * candidateRatio).toFixed(2))
      const action: AiDatabaseLeanAction = candidateRows > 0 ? policy.action : 'monitor'

      return {
        tableName: stat.tableName,
        action,
        riskScore,
        candidateRows,
        estimatedRecoverableMb,
        cutoffDate: action === 'monitor' ? null : cutoffDate,
        dryRunSql: action !== 'monitor' && cutoffDate ? buildDryRunSql(policy, cutoffDate) : null,
        reasons: buildReasons(stat, policy, candidateRows, riskScore),
      }
    })
    .sort((a, b) =>
      b.riskScore - a.riskScore ||
      b.candidateRows - a.candidateRows ||
      a.tableName.localeCompare(b.tableName),
    )

  return {
    readiness,
    recommendations,
    generatedAt: new Date().toISOString(),
  }
}
