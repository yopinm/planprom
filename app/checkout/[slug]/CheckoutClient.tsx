'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const LINE_OA_URL = 'https://line.me/R/ti/p/%40216xobzv?gid=7820ade2-85c7-430f-b000-3b74292fe6f1'
const POLL_INTERVAL_MS = 3000

type Step = 'add_line' | 'loading' | 'qr' | 'claiming' | 'done' | 'suspicious' | 'pending_limit' | 'error' | 'credit_done'

interface Template {
  id:            string
  title:         string
  priceBaht:     number
  tier:          string
  description:   string
  thumbnailPath: string | null
}

interface Props {
  templateSlug:  string
  template:      Template
  creditBalance: number
}

export default function CheckoutClient({ templateSlug, template, creditBalance }: Props) {
  const [step,         setStep]         = useState<Step>('add_line')
  const [orderId,      setOrderId]      = useState('')
  const [orderNumber,  setOrderNumber]  = useState('')
  const [qrImageUrl,   setQrImageUrl]   = useState('')
  const [downloadUrl,  setDownloadUrl]  = useState('')
  const [creditsLeft,  setCreditsLeft]  = useState(creditBalance)
  const [errMsg,       setErrMsg]       = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-poll when in qr step
  useEffect(() => {
    if (step !== 'qr' || !orderId) return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/orders/${orderId}/status`)
        const json = await res.json() as { status: string; downloadUrl?: string }
        if (json.status === 'paid' && json.downloadUrl) {
          clearInterval(pollRef.current!)
          setDownloadUrl(json.downloadUrl)
          setStep('done')
        }
      } catch { /* ignore */ }
    }, POLL_INTERVAL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [step, orderId])

  async function handleUseCredit() {
    setStep('claiming')
    try {
      const res  = await fetch('/api/pack-credits/redeem', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ templateSlug }),
      })
      const json = await res.json() as {
        code?: string; error?: string; downloadUrl?: string; orderNumber?: string; creditsRemaining?: number
      }
      if (json.code === 'NO_CREDITS') { setErrMsg('ไม่มี credits เหลือ — กรุณาซื้อแพ็กใหม่'); setStep('error'); return }
      if (json.error) { setErrMsg(json.error); setStep('error'); return }
      setCreditsLeft(json.creditsRemaining!)
      // Redirect directly to download page — no extra click needed
      window.location.href = json.downloadUrl!
    } catch {
      setErrMsg('เกิดข้อผิดพลาด — กรุณาลองใหม่')
      setStep('error')
    }
  }

  async function handleLineAdded() {
    setStep('loading')
    try {
      const res  = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ templateSlug }),
      })
      const json = await res.json() as {
        code?: string; error?: string
        orderId?: string; orderNumber?: string; qrImageUrl?: string
      }
      if (json.code === 'PENDING_LIMIT') { setStep('pending_limit'); return }
      if (json.error) { setErrMsg(json.error); setStep('error'); return }
      setOrderId(json.orderId!)
      setOrderNumber(json.orderNumber!)
      setQrImageUrl(json.qrImageUrl!)
      setStep('qr')
    } catch {
      setErrMsg('เกิดข้อผิดพลาด — กรุณาลองใหม่')
      setStep('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-sm">

        {/* Template card */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex gap-3 items-start">
          {template.thumbnailPath && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
              <Image src={template.thumbnailPath} alt={template.title} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{template.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
            <p className="text-amber-600 font-bold mt-1">฿{template.priceBaht}</p>
          </div>
        </div>

        {/* Credit balance banner */}
        {creditBalance > 0 && step === 'add_line' && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-emerald-800">🎫 คุณมี {creditsLeft} credits</p>
              <p className="text-xs text-emerald-700">ดาวน์โหลดได้ทันที ไม่ต้องจ่ายเพิ่ม</p>
            </div>
            <button
              onClick={handleUseCredit}
              className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              🎫 ใช้ 1 เครดิต · ดาวน์โหลดทันที
            </button>
          </div>
        )}

        {/* Step 1 — Add LINE OA */}
        {step === 'add_line' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-4xl">💬</div>
            <h2 className="text-lg font-bold text-gray-900">ขั้นตอนที่ 1 · เพิ่มเพื่อน LINE OA</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              ระบบจะส่ง <strong>ลิงก์ดาวน์โหลด</strong> มาทาง LINE OA หลังชำระเงิน
            </p>
            <a
              href={LINE_OA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#06C755] hover:bg-green-500 text-white font-black rounded-xl transition"
            >
              เพิ่มเพื่อน LINE OA @couponkum
            </a>
            <button
              onClick={handleLineAdded}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition"
            >
              เพิ่มเพื่อนแล้ว → ดำเนินการต่อ
            </button>
            <p className="text-xs text-gray-400">
              * ถ้าเป็นเพื่อนกันอยู่แล้ว กดดำเนินการต่อได้เลย
            </p>
          </div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">กำลังสร้าง QR Code…</p>
          </div>
        )}

        {/* Step 2 — Omise PromptPay QR */}
        {step === 'qr' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">ขั้นตอนที่ 2 · สแกน QR ชำระเงิน</h2>
            {qrImageUrl
              ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrImageUrl} alt="PromptPay QR" className="w-52 h-52 object-contain" />
              )
              : (
                <div className="w-52 h-52 flex items-center justify-center bg-neutral-100 rounded-xl">
                  <p className="text-xs text-neutral-400">กำลังโหลด QR…</p>
                </div>
              )
            }
            <div className="w-full bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800 space-y-1">
              <p><span className="font-semibold">จำนวน:</span> ฿{template.priceBaht}</p>
              <p><span className="font-semibold">เลข order:</span> {orderNumber}</p>
            </div>
            {/* รอชำระ — auto-polling indicator */}
            <div className="w-full py-3 bg-neutral-200 rounded-xl flex items-center justify-center gap-2 text-neutral-600 font-semibold text-sm">
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              รอชำระ · ตรวจสอบอัตโนมัติ
            </div>
            <p className="text-xs text-gray-400 text-center">
              สแกน QR ด้วยแอปธนาคาร · ระบบยืนยันอัตโนมัติหลังชำระ
            </p>
          </div>
        )}

        {step === 'claiming' && (
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">กำลังตรวจสอบ…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">✅</div>
            <h2 className="text-lg font-bold text-gray-900">ชำระเงินสำเร็จ!</h2>
            <p className="text-sm text-gray-600">
              ลิงก์ดาวน์โหลดถูกส่งมาทาง <strong>LINE OA</strong> แล้ว<br />
              ใช้ได้ 24 ชม. · สูงสุด 3 ครั้ง
            </p>
            <a
              href={downloadUrl}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition"
              target="_blank" rel="noopener noreferrer"
            >
              ดาวน์โหลดที่นี่
            </a>
            <p className="text-xs text-gray-400">เลข order: {orderNumber}</p>
          </div>
        )}

        {step === 'credit_done' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">🎫</div>
            <h2 className="text-lg font-bold text-gray-900">ใช้ 1 credit สำเร็จ!</h2>
            <p className="text-sm text-gray-600">
              ลิงก์ดาวน์โหลดถูกส่งมาทาง <strong>LINE OA</strong> แล้ว
            </p>
            <p className="text-xs text-emerald-700 font-semibold">🎫 เหลือ {creditsLeft} credits</p>
            <a
              href={downloadUrl}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition"
              target="_blank" rel="noopener noreferrer"
            >
              ดาวน์โหลดที่นี่
            </a>
            <p className="text-xs text-gray-400">เลข order: {orderNumber}</p>
          </div>
        )}

        {step === 'suspicious' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">⏳</div>
            <h2 className="text-lg font-bold text-gray-900">รอการตรวจสอบ</h2>
            <p className="text-sm text-gray-600">
              ระบบพบรูปแบบผิดปกติ — Owner จะส่งลิงก์ให้ทาง LINE ภายใน 1 ชม.
            </p>
          </div>
        )}

        {step === 'pending_limit' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">⏱️</div>
            <h2 className="text-lg font-bold text-gray-900">มีคำสั่งซื้อค้างอยู่ 3 รายการ</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              รอประมาณ <strong>1 ชั่วโมง</strong> แล้วลองใหม่<br />
              หรือติดต่อแอดมินเพื่อยกเลิก order เดิม
            </p>
            <a
              href={LINE_OA_URL}
              target="_blank" rel="noopener noreferrer"
              className="w-full py-3 bg-[#06C755] hover:bg-green-500 text-white font-bold rounded-xl transition"
            >
              ติดต่อแอดมิน LINE OA
            </a>
            <Link href="/orders" className="text-sm text-emerald-600 hover:underline">
              ดูคำสั่งซื้อของฉัน →
            </Link>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">❌</div>
            <h2 className="text-lg font-bold text-gray-900">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-gray-600">{errMsg}</p>
            <button
              onClick={() => setStep('add_line')}
              className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition"
            >
              ← กลับไปเริ่มใหม่
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
