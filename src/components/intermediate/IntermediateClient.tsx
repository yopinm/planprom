'use client'

// IntermediateClient — TASK 1.11
// TASK 4.3 — Image Optimization (SafeImage migration)
// Handles: countdown auto-redirect, Copy & Go, AdBlocker detection
// Rendered by: app/go/[id]/page.tsx (Server Component passes props)

import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import type { Platform } from '@/types'
import { track } from '@/lib/analytics-client'
import { SafeImage } from '@/components/product/SafeImage'
import { OwnedMediaCaptureCard } from '@/components/intermediate/OwnedMediaCaptureCard'
import { CouponVoteButtons } from '@/components/intermediate/CouponVoteButtons'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_LABEL: Record<Platform, string> = {
  shopee: 'Shopee',
  lazada: 'Lazada',
  tiktok: 'TikTok Shop',
}

const PLATFORM_COLOR: Record<Platform, string> = {
  shopee: 'bg-orange-500',
  lazada: 'bg-blue-600',
  tiktok: 'bg-black',
}


// ---------------------------------------------------------------------------
// CopyButton (inline — used only here)
// ---------------------------------------------------------------------------

function CopyButton({
  code,
  onCopied,
  className,
}: {
  code: string
  onCopied: () => void
  className?: string
}): ReactElement {
  const [copied, setCopied] = useState(false)

  async function handleCopy(): Promise<void> {
    await copyTextToClipboard(code)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(50)
    setCopied(true)
    onCopied()
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
      aria-label={copied ? 'คัดลอกโค้ดแล้ว' : 'คัดลอกโค้ดส่วนลด'}
    >
      {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
    </button>
  )
}

async function copyTextToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for browsers without clipboard API.
    const el = document.createElement('textarea')
    el.value = text
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px'
    document.body.appendChild(el)
    el.focus()
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

// ---------------------------------------------------------------------------
// Coupon expiry countdown hook (CONV-1)
// ---------------------------------------------------------------------------

function useCouponCountdown(expireAt: string | null): string | null {
  const [msLeft, setMsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!expireAt) return
    const target = new Date(expireAt).getTime()
    const tick = (): void => setMsLeft(target - Date.now())
    tick()
    const timer = setInterval(tick, 60_000)
    return () => clearInterval(timer)
  }, [expireAt])

  if (msLeft === null || msLeft <= 0) return null
  const hoursLeft = Math.floor(msLeft / 3_600_000)
  if (hoursLeft >= 48) return null
  const minutesLeft = Math.floor((msLeft % 3_600_000) / 60_000)
  return hoursLeft > 0
    ? `⏰ โค้ดหมดอายุใน ${hoursLeft} ชม. ${minutesLeft} น.`
    : `⏰ โค้ดหมดอายุใน ${minutesLeft} น.`
}

// ---------------------------------------------------------------------------
// AdBlocker detection hook
// ---------------------------------------------------------------------------

function useAdBlockerDetection(): boolean {
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async (): Promise<void> => {
      try {
        // Create a bait element — adblockers typically hide elements with ad-related class names
        const bait = document.createElement('div')
        bait.className = 'adsbox ads ad-banner'
        bait.style.cssText =
          'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;'
        document.body.appendChild(bait)
        // Wait a tick for the adblocker to apply
        await new Promise(r => setTimeout(r, 150))
        if (!cancelled) {
          const blocked = bait.offsetHeight === 0
          setDetected(blocked)
        }
        document.body.removeChild(bait)
      } catch {
        // Ignore — assume no adblocker on error
      }
    }
    check()
    return () => { cancelled = true }
  }, [])

  return detected
}

// ---------------------------------------------------------------------------
// AdBlocker Notice Modal (inline)
// ---------------------------------------------------------------------------

function AdBlockerModal({ onDismiss }: { onDismiss: () => void }): ReactElement {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="AdBlocker Notice"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <p className="text-3xl">⚠️</p>
        <h2 className="mt-3 text-lg font-black text-black">ตรวจพบ AdBlocker</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          กรุณาปิด AdBlocker เพื่อรับคูปองที่แม่นยำที่สุด
          และช่วยให้เราพัฒนาบริการนี้ต่อไปได้ฟรี
        </p>
        <button
          onClick={onDismiss}
          className="mt-5 w-full rounded-2xl bg-orange-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-orange-700"
        >
          เข้าใจแล้ว ไปต่อ
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step Guide (inline)
// ---------------------------------------------------------------------------

function StepGuide({ platform }: { platform: Platform }): ReactElement {
  const steps = [
    { n: '1', text: 'คัดลอกโค้ดส่วนลดด้านบน' },
    { n: '2', text: `ไปที่แอป ${PLATFORM_LABEL[platform]}` },
    { n: '3', text: 'วางโค้ดก่อนกดจ่ายเงิน' },
  ]
  return (
    <div className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
        วิธีใช้คูปอง
      </p>
      <div className="mt-3 space-y-3">
        {steps.map(({ n, text }) => (
          <div key={n} className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-black text-white">
              {n}
            </span>
            <p className="text-sm font-semibold text-black">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatPrice(value: number): string {
  return value.toLocaleString('th-TH')
}

function RewardSummary({
  productPrice,
  productOriginalPrice,
  couponCode,
  platformLabel,
}: {
  productPrice: number
  productOriginalPrice: number | null
  couponCode: string | null
  platformLabel: string
}): ReactElement {
  const storeDiscount = productOriginalPrice && productOriginalPrice > productPrice
    ? productOriginalPrice - productPrice
    : 0

  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Deal Confirmation
          </p>
          <h2 className="mt-1 text-xl font-black text-neutral-950">ดีลพร้อมใช้แล้ว</h2>
          <p className="mt-1 text-sm leading-6 text-emerald-900/75">
            เราเตรียมลิงก์และโค้ดให้พร้อม ก่อนพาไปจ่ายเงินที่ {platformLabel}
          </p>
        </div>
        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
          พร้อม
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400">
            ราคาเริ่มที่
          </p>
          <p className="mt-1 text-lg font-black text-neutral-950">฿{formatPrice(productPrice)}</p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400">
            ส่วนลดหน้าร้าน
          </p>
          <p className="mt-1 text-lg font-black text-emerald-700">
            {storeDiscount > 0 ? `฿${formatPrice(storeDiscount)}` : 'เช็กต่อในร้าน'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm font-bold text-neutral-700">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5">
          <span>ลิงก์ติดตามดีล</span>
          <span className="text-emerald-700">พร้อม</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5">
          <span>โค้ดคูปอง</span>
          <span className={couponCode ? 'text-emerald-700' : 'text-neutral-500'}>
            {couponCode ? 'พร้อมคัดลอก' : 'ไม่มีโค้ดเพิ่ม'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5">
          <span>Disclosure affiliate</span>
          <span className="text-emerald-700">แสดงแล้ว</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export interface IntermediateClientProps {
  productId:  string
  productName: string
  productImage: string | null
  productPrice: number
  productOriginalPrice: number | null
  shopName: string | null
  platform: Platform
  /** Human-readable destination name derived from product.url (e.g. "Sephora", "Lazada") */
  destinationLabel?: string
  couponCode: string | null
  /** Relative URL to the affiliate redirect worker, e.g. /api/r?id=...&platform=...  */
  redirectUrl: string
  isMobile: boolean
  /** Sub ID from the originating CTA — passed through for analytics attribution */
  subId?: string | null
  couponExpireAt?: string | null
  ownedMediaEmail: string | null
  ownedMediaLoggedIn: boolean
  ownedMediaEmailOptIn: boolean
  ownedMediaLineOptIn: boolean
  ownedMediaLoginHref: string
  ownedMediaSource: string
}

export function IntermediateClient({
  productId,
  productName,
  productImage,
  productPrice,
  productOriginalPrice,
  shopName,
  platform,
  destinationLabel: destinationLabelProp,
  couponCode,
  redirectUrl,
  isMobile,
  subId,
  couponExpireAt,
  ownedMediaEmail,
  ownedMediaLoggedIn,
  ownedMediaEmailOptIn,
  ownedMediaLineOptIn,
  ownedMediaLoginHref,
  ownedMediaSource,
}: IntermediateClientProps): ReactElement {
  const [codeCopied, setCodeCopied] = useState(false)
  const [couponRevealed, setCouponRevealed] = useState(false)
  const [couponHidden, setCouponHidden] = useState(false)
  const [adBlockerDismissed, setAdBlockerDismissed] = useState(false)
  const [showExitToast, setShowExitToast] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showVoteToast, setShowVoteToast] = useState(false)
  const [voteDismissed, setVoteDismissed] = useState(false)
  const exitTriggered = useRef(false)
  const voteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAdBlocker = useAdBlockerDetection()
  const couponCountdown = useCouponCountdown(couponExpireAt ?? null)

  // Track intermediate page view + CTA impression on mount
  useEffect(() => {
    track('intermediate_view', { product_id: productId, platform, sub_id: subId ?? null })
    track('cta_impression', { variant_name: 'intermediate_primary', has_coupon: Boolean(couponCode) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-redirect countdown — starts after coupon reveal+copy
  useEffect(() => {
    if (!couponRevealed || !codeCopied || countdown !== null) return
    setCountdown(3)
  }, [couponRevealed, codeCopied]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) { void handlePrimaryAction(); return }
    const t = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [countdown]) // eslint-disable-line react-hooks/exhaustive-deps

  // Exit intent — desktop only, fire once, suppress after redirect (CONV-4)
  const dismissExitToast = useCallback(() => setShowExitToast(false), [])
  useEffect(() => {
    if (isMobile || !couponCode) return
    function handleMouseLeave(e: MouseEvent): void {
      if (e.clientY <= 5 && !exitTriggered.current) {
        exitTriggered.current = true
        setShowExitToast(true)
        setTimeout(() => setShowExitToast(false), 5000)
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [isMobile, couponCode])

  // Show vote feedback toast 30s after coupon is copied (LIVECPN-4)
  useEffect(() => {
    if (!codeCopied || !couponCode || voteDismissed) return
    voteTimerRef.current = setTimeout(() => setShowVoteToast(true), 30_000)
    return () => { if (voteTimerRef.current) clearTimeout(voteTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeCopied])

  // Auto-dismiss the vote toast after 12s if no action
  useEffect(() => {
    if (!showVoteToast) return
    const t = setTimeout(() => { setShowVoteToast(false); setVoteDismissed(true) }, 12_000)
    return () => clearTimeout(t)
  }, [showVoteToast])

  const showAdBlockerModal = hasAdBlocker && !adBlockerDismissed


  function redirectNow(): void {
    window.open(redirectUrl, '_blank', 'noopener,noreferrer')
  }

  async function handlePrimaryAction(): Promise<void> {
    track('cta_click', { variant_name: 'intermediate_primary', has_coupon: Boolean(couponCode) })

    if (couponCode) {
      await copyTextToClipboard(couponCode)
      setCodeCopied(true)
      track('coupon_copy', {
        coupon_code: couponCode,
        product_id:  productId,
        platform,
        sub_id:      subId ?? null,
        action:      'primary_cta',
      })
    }

    track('intermediate_continue', {
      product_id: productId,
      platform,
      sub_id:     subId ?? null,
      has_coupon: Boolean(couponCode),
      action:     'primary_cta',
    })
    redirectNow()
  }

  async function handleReveal(): Promise<void> {
    if (!couponCode) return
    setCouponRevealed(true)
    await copyTextToClipboard(couponCode)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(50)
    setCodeCopied(true)
    track('coupon_reveal', {
      coupon_code: couponCode,
      product_id:  productId,
      platform,
      sub_id:      subId ?? null,
    })
  }

  function handleCouponCopied(): void {
    setCodeCopied(true)

    if (!couponCode) return

    track('coupon_copy', {
      coupon_code: couponCode,
      product_id:  productId,
      platform,
      sub_id:      subId ?? null,
      action:      'coupon_button',
    })
  }

  const platformLabel = PLATFORM_LABEL[platform]
  const platformColor = PLATFORM_COLOR[platform]
  // destinationLabel = actual merchant name from URL; falls back to platform label
  const destinationLabel = destinationLabelProp ?? platformLabel
  const primaryCtaLabel = couponCode
    ? `คัดลอกโค้ดแล้วไป ${destinationLabel} เลย`
    : `ไปที่ ${destinationLabel} เลย`
  const stickyStatusLabel = couponCode
    ? (codeCopied ? 'คัดลอกโค้ดแล้ว พร้อมไปซื้อ' : 'แตะครั้งเดียว คัดลอกโค้ดแล้วไปซื้อ')
    : 'แตะเพื่อไปหน้าสินค้า'

  return (
    <>
      {showAdBlockerModal && (
        <AdBlockerModal onDismiss={() => setAdBlockerDismissed(true)} />
      )}

      {/* Exit intent toast (CONV-4) */}
      {showExitToast && couponCode && (
        <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-orange-300 bg-white px-5 py-3.5 shadow-xl">
          <span className="text-xl">⏰</span>
          <p className="text-sm font-black text-black">
            รอก่อน! โค้ด <span className="text-orange-600">{couponCode}</span> หมดอายุในคืนนี้
          </p>
          <button
            type="button"
            onClick={dismissExitToast}
            className="ml-2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex min-h-screen items-center justify-center bg-orange-50 px-4 pt-8 pb-36 sm:pb-8">
        <div className="w-full max-w-sm space-y-4">

          {/* ── Header ── */}
          <div className="text-center">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold text-white ${platformColor}`}>
              {platformLabel}
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-black">
              ดีลพร้อมแล้ว กดรับได้เลย
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              กดปุ่มด้านล่างเพื่อเปิด{' '}
              <span className="font-extrabold text-orange-600">{destinationLabel}</span>{' '}
              ในแท็บใหม่
            </p>
          </div>

          {/* ── Product Card ── */}
          <div className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm transition hover:border-orange-400">
            <div className="flex items-start gap-4">
              <SafeImage
                src={productImage}
                alt={productName}
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-extrabold leading-snug text-black">
                  {productName}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {shopName ? `${shopName} · ${destinationLabel}` : destinationLabel}
                </p>
                <p className="mt-2 text-lg font-black text-orange-600">
                  ฿{formatPrice(productPrice)}
                </p>
              </div>
            </div>
          </div>

          <RewardSummary
            productPrice={productPrice}
            productOriginalPrice={productOriginalPrice}
            couponCode={couponCode}
            platformLabel={destinationLabel}
          />

          {/* ── Coupon Code ── */}
          {couponCode && !couponHidden && (
            <div className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                โค้ดส่วนลด
              </p>
              {!couponRevealed ? (
                <button
                  type="button"
                  onClick={() => { void handleReveal() }}
                  className="mt-3 w-full rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 px-4 py-4 text-center transition hover:bg-orange-100 active:scale-[0.99]"
                  aria-label="แตะเพื่อดูโค้ดส่วนลด"
                >
                  <p className="text-sm font-black text-orange-600">แตะเพื่อดูโค้ดส่วนลด 🎁</p>
                  <p className="mt-1 text-xs text-neutral-500">โค้ดจะถูกคัดลอกอัตโนมัติ</p>
                </button>
              ) : (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 px-4 py-3 text-center">
                    <span className="text-lg font-black tracking-widest text-orange-600">
                      {couponCode}
                    </span>
                  </div>
                  <CopyButton
                    code={couponCode}
                    onCopied={handleCouponCopied}
                    className="min-h-12 min-w-24 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-orange-700 shadow-md"
                  />
                </div>
              )}
              {codeCopied && countdown === null && (
                <p className="mt-2 text-center text-xs font-bold text-green-600">
                  ✓ คัดลอกแล้ว — กดปุ่มส้มด้านล่างเพื่อไปซื้อ
                </p>
              )}
              {countdown !== null && (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2">
                  <p className="text-xs font-black text-orange-600">
                    กำลังพาไป {destinationLabel} ใน {countdown}...
                  </p>
                  <button
                    type="button"
                    onClick={() => setCountdown(null)}
                    className="text-xs font-semibold text-neutral-400 underline underline-offset-2"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}

              {/* Urgency countdown (CONV-1) */}
              {couponCountdown && (
                <p className="mt-2 text-center text-xs font-black text-red-600">
                  {couponCountdown}
                </p>
              )}

              {/* Vote toast triggered 30s after copy — see floating toast below */}
            </div>
          )}

          {/* ── Step Guide (shown only when there's a coupon code) ── */}
          {couponCode && !couponHidden && <StepGuide platform={platform} />}

          {/* ── Copy & Go (primary CTA) ── */}
          <button
            type="button"
            onClick={() => {
              void handlePrimaryAction()
            }}
            className="hidden w-full items-center justify-center rounded-2xl bg-orange-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 sm:flex"
          >
            {primaryCtaLabel}
          </button>

          {/* ── Fallback link ── */}
          <p className="text-center text-xs text-neutral-400">
            หรือ{' '}
            <a
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track('intermediate_continue', {
                  product_id: productId,
                  platform,
                  sub_id:     subId ?? null,
                  has_coupon: Boolean(couponCode),
                  action:     'manual_link',
                })
              }}
              className="font-bold text-orange-600 underline underline-offset-2"
            >
              คลิกเพื่อเปิดลิงก์
            </a>
          </p>

          <OwnedMediaCaptureCard
            email={ownedMediaEmail}
            isLoggedIn={ownedMediaLoggedIn}
            emailOptIn={ownedMediaEmailOptIn}
            lineOptIn={ownedMediaLineOptIn}
            source={ownedMediaSource}
            loginHref={ownedMediaLoginHref}
          />

          {/* ── Affiliate Disclosure ── */}
          <p className="text-center text-[11px] leading-5 text-neutral-400">
            เราอาจได้รับค่าคอมมิชชันเมื่อท่านซื้อผ่านลิงก์นี้
            ราคาสำหรับท่านไม่เปลี่ยนแปลง
          </p>
        </div>
      </main>

      {/* LIVECPN-4: Vote feedback toast — appears 30s after coupon copy */}
      {showVoteToast && !voteDismissed && couponCode && (
        <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 rounded-2xl border border-orange-200 bg-white px-4 py-3 shadow-xl sm:bottom-8">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-neutral-800">โค้ดนี้ใช้ได้ไหม? 🎁</p>
            <button
              type="button"
              onClick={() => { setShowVoteToast(false); setVoteDismissed(true) }}
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>
          <CouponVoteButtons
            couponCode={couponCode}
            productId={productId}
            onHide={() => {
              setShowVoteToast(false)
              setVoteDismissed(true)
              setCouponHidden(true)
            }}
            onVoted={() => {
              setTimeout(() => { setShowVoteToast(false); setVoteDismissed(true) }, 1_200)
            }}
          />
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-200 bg-white/95 px-4 py-3 shadow-[0_-10px_40px_rgba(249,115,22,0.15)] backdrop-blur sm:hidden">
        <div className="mx-auto max-w-sm">
          <p className="mb-2 text-center text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            {stickyStatusLabel}
          </p>
          <button
            type="button"
            onClick={() => {
              void handlePrimaryAction()
            }}
            className={`flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-orange-200 transition active:scale-[0.99] ${codeCopied ? 'animate-pulse' : ''}`}
          >
            {primaryCtaLabel}
          </button>
          <p className="mt-2 text-center text-[10px] leading-4 text-neutral-400">
            เราอาจได้รับค่าคอมมิชชันจากลิงก์นี้ · ราคาไม่เปลี่ยน
          </p>
        </div>
      </div>
    </>
  )
}
