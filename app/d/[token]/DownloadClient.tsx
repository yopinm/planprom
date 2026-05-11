'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  token: string
  orderNumber: string
  title: string
  templateSlug: string
  remaining: number
  expiresAt: string
}

export default function DownloadClient({ token, orderNumber, title, templateSlug, remaining, expiresAt }: Props) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    if (state === 'done') router.refresh()
  }, [state, router])

  const expiresDate = new Date(expiresAt)
  const expiresStr  = expiresDate.toLocaleString('th-TH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  async function handleDownload() {
    if (state === 'downloading') return
    setState('downloading')
    setErrMsg('')
    try {
      const res = await fetch(`/api/download/${token}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErrMsg((j as { error?: string }).error ?? `ดาวน์โหลดไม่สำเร็จ (${res.status})`)
        setState('error')
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${title}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setState('done')
    } catch {
      setErrMsg('เกิดข้อผิดพลาด — กรุณาลองใหม่')
      setState('error')
    }
  }

  const shareText = encodeURIComponent(`ซื้อ ${title} จาก แพลนพร้อม — เช็คทุกขั้น แพลนทุกวัน ง่ายทุกงานวางแผน`)
  const shareUrl  = encodeURIComponent(`https://planprom.com/templates/${templateSlug}`)
  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${shareUrl}&text=${shareText}`

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center space-y-5">
        <div className="text-5xl">📄</div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg">{title}</h1>
          <p className="text-xs text-gray-400 mt-1">เลข order: {orderNumber}</p>
        </div>

        <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800 space-y-1">
          <p>เหลืออีก <strong>{remaining} ครั้ง</strong></p>
          <p>ลิงก์หมดอายุ: {expiresStr}</p>
        </div>

        {state === 'error' && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠️ {errMsg}
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={state === 'downloading'}
          className="block w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold rounded-xl transition"
        >
          {state === 'downloading' ? '⏳ กำลังดาวน์โหลด…'
            : state === 'done'     ? '✅ ดาวน์โหลดสำเร็จ — กดอีกครั้งได้'
            : '⬇️ ดาวน์โหลด PDF'}
        </button>


        {state === 'done' && (
          <Link
            href="/orders"
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition"
          >
            📋 ดูประวัติการสั่งซื้อ
          </Link>
        )}

        {(state === 'done' || remaining <= 2) && (
          <a
            href={lineShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#06C755] hover:bg-green-500 text-white font-bold rounded-xl transition"
          >
            <span className="text-lg">💬</span> แชร์ให้เพื่อนทาง LINE
          </a>
        )}

        <p className="text-xs text-gray-400">
          หากมีปัญหา ติดต่อ LINE OA แพลนพร้อม
        </p>
      </div>
    </div>
  )
}
