'use client'

import { useState, type ReactElement } from 'react'

import type { OwnedMediaChannel } from '@/lib/owned-media-consent'

interface OwnedMediaCaptureCardProps {
  email: string | null
  isLoggedIn: boolean
  emailOptIn: boolean
  lineOptIn: boolean
  source: string
  loginHref: string
}

async function submitOwnedMediaConsent(channel: OwnedMediaChannel, source: string): Promise<void> {
  const response = await fetch('/api/user/owned-media', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel, source }),
  })

  if (!response.ok) {
    throw new Error(`Failed to save ${channel} consent`)
  }
}

export function OwnedMediaCaptureCard({
  email,
  isLoggedIn,
  emailOptIn,
  lineOptIn,
  source,
  loginHref,
}: OwnedMediaCaptureCardProps): ReactElement {
  const [emailEnabled, setEmailEnabled] = useState(emailOptIn)
  const [lineEnabled, setLineEnabled] = useState(lineOptIn)
  const [loading, setLoading] = useState<OwnedMediaChannel | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOptIn(channel: OwnedMediaChannel): Promise<void> {
    if (loading || (channel === 'email' && emailEnabled) || (channel === 'line' && lineEnabled)) return

    setLoading(channel)
    setError(null)

    try {
      await submitOwnedMediaConsent(channel, source)
      if (channel === 'email') setEmailEnabled(true)
      if (channel === 'line') setLineEnabled(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save consent')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">
        Owned Media
      </p>
      <h2 className="mt-1 text-xl font-black text-neutral-950">รับดีลซ้ำโดยไม่ต้องรอหาใหม่</h2>
      <p className="mt-1 text-sm leading-6 text-sky-900/75">
        เปิดรับดีลทาง LINE หรืออีเมลได้แบบไม่บังคับ การไปหน้าสินค้าและการนับ affiliate redirect ยังทำงานตามเดิม
      </p>

      {!isLoggedIn && (
        <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-sm text-neutral-700">
          <p className="font-semibold">ล็อกอินก่อนแล้วค่อยเปิดรับดีลส่วนตัวได้</p>
          <a
            href={loginHref}
            className="mt-3 inline-flex rounded-2xl bg-sky-600 px-4 py-3 text-sm font-black text-white"
          >
            เข้าสู่ระบบเพื่อบันทึกการยินยอม
          </a>
        </div>
      )}

      {isLoggedIn && (
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-neutral-900">Email deal alerts</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  {email ? `ใช้ ${email}` : 'ใช้บัญชีที่ล็อกอินอยู่'} สำหรับรับดีลและรีมายด์คูปอง
                </p>
              </div>
              <button
                type="button"
                onClick={() => { void handleOptIn('email') }}
                disabled={emailEnabled || loading !== null}
                className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {emailEnabled ? 'เปิดแล้ว' : loading === 'email' ? 'กำลังบันทึก...' : 'เปิดอีเมล'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-neutral-900">LINE deal alerts</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  ใช้สิทธิ์นี้เป็นฐานสำหรับส่งดีลกลับมาในช่องทาง LINE ที่เชื่อมไว้ภายหลัง
                </p>
              </div>
              <button
                type="button"
                onClick={() => { void handleOptIn('line') }}
                disabled={lineEnabled || loading !== null}
                className="rounded-xl bg-[#06C755] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {lineEnabled ? 'เปิดแล้ว' : loading === 'line' ? 'กำลังบันทึก...' : 'เปิด LINE'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600">{error}</p>
          )}
        </div>
      )}
    </section>
  )
}
