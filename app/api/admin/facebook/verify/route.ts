// app/api/admin/facebook/verify/route.ts — TASK 3.17
// GET /api/admin/facebook/verify
// Admin health check: verifies FB_PAGE_ACCESS_TOKEN against Graph API.
// Returns JSON — open in browser or call from admin config page.

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { getFacebookAutomationStatus } from '@/lib/facebook-kill-switch'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyPageToken, isGraphApiConfigured } from '@/services/facebook/graph-api'
import { getFbAppSecretRotationStatus } from '@/services/facebook/app-secret-health'
import { getFbTokenRotationStatus } from '@/services/facebook/token-health'
import { getFbTosReviewStatus } from '@/services/facebook/tos-review-health'
import { isWebhookSignatureConfigured } from '@/services/facebook/webhook-security'

export async function GET() {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appSecretRotation = getFbAppSecretRotationStatus()
  const tokenRotation = getFbTokenRotationStatus()
  const webhookSignatureConfigured = isWebhookSignatureConfigured()
  const supabase = createAdminClient()
  const { data: settings } = await supabase
    .from('facebook_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  const automation = {
    graph_api_posting: getFacebookAutomationStatus('graph_api_posting', settings),
    auto_reply: getFacebookAutomationStatus('auto_reply', settings),
  }
  const tosReview = getFbTosReviewStatus(
    typeof settings?.tos_reviewed_at === 'string' ? settings.tos_reviewed_at : null,
    typeof settings?.tos_reviewed_by === 'string' ? settings.tos_reviewed_by : null,
  )

  if (!isGraphApiConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'env_missing',
        hint: 'Set FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN in .env.local',
        app_secret_rotation: appSecretRotation,
        automation,
        tos_review: tosReview,
        token_rotation: tokenRotation,
        webhook_signature_configured: webhookSignatureConfigured,
      },
      { status: 200 },
    )
  }

  try {
    const page = await verifyPageToken()
    return NextResponse.json({
      ok:        true,
      page_id:   page.id,
      page_name: page.name,
      fan_count: page.fan_count ?? null,
      app_secret_rotation: appSecretRotation,
      automation,
      tos_review: tosReview,
      token_rotation: tokenRotation,
      webhook_signature_configured: webhookSignatureConfigured,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({
      ok: false,
      reason: 'api_error',
      error: message,
      app_secret_rotation: appSecretRotation,
      automation,
      tos_review: tosReview,
      token_rotation: tokenRotation,
      webhook_signature_configured: webhookSignatureConfigured,
    }, { status: 200 })
  }
}
