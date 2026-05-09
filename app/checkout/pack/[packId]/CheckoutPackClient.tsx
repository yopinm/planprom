'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const LINE_OA_URL = 'https://line.me/R/ti/p/%40216xobzv?gid=7820ade2-85c7-430f-b000-3b74292fe6f1'
const POLL_INTERVAL_MS = 3000

type Step = 'info' | 'add_line' | 'loading' | 'qr' | 'done' | 'error'

interface PackInfo {
  id:      string
  price:   number
  count:   number
  label:   string
  perItem: number
}

interface Props {
  pack: PackInfo
  isLoggedIn: boolean
}

export default function CheckoutPackClient({ pack, isLoggedIn }: Props) {
  const router = useRouter()
  const [step,        setStep]        = useState<Step>(isLoggedIn ? 'add_line' : 'info')
  const [packOrderId, setPackOrderId] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [qrImageUrl,  setQrImageUrl]  = useState('')
  const [errMsg,      setErrMsg]      = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start polling when in qr step
  useEffect(() => {
    if (step !== 'qr' || !packOrderId) return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/pack-orders/${packOrderId}/status`)
        const json = await res.json() as { status: string; available: number }
        if (json.status === 'active') {
          clearInterval(pollRef.current!)
          setStep('done')
        }
      } catch { /* ignore poll errors */ }
    }, POLL_INTERVAL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [step, packOrderId])

  // Auto-redirect to /templates 2s after done
  useEffect(() => {
    if (step !== 'done') return
    const t = setTimeout(() => router.push('/templates'), 2000)
    return () => clearTimeout(t)
  }, [step, router])

  async function handleLineAdded() {
    setStep('loading')
    try {
      const res  = await fetch('/api/pack-orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ packId: pack.id }),
      })
      const json = await res.json() as {
        packOrderId?: string; orderNumber?: string; qrImageUrl?: string; error?: string
      }
      if (json.error) { setErrMsg(json.error); setStep('error'); return }
      setPackOrderId(json.packOrderId!)
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

        {/* Pack summary */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 text-center">
          <p className="text-xs text-neutral-500 font-medium tracking-widest uppercase mb-1">แพ็กที่เลือก</p>
          <p className="text-3xl font-black text-neutral-900">฿{pack.price}</p>
          <p className="text-emerald-700 font-semibold">{pack.count} credits · ดาวน์โหลดได้ {pack.count} ชิ้น</p>
          <span className="inline-block mt-1 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800">
            {pack.label}
          </span>
        </div>

        {/* Info step — shown to non-logged-in users */}
        {step === 'info' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">🎫</div>
            <h2 className="text-lg font-bold text-gray-900">แพ็กเครดิต ฿{pack.price}</h2>
            <ul className="w-full text-left space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">✅ ดาวน์โหลดได้ <strong>{pack.count} ชิ้น</strong> เลือกเทมเพลตไหนก็ได้</li>
              <li className="flex items-center gap-2">✅ ราคา <strong>฿{pack.perItem}/ชิ้น</strong> ประหยัดกว่าซื้อแยก</li>
              <li className="flex items-center gap-2">✅ ใช้ได้ 90 วัน นับจากวันชำระเงิน</li>
              <li className="flex items-center gap-2">✅ ชำระผ่าน PromptPay — ยืนยันอัตโนมัติ</li>
            </ul>
            <a
              href={`/api/auth/line?next=${encodeURIComponent(`/checkout/pack/${pack.id}`)}`}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition"
            >
              เข้าสู่ระบบด้วย LINE เพื่อชำระเงิน
            </a>
            <button
              onClick={() => router.back()}
              className="text-sm text-neutral-400 hover:text-neutral-600"
            >
              ← กลับ
            </button>
          </div>
        )}

        {/* Step 1 — Add LINE */}
        {step === 'add_line' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-4xl">💬</div>
            <h2 className="text-lg font-bold text-gray-900">ขั้นตอนที่ 1 · เพิ่มเพื่อน LINE OA</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              ระบบจะส่ง <strong>ยืนยัน credits</strong> มาทาง LINE หลังชำระเงิน
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
            <p className="text-xs text-gray-400">* เป็นเพื่อนกันอยู่แล้ว กดดำเนินการต่อได้เลย</p>
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
              <p><span className="font-semibold">จำนวน:</span> ฿{pack.price}</p>
              <p><span className="font-semibold">ได้รับ:</span> {pack.count} credits</p>
              <p><span className="font-semibold">เลข order:</span> {orderNumber}</p>
            </div>
            {/* รอชำระ — shows polling status */}
            <div className="w-full py-3 bg-neutral-200 rounded-xl flex items-center justify-center gap-2 text-neutral-600 font-semibold text-sm">
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              รอชำระ · ตรวจสอบอัตโนมัติ
            </div>
            <p className="text-xs text-gray-400 text-center">
              สแกน QR ด้วยแอปธนาคาร · ระบบยืนยันอัตโนมัติหลังชำระ
            </p>
          </div>
        )}

        {/* Done — auto-redirect */}
        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">🎫</div>
            <h2 className="text-lg font-bold text-gray-900">ชำระเงินสำเร็จ!</h2>
            <p className="text-sm text-gray-600">
              ได้รับ <strong>{pack.count} credits</strong> แล้ว<br />
              กำลังพาไปหน้าเลือก Template…
            </p>
            <div className="w-full py-3 bg-emerald-100 rounded-xl text-emerald-700 text-sm font-semibold flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              กำลัง redirect…
            </div>
            <p className="text-xs text-gray-400">เลข order: {orderNumber}</p>
          </div>
        )}

        {/* Error */}
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
