'use client'

// POSTLIVE-31: drops ck_campaign_prep cookie with campaign sub_id on mount.
// Last-click attribution: cookie survives until campaign day so any purchase
// within the window is attributed to the pre-campaign sub_id.

import { useEffect } from 'react'
import {
  CAMPAIGN_PREP_COOKIE,
  CAMPAIGN_PREP_COOKIE_MAX_AGE,
} from '@/lib/campaign-prep'

interface Props {
  subId: string
}

export function CampaignPrepCookieDrop({ subId }: Props) {
  useEffect(() => {
    const expires = new Date(Date.now() + CAMPAIGN_PREP_COOKIE_MAX_AGE * 1000).toUTCString()
    document.cookie = `${CAMPAIGN_PREP_COOKIE}=${subId}; expires=${expires}; path=/; SameSite=Lax`
  }, [subId])

  return null
}
