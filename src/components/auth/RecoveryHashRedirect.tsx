'use client'

import { useEffect } from 'react'

import { buildRecoveryRedirectPath } from '@/lib/auth-recovery'

export function RecoveryHashRedirect(): null {
  useEffect(() => {
    const redirectPath = buildRecoveryRedirectPath(window.location.hash)
    if (redirectPath) {
      window.location.replace(redirectPath)
    }
  }, [])

  return null
}
