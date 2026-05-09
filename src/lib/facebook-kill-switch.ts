export type FacebookAutomationKind = 'graph_api_posting' | 'auto_reply'

export interface FacebookAutomationSettings {
  graph_api_posting_enabled?: boolean | null
  auto_reply_enabled?: boolean | null
}

export interface FacebookKillSwitchStatus {
  kind: FacebookAutomationKind
  enabled: boolean
  reason: 'enabled' | 'settings_disabled' | 'env_disabled'
  message: string
}

function isEnvDisabled(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase()
  return value === 'true' || value === '1' || value === 'yes'
}

function resolveEnabled(value: boolean | null | undefined): boolean {
  return value === true
}

export function getFacebookAutomationStatus(
  kind: FacebookAutomationKind,
  settings: FacebookAutomationSettings | null | undefined,
): FacebookKillSwitchStatus {
  if (kind === 'graph_api_posting') {
    if (isEnvDisabled('FB_DISABLE_GRAPH_API_POSTING')) {
      return {
        kind,
        enabled: false,
        reason: 'env_disabled',
        message: 'Graph API posting is disabled by FB_DISABLE_GRAPH_API_POSTING.',
      }
    }

    if (!resolveEnabled(settings?.graph_api_posting_enabled)) {
      return {
        kind,
        enabled: false,
        reason: 'settings_disabled',
        message: 'Graph API posting is disabled in facebook_settings.',
      }
    }
  }

  if (kind === 'auto_reply') {
    if (isEnvDisabled('FB_DISABLE_AUTO_REPLY')) {
      return {
        kind,
        enabled: false,
        reason: 'env_disabled',
        message: 'Facebook auto-reply is disabled by FB_DISABLE_AUTO_REPLY.',
      }
    }

    if (!resolveEnabled(settings?.auto_reply_enabled)) {
      return {
        kind,
        enabled: false,
        reason: 'settings_disabled',
        message: 'Facebook auto-reply is disabled in facebook_settings.',
      }
    }
  }

  return {
    kind,
    enabled: true,
    reason: 'enabled',
    message: kind === 'graph_api_posting'
      ? 'Graph API posting is enabled.'
      : 'Facebook auto-reply is enabled.',
  }
}
