'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('cookie_consent', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white px-4 py-3 shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4">
      <p className="text-xs text-neutral-600">
        เว็บไซต์นี้ใช้คุกกี้ที่จำเป็นสำหรับการทำงานของระบบและการชำระเงิน
        การใช้งานต่อถือว่ายอมรับ{' '}
        <Link href="/privacy" className="font-semibold text-indigo-600 underline">
          นโยบายความเป็นส่วนตัว
        </Link>
      </p>
      <button
        onClick={accept}
        className="mt-2 w-full rounded-full bg-black px-5 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 sm:mt-0 sm:w-auto"
      >
        ยอมรับ
      </button>
    </div>
  )
}
