'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CartData } from '@/lib/cart'
import { PromoCodeInput } from '@/components/checkout/PromoCodeInput'

type Step = 'summary' | 'creating' | 'qr' | 'done' | 'error'

interface DownloadItem { title: string; downloadUrl: string | null }

const POLL_INTERVAL_MS = 3000
const QR_EXPIRY_SECS   = 120

function tierPrice(position: number): number {
  if (position === 1) return 20
  if (position <= 5)  return 8
  return 7
}

export default function CheckoutPage() {
  const router = useRouter()
  const [step,         setStep]         = useState<Step>('summary')
  const [cart,         setCart]         = useState<CartData | null>(null)
  const [orderUid,     setOrderUid]     = useState('')
  const [qrUrl,        setQrUrl]        = useState('')
  const [total,        setTotal]        = useState(0)
  const [items,        setItems]        = useState<DownloadItem[]>([])
  const [errMsg,       setErrMsg]       = useState('')
  const [qrExpired,    setQrExpired]    = useState(false)
  const [qrSecsLeft,   setQrSecsLeft]   = useState(QR_EXPIRY_SECS)
  const [refreshingQr, setRefreshingQr] = useState(false)
  const [promoCode,    setPromoCode]    = useState<string | null>(null)
  const [promoDiscount,setPromoDiscount]= useState(0)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const expiryRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/cart')
      .then(r => r.ok ? r.json() as Promise<CartData> : null)
      .then(data => setCart(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (step !== 'qr' || !orderUid) return

    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/checkout/${orderUid}/status`)
        const json = await res.json() as { status: string }
        if (json.status === 'paid') {
          clearInterval(pollRef.current!)
          clearInterval(expiryRef.current!)
          router.push(`/order/${orderUid}`)
        }
      } catch { /* ignore */ }
    }, POLL_INTERVAL_MS)

    // QR expiry countdown — shows "สร้าง QR ใหม่" when it reaches 0, NOT a payment bypass
    setQrExpired(false)
    setQrSecsLeft(QR_EXPIRY_SECS)
    expiryRef.current = setInterval(() => {
      setQrSecsLeft(s => {
        if (s <= 1) {
          clearInterval(expiryRef.current!)
          setQrExpired(true)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => {
      if (pollRef.current)  clearInterval(pollRef.current)
      if (expiryRef.current) clearInterval(expiryRef.current)
    }
  }, [step, orderUid, router])

  async function handleCreateOrder() {
    setStep('creating')
    try {
      const res  = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promo_code: promoCode ?? undefined }),
      })
      const json = await res.json() as {
        orderUid?: string; qrImageUrl?: string; total?: number; paid?: boolean; error?: string
      }
      if (!res.ok || json.error) { setErrMsg(json.error ?? 'เกิดข้อผิดพลาด'); setStep('error'); return }
      setOrderUid(json.orderUid!)
      setTotal(json.total ?? 0)
      if (json.paid) {
        const statusRes  = await fetch(`/api/checkout/${json.orderUid}/status`)
        const statusJson = await statusRes.json() as { items?: DownloadItem[] }
        setItems(statusJson.items ?? [])
        setStep('done')
      } else {
        setQrUrl(json.qrImageUrl ?? '')
        setStep('qr')
      }
    } catch {
      setErrMsg('เกิดข้อผิดพลาด — กรุณาลองใหม่')
      setStep('error')
    }
  }

  async function handleRefreshQr() {
    setRefreshingQr(true)
    try {
      const res  = await fetch(`/api/checkout/${orderUid}/refresh-qr`, { method: 'POST' })
      const json = await res.json() as { qrImageUrl?: string; error?: string }
      if (!res.ok || json.error) { setErrMsg(json.error ?? 'เกิดข้อผิดพลาด'); setStep('error'); return }
      setQrUrl(json.qrImageUrl ?? '')
      setQrExpired(false)
      setQrSecsLeft(QR_EXPIRY_SECS)
      expiryRef.current = setInterval(() => {
        setQrSecsLeft(s => {
          if (s <= 1) {
            clearInterval(expiryRef.current!)
            setQrExpired(true)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } catch {
      setErrMsg('เกิดข้อผิดพลาด — กรุณาลองใหม่')
      setStep('error')
    } finally {
      setRefreshingQr(false)
    }
  }

  function handleDownloadAll() {
    items.forEach((item, i) => {
      if (!item.downloadUrl) return
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = item.downloadUrl!
        a.download = item.title
        a.click()
      }, i * 800)
    })
  }

  const paidCount   = cart?.totals.paidItemCount ?? 0
  const cartTotal   = cart?.totals.total ?? 0
  const finalTotal  = Math.max(0, cartTotal - promoDiscount)

  const cartItemsWithPrice = (() => {
    if (!cart) return []
    let idx = 0
    return cart.items.map(item => ({
      ...item,
      unitPrice: item.tier === 'free' ? 0
        : item.isRequestOnly ? item.priceBaht
        : tierPrice(++idx),
    }))
  })()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-sm space-y-4">

        {step === 'summary' && cart && (
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            <h1 className="text-lg font-bold text-gray-900">สรุปรายการ</h1>
            <ul className="divide-y divide-gray-100 text-sm">
              {cartItemsWithPrice.map(item => (
                <li key={item.cartItemId} className="flex justify-between py-2">
                  <span className="truncate pr-2 text-gray-700">{item.title}</span>
                  <span className="shrink-0 font-semibold text-gray-600">
                    {item.unitPrice === 0 ? 'ฟรี' : `฿${item.unitPrice}`}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>ราคารวม</span>
                <span>฿{cartTotal}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                  <span>ส่วนลด ({promoCode})</span>
                  <span>-฿{promoDiscount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>ชำระ</span>
                <span>฿{finalTotal}</span>
              </div>
            </div>
            {cart.totals.savedVsFullPrice > 0 && (
              <p className="text-xs text-indigo-600 text-right">🎉 ซื้อหลายชิ้น ประหยัดไปอีก ฿{cart.totals.savedVsFullPrice}</p>
            )}
            <PromoCodeInput
              cartTotal={cartTotal}
              paidItemCount={paidCount}
              appliedCode={promoCode}
              onApply={(discount, code, _label) => {
                setPromoDiscount(discount)
                setPromoCode(code)
              }}
              onRemove={() => { setPromoCode(null); setPromoDiscount(0) }}
            />
            <button
              onClick={handleCreateOrder}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition"
            >
              {paidCount === 0 ? 'รับเทมเพลตฟรี' : `สร้าง QR PromptPay ฿${finalTotal}`}
            </button>
            <Link href="/cart" className="block text-center text-sm text-gray-400 hover:text-gray-600">
              ← กลับแก้ไขตะกร้า
            </Link>
          </div>
        )}

        {step === 'creating' && (
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">กำลังสร้าง QR Code…</p>
          </div>
        )}

        {step === 'qr' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">สแกน QR ชำระเงิน</h2>
            {qrUrl
              ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="PromptPay QR"
                  className={`w-52 h-52 object-contain transition ${qrExpired ? 'opacity-25 grayscale' : ''}`}
                />
              )
              : (
                <div className="w-52 h-52 bg-neutral-100 rounded-xl flex items-center justify-center">
                  <p className="text-xs text-neutral-400">กำลังโหลด QR…</p>
                </div>
              )
            }
            <div className="w-full bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800 space-y-1">
              <p><span className="font-semibold">จำนวน:</span> ฿{total}</p>
              <p><span className="font-semibold">เลข order:</span> {orderUid}</p>
            </div>

            {!qrExpired && (
              <div className="w-full py-2 flex items-center justify-center gap-2 text-neutral-500 text-xs">
                <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                ตรวจสอบการชำระอัตโนมัติ…
              </div>
            )}

            {qrExpired ? (
              <button
                onClick={handleRefreshQr}
                disabled={refreshingQr}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition disabled:opacity-50"
              >
                {refreshingQr ? 'กำลังสร้าง QR ใหม่…' : 'QR หมดอายุ — สร้าง QR ใหม่'}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3 bg-gray-200 text-gray-400 font-bold rounded-xl cursor-not-allowed"
              >
                รอยืนยันการชำระเงิน… ({qrSecsLeft}s)
              </button>
            )}

            <p className="text-xs text-gray-400 text-center">
              {qrExpired
                ? 'QR หมดอายุ — กดเพื่อสร้าง QR ใหม่แล้วสแกนชำระเงิน'
                : 'สแกนด้วยแอปธนาคาร · ระบบจะ redirect อัตโนมัติเมื่อรับเงินแล้ว'}
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">✅</div>
            <h2 className="text-lg font-bold text-gray-900">สำเร็จ!</h2>
            <p className="text-sm text-gray-500">เลข order: <span className="font-mono font-semibold">{orderUid}</span></p>
            <ul className="w-full text-left space-y-2">
              {items.map((item, i) => (
                <li key={i}>
                  {item.downloadUrl
                    ? (
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-100"
                      >
                        <span>📄</span>
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className="shrink-0 text-xs">ดาวน์โหลด ↓</span>
                      </a>
                    )
                    : (
                      <span className="text-sm text-gray-400 line-through">{item.title}</span>
                    )
                  }
                </li>
              ))}
            </ul>
            {items.length > 1 && (
              <button
                onClick={handleDownloadAll}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
              >
                ดาวน์โหลดทุกไฟล์ ({items.length} ชิ้น)
              </button>
            )}
            <p className="text-xs text-gray-400">ลิงก์ใช้ได้ 24 ชม. · สูงสุด 3 ครั้งต่อไฟล์</p>
            <Link
              href={`/order/${orderUid}`}
              className="text-sm text-indigo-500 hover:underline"
            >
              บุ๊กมาร์กหน้านี้ไว้เป็น receipt →
            </Link>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">❌</div>
            <p className="text-sm text-gray-600">{errMsg}</p>
            <Link
              href="/cart"
              className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition block"
            >
              ← กลับไปแก้ไขตะกร้า
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
