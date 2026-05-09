'use client'

// CROWD-COUPON-1 — 👍/👎 coupon validation widget
// Fetches live counts on mount; calls onHide() when downvotes >= threshold.

import { useEffect, useState } from 'react'
import type { VoteValue } from '@/lib/coupon-vote'

interface Props {
  couponCode: string
  productId:  string
  onHide:     () => void
  onVoted?:   () => void
}

function getOrCreateSessionId(): string {
  try {
    const key      = 'ck_session_id'
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

function getStoredVote(code: string, productId: string): VoteValue | null {
  try {
    const v = sessionStorage.getItem(`ck_vote_${code}_${productId}`)
    return (v === 'up' || v === 'down') ? v : null
  } catch { return null }
}

function storeVote(code: string, productId: string, vote: VoteValue): void {
  try { sessionStorage.setItem(`ck_vote_${code}_${productId}`, vote) } catch {}
}

type CountsResponse = { upvotes: number; downvotes: number; hidden: boolean }

export function CouponVoteButtons({ couponCode, productId, onHide, onVoted }: Props) {
  const [upvotes,   setUpvotes]   = useState(0)
  const [downvotes, setDownvotes] = useState(0)
  const [userVote,  setUserVote]  = useState<VoteValue | null>(null)
  const [ready,     setReady]     = useState(false)
  const [voting,    setVoting]    = useState(false)

  useEffect(() => {
    setUserVote(getStoredVote(couponCode, productId))

    const url = `/api/coupon-vote?code=${encodeURIComponent(couponCode)}&product_id=${encodeURIComponent(productId)}`
    fetch(url)
      .then(r => (r.ok ? r.json() : null))
      .then((data: CountsResponse | null) => {
        if (!data) return
        setUpvotes(data.upvotes)
        setDownvotes(data.downvotes)
        if (data.hidden) onHide()
      })
      .catch(() => {})
      .finally(() => setReady(true))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleVote(vote: VoteValue) {
    if (voting || userVote === vote) return
    setVoting(true)
    try {
      const res = await fetch('/api/coupon-vote', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: couponCode,
          product_id:  productId,
          vote,
          session_id:  getOrCreateSessionId(),
        }),
      })
      if (!res.ok) return
      const data = (await res.json()) as CountsResponse
      setUpvotes(data.upvotes)
      setDownvotes(data.downvotes)
      setUserVote(vote)
      storeVote(couponCode, productId, vote)
      onVoted?.()
      if (data.hidden) onHide()
    } catch {
      // silent — non-critical feature
    } finally {
      setVoting(false)
    }
  }

  if (!ready) return null

  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <p className="text-[11px] text-neutral-400">โค้ดนี้ใช้ได้ไหม?</p>

      <button
        type="button"
        disabled={voting}
        onClick={() => void handleVote('up')}
        aria-label="โค้ดยังใช้ได้"
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
          userVote === 'up'
            ? 'bg-green-100 text-green-700'
            : 'bg-neutral-100 text-neutral-500 hover:bg-green-50 hover:text-green-600'
        }`}
      >
        👍{upvotes > 0 && <span>{upvotes}</span>}
      </button>

      <button
        type="button"
        disabled={voting}
        onClick={() => void handleVote('down')}
        aria-label="โค้ดใช้ไม่ได้"
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
          userVote === 'down'
            ? 'bg-red-100 text-red-600'
            : 'bg-neutral-100 text-neutral-500 hover:bg-red-50 hover:text-red-500'
        }`}
      >
        👎{downvotes > 0 && <span>{downvotes}</span>}
      </button>
    </div>
  )
}
