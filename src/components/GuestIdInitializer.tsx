'use client'

// WALLET-GUEST-1: Initializes ck_guest_id cookie on first visit.
// Replaces static LINE button with one that carries the guest_id so
// the webhook can map line_uid → guest_id when the user subscribes.
//
// Uses a DOM ref to update href after mount instead of setState-in-effect
// (avoids react-hooks/set-state-in-effect lint rule while preserving SSR fallback).

import { useEffect, useRef } from 'react'
import {
  GUEST_COOKIE,
  GUEST_COOKIE_MAX_AGE,
  generateGuestId,
  parseGuestIdFromCookieString,
  buildLineSubscribeUrl,
} from '@/lib/guest-id'

interface Props {
  lineOaId: string
}

export function GuestIdLineButton({ lineOaId }: Props) {
  const anchorRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    // Read existing cookie or create a new UUID
    let guestId = parseGuestIdFromCookieString(document.cookie)
    if (!guestId) {
      guestId = generateGuestId()
      const expires = new Date(Date.now() + GUEST_COOKIE_MAX_AGE * 1000).toUTCString()
      document.cookie = `${GUEST_COOKIE}=${guestId}; expires=${expires}; path=/; SameSite=Lax`
    }
    // Update DOM directly — avoids cascading setState re-render
    if (anchorRef.current) {
      anchorRef.current.href = buildLineSubscribeUrl(lineOaId, guestId)
    }
  }, [lineOaId])

  return (
    <a
      ref={anchorRef}
      href={`https://line.me/R/ti/p/${lineOaId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-green-500 bg-green-500 px-5 py-3 text-sm font-black text-white transition hover:bg-green-600 active:scale-95"
    >
      <span className="text-base">💬</span>
      รับคูปองใหม่ทาง LINE (ฟรี)
    </a>
  )
}
